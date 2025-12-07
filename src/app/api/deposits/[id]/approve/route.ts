// ============================================
// PrimeBet - Approve Deposit Manually API
// Permite aprovar depósito manualmente quando webhook falha
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { invalidateBalanceCache } from "@/lib/balance-cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: transactionId } = await params;

    // Verificar autenticação e se é admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "ADMIN" && adminUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Acesso negado. Apenas administradores podem aprovar depósitos." },
        { status: 403 }
      );
    }

    // Buscar transação
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se é um depósito
    if (transaction.type !== TransactionType.DEPOSIT) {
      return NextResponse.json(
        { success: false, error: "Esta transação não é um depósito" },
        { status: 400 }
      );
    }

    // Verificar se já foi processada
    if (transaction.status === TransactionStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: "Este depósito já foi aprovado" },
        { status: 400 }
      );
    }

    // Verificar se está cancelado/expirado
    if (transaction.status === TransactionStatus.CANCELLED || 
        transaction.status === TransactionStatus.EXPIRED ||
        transaction.status === TransactionStatus.FAILED) {
      return NextResponse.json(
        { success: false, error: `Não é possível aprovar um depósito com status: ${transaction.status}` },
        { status: 400 }
      );
    }

    const amount = transaction.amount;
    const userId = transaction.userId;

    // Aprovar depósito em transação atômica
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da transação
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            ...(transaction.metadata as object || {}),
            manualApproval: true,
            approvedBy: session.user?.id,
            approvedByEmail: session.user?.email,
            approvedAt: new Date().toISOString(),
          },
        },
      });

      // 2. Creditar Wallet Game (ou criar se não existir)
      await tx.walletGame.upsert({
        where: { userId },
        update: {
          balance: {
            increment: amount,
          },
        },
        create: {
          userId,
          balance: amount,
        },
      });

      // 3. Log de auditoria
      await tx.auditLog.create({
        data: {
          userId,
          action: "DEPOSIT_MANUAL_APPROVAL",
          entity: "Transaction",
          entityId: transactionId,
          newData: {
            amount: Number(amount),
            approvedBy: session.user?.id,
            approvedByEmail: session.user?.email,
          },
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    });

    // Invalidar cache de saldo
    invalidateBalanceCache(userId);

    console.log(`[Manual Approval] Depósito ${transactionId} aprovado manualmente por ${session.user?.email} - R$ ${amount}`);

    return NextResponse.json({
      success: true,
      message: "Depósito aprovado com sucesso",
      data: {
        transactionId,
        amount: Number(amount),
        userId,
        userName: transaction.user.name,
      },
    });
  } catch (error) {
    console.error("[Manual Approval] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao aprovar depósito" },
      { status: 500 }
    );
  }
}
