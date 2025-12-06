// ============================================
// PrimeBet - Webhook PodPay (Transferências/Saques)
// Recebe notificações de mudança de status de saques
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WithdrawalStatus } from "@prisma/client";

interface PodPayTransferWebhook {
  type: "withdraw";
  objectId: string;
  url: string;
  data: {
    id: number;
    tenantId: string;
    amount: number;
    netAmount: number;
    fee: number;
    status: string;
    pixKey: string;
    pixKeyType: string;
    pixEnd2EndId?: string;
    externalRef?: string;
    transferredAt?: string;
    processedAt?: string;
    canceledAt?: string;
  };
}

// Mapear status do PodPay para nosso sistema
function mapWithdrawalStatus(podpayStatus: string): WithdrawalStatus {
  const statusMap: Record<string, WithdrawalStatus> = {
    COMPLETED: WithdrawalStatus.PAID,
    PROCESSING: WithdrawalStatus.PROCESSING,
    CANCELLED: WithdrawalStatus.FAILED,
    REFUSED: WithdrawalStatus.FAILED,
    PENDING_ANALYSIS: WithdrawalStatus.PROCESSING,
    PENDING_QUEUE: WithdrawalStatus.PROCESSING,
  };

  return statusMap[podpayStatus] || WithdrawalStatus.PROCESSING;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PodPayTransferWebhook;

    console.log("[Webhook PodPay Transfer] Recebido:", JSON.stringify(body, null, 2));

    // Validar tipo de webhook
    if (body.type !== "withdraw") {
      console.log("[Webhook PodPay Transfer] Tipo ignorado:", body.type);
      return NextResponse.json({ received: true });
    }

    const { data } = body;
    const podpayId = String(data.id);

    // Buscar withdrawal pelo gatewayRef
    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        gatewayRef: podpayId,
      },
      include: {
        user: {
          include: {
            walletGame: true,
          },
        },
      },
    });

    if (!withdrawal) {
      console.error("[Webhook PodPay Transfer] Saque não encontrado:", podpayId);
      return NextResponse.json({ received: true, found: false });
    }

    // Mapear status
    const newStatus = mapWithdrawalStatus(data.status);
    const wasPaid = withdrawal.status === WithdrawalStatus.PAID;
    const wasFailed = withdrawal.status === WithdrawalStatus.FAILED;
    const isNowPaid = newStatus === WithdrawalStatus.PAID;
    const isNowFailed = newStatus === WithdrawalStatus.FAILED;

    console.log(`[Webhook PodPay Transfer] Saque ${withdrawal.id}: ${withdrawal.status} -> ${newStatus}`);

    // Atualizar status do saque
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: newStatus,
        paidAt: isNowPaid ? new Date() : undefined,
        gatewayRef: podpayId,
      },
    });

    // Se o saque falhou e ainda não tinha sido processado como falha
    // Devolver o saldo para a carteira do usuário
    if (isNowFailed && !wasFailed && !wasPaid) {
      const userId = withdrawal.userId;
      const amount = withdrawal.amount;

      console.log(`[Webhook PodPay Transfer] Devolvendo R$ ${amount} para usuário ${userId}`);

      await prisma.walletGame.update({
        where: { userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      console.log(`[Webhook PodPay Transfer] Saldo devolvido com sucesso!`);
    }

    return NextResponse.json({ 
      received: true, 
      withdrawalId: withdrawal.id,
      newStatus,
    });
  } catch (error) {
    console.error("[Webhook PodPay Transfer] Erro:", error);
    return NextResponse.json({ received: true, error: "Erro interno" });
  }
}

// Aceitar GET para verificação de endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "PodPay Transfer Webhook",
    timestamp: new Date().toISOString(),
  });
}
