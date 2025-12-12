// ============================================
// PrimeBet - Withdrawals API
// Lista e gerencia saques
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WithdrawalStatus, Prisma, PixKeyType } from "@prisma/client";
import { createWithdraw } from "@/services/podpay.service";
import { defaultSettings } from "@/lib/settings/defaults";

// Mapear enum do Prisma para formato da API PodPay
const pixKeyTypeToPodPay: Record<PixKeyType, "cpf" | "cnpj" | "email" | "phone" | "evp" | "copypaste"> = {
  [PixKeyType.CPF]: "cpf",
  [PixKeyType.CNPJ]: "cnpj",
  [PixKeyType.EMAIL]: "email",
  [PixKeyType.PHONE]: "phone",
  [PixKeyType.RANDOM]: "evp", // PodPay usa 'evp' para chave aleatória
};

// Buscar configuração de taxa de transação
async function getChargeTransactionFee(): Promise<boolean> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (record?.data) {
      const data = record.data as Record<string, unknown>;
      const financial = data.financial as Record<string, unknown> | undefined;
      return (financial?.chargeTransactionFee as boolean) ?? defaultSettings.financial.chargeTransactionFee;
    }
  } catch (error) {
    console.error("[Withdrawals] Erro ao buscar configurações:", error);
  }
  return defaultSettings.financial.chargeTransactionFee;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Parâmetros de filtro
    const statusParam = searchParams.get("status");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Construir where clause
    const where: Prisma.WithdrawalWhereInput = {};

    if (statusParam && statusParam !== "all") {
      where.status = statusParam as WithdrawalStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { pixKey: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Executar queries em paralelo
    const [withdrawals, total, pendingStats, todayStats] = await Promise.all([
      // Lista de saques
      prisma.withdrawal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              playerId: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      
      // Contagem total
      prisma.withdrawal.count({ where }),
      
      // Estatísticas de pendentes
      prisma.withdrawal.aggregate({
        where: { status: WithdrawalStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Estatísticas de hoje
      prisma.withdrawal.aggregate({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Formatar saques
    const formattedWithdrawals = withdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      type: w.type,
      pixKeyType: w.pixKeyType,
      pixKey: w.pixKey,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      approvedAt: w.approvedAt?.toISOString() || null,
      rejectedAt: w.rejectedAt?.toISOString() || null,
      paidAt: w.paidAt?.toISOString() || null,
      rejectReason: w.rejectReason,
      gatewayRef: w.gatewayRef,
      user: {
        id: w.user.id,
        name: w.user.name || "Sem nome",
        email: w.user.email,
        playerId: w.user.playerId,
        image: w.user.image,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          pending: {
            count: pendingStats._count,
            amount: Number(pendingStats._sum.amount || 0),
          },
          today: {
            count: todayStats._count,
            amount: Number(todayStats._sum.amount || 0),
          },
        },
      },
    });
  } catch (error) {
    console.error("[Withdrawals API] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar saques" },
      { status: 500 }
    );
  }
}

// Aprovar ou rejeitar saque
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "ID e ação são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar saque
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Saque não encontrado" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "Saque já foi processado" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Converter valor para centavos (PodPay trabalha em centavos)
      const amountInCents = Math.round(Number(withdrawal.amount) * 100);
      
      // Mapear tipo de chave para formato PodPay
      const podpayPixKeyType = pixKeyTypeToPodPay[withdrawal.pixKeyType];
      
      // URL do webhook para receber atualizações de status
      const postbackUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/podpay/transfer`
        : undefined;

      // Buscar configuração de taxa
      const chargeTransactionFee = await getChargeTransactionFee();

      console.log(`[Withdrawals] Processando saque ${id} via PodPay...`);
      console.log(`[Withdrawals] Valor: R$ ${Number(withdrawal.amount)} (${amountInCents} centavos)`);
      console.log(`[Withdrawals] Chave PIX (${podpayPixKeyType}): ${withdrawal.pixKey}`);
      console.log(`[Withdrawals] netPayout (taxa do usuário): ${chargeTransactionFee}`);

      // Chamar API PodPay para processar o saque
      const podpayResult = await createWithdraw({
        amount: amountInCents,
        pixKey: withdrawal.pixKey,
        pixKeyType: podpayPixKeyType,
        postbackUrl,
        externalRef: withdrawal.id,
        description: `Saque PrimeBet - ${withdrawal.user.name || withdrawal.user.email}`,
        // netPayout: true = taxa descontada do usuário
        // netPayout: false = plataforma absorve (usuário recebe valor integral)
        netPayout: chargeTransactionFee,
      });

      if (!podpayResult.success) {
        console.error(`[Withdrawals] Erro PodPay: ${podpayResult.error}`);
        return NextResponse.json(
          { success: false, error: `Erro no gateway: ${podpayResult.error}` },
          { status: 400 }
        );
      }

      console.log(`[Withdrawals] PodPay Transfer ID: ${podpayResult.transfer.id}`);
      console.log(`[Withdrawals] PodPay Status: ${podpayResult.transfer.status}`);

      // Determinar status baseado na resposta da PodPay
      // COMPLETED = já pago, PROCESSING/PENDING_ANALYSIS/PENDING_QUEUE = em processamento
      const isPaid = podpayResult.transfer.status === "COMPLETED";
      const newStatus = isPaid ? WithdrawalStatus.PAID : WithdrawalStatus.PROCESSING;

      // Atualizar saque com dados da PodPay
      await prisma.withdrawal.update({
        where: { id },
        data: {
          status: newStatus,
          approvedAt: new Date(),
          paidAt: isPaid ? new Date() : null,
          gatewayRef: podpayResult.transfer.id.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: isPaid 
          ? "Saque aprovado e pago com sucesso!" 
          : "Saque aprovado e enviado para processamento",
        data: {
          gatewayRef: podpayResult.transfer.id,
          status: newStatus,
          netAmount: podpayResult.transfer.netAmount / 100, // Converter de centavos
          fee: podpayResult.transfer.fee / 100,
        },
      });
    } else if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Motivo da rejeição é obrigatório" },
          { status: 400 }
        );
      }

      // Rejeitar e devolver saldo
      await prisma.$transaction(async (tx) => {
        // Atualizar saque
        await tx.withdrawal.update({
          where: { id },
          data: {
            status: WithdrawalStatus.REJECTED,
            rejectedAt: new Date(),
            rejectReason: reason,
          },
        });

        // Devolver saldo para carteira game
        await tx.walletGame.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: { increment: withdrawal.amount },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Saque rejeitado e saldo devolvido",
      });
    }

    return NextResponse.json(
      { success: false, error: "Ação inválida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Withdrawals API] Erro PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar saque" },
      { status: 500 }
    );
  }
}
