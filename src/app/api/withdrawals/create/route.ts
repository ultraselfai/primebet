// ============================================
// PrimeBet - Create Withdrawal API
// Cria solicitação de saque
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WithdrawalStatus, WithdrawType, PixKeyType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { defaultSettings } from "@/lib/settings/defaults";

interface CreateWithdrawalBody {
  amount: number;
  pixKeyType: string;
  pixKey: string;
}

// Mapear tipo de chave do frontend para o enum
const pixKeyTypeMap: Record<string, PixKeyType> = {
  cpf: PixKeyType.CPF,
  cnpj: PixKeyType.CNPJ,
  email: PixKeyType.EMAIL,
  phone: PixKeyType.PHONE,
  random: PixKeyType.RANDOM,
};

async function getFinancialSettings() {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    
    if (record?.data) {
      const data = record.data as Record<string, unknown>;
      const financial = data.financial as Record<string, number> | undefined;
      return {
        minWithdrawal: financial?.minWithdrawal ?? defaultSettings.financial.minWithdrawal,
        maxWithdrawal: financial?.maxWithdrawal ?? defaultSettings.financial.maxWithdrawal,
      };
    }
  } catch (error) {
    console.error("[Create Withdrawal] Erro ao buscar configurações:", error);
  }
  
  return {
    minWithdrawal: defaultSettings.financial.minWithdrawal,
    maxWithdrawal: defaultSettings.financial.maxWithdrawal,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = (await request.json()) as CreateWithdrawalBody;
    const { amount, pixKeyType, pixKey } = body;

    // Buscar configurações financeiras
    const settings = await getFinancialSettings();

    // Validações básicas
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor inválido" },
        { status: 400 }
      );
    }

    if (amount < settings.minWithdrawal) {
      return NextResponse.json(
        { success: false, error: `Valor mínimo de saque é R$ ${settings.minWithdrawal.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (amount > settings.maxWithdrawal) {
      return NextResponse.json(
        { success: false, error: `Valor máximo de saque é R$ ${settings.maxWithdrawal.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (!pixKeyType || !pixKeyTypeMap[pixKeyType]) {
      return NextResponse.json(
        { success: false, error: "Tipo de chave PIX inválido" },
        { status: 400 }
      );
    }

    if (!pixKey || pixKey.length < 5) {
      return NextResponse.json(
        { success: false, error: "Chave PIX inválida" },
        { status: 400 }
      );
    }

    // Buscar saldo do usuário
    const walletGame = await prisma.walletGame.findUnique({
      where: { userId },
    });

    const currentBalance = walletGame ? Number(walletGame.balance) : 0;

    if (amount > currentBalance) {
      return NextResponse.json(
        { success: false, error: "Saldo insuficiente" },
        { status: 400 }
      );
    }

    // Verificar se não há saque pendente
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: {
        userId,
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
      },
    });

    if (pendingWithdrawal) {
      return NextResponse.json(
        { success: false, error: "Você já possui um saque pendente. Aguarde o processamento." },
        { status: 400 }
      );
    }

    // Criar saque em transação atômica
    const withdrawal = await prisma.$transaction(async (tx) => {
      // 1. Debitar saldo
      await tx.walletGame.update({
        where: { userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // 2. Criar solicitação de saque
      const newWithdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: new Decimal(amount),
          type: WithdrawType.GAME_BALANCE,
          pixKeyType: pixKeyTypeMap[pixKeyType],
          pixKey,
          status: WithdrawalStatus.PENDING,
        },
      });

      // 3. Log de auditoria
      await tx.auditLog.create({
        data: {
          userId,
          action: "WITHDRAWAL_REQUESTED",
          entity: "Withdrawal",
          entityId: newWithdrawal.id,
          newData: {
            amount,
            pixKeyType,
            pixKey,
          },
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return newWithdrawal;
    });

    console.log(`[Create Withdrawal] Saque criado: ${withdrawal.id} - R$ ${amount} - Usuário: ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        pixKeyType: withdrawal.pixKeyType,
        pixKey: withdrawal.pixKey,
        createdAt: withdrawal.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Create Withdrawal] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar saque" },
      { status: 500 }
    );
  }
}
