// ============================================
// PrimeBet - Webhook PodPay (Transações/Depósitos)
// Recebe notificações de mudança de status
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface PodPayTransactionWebhook {
  type: "transaction";
  objectId: string;
  url: string;
  data: {
    id: number;
    tenantId: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paidAt: string | null;
    paidAmount: number;
    externalRef?: string;
    customer: {
      id: number;
      name: string;
      email: string;
    };
    pix?: {
      qrcode: string;
      end2EndId?: string;
    };
  };
}

// Mapear status do PodPay para nosso sistema
function mapTransactionStatus(podpayStatus: string): TransactionStatus {
  const statusMap: Record<string, TransactionStatus> = {
    waiting_payment: TransactionStatus.PENDING,
    pending: TransactionStatus.PROCESSING,
    approved: TransactionStatus.COMPLETED,
    paid: TransactionStatus.COMPLETED,
    refused: TransactionStatus.FAILED,
    cancelled: TransactionStatus.CANCELLED,
    refunded: TransactionStatus.CANCELLED,
    chargeback: TransactionStatus.FAILED,
  };

  return statusMap[podpayStatus] || TransactionStatus.PENDING;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PodPayTransactionWebhook;

    console.log("[Webhook PodPay] Recebido:", JSON.stringify(body, null, 2));

    // Validar tipo de webhook
    if (body.type !== "transaction") {
      console.log("[Webhook PodPay] Tipo ignorado:", body.type);
      return NextResponse.json({ received: true });
    }

    const { data } = body;
    const podpayId = String(data.id);

    // Buscar transação pelo gatewayRef
    const transaction = await prisma.transaction.findFirst({
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

    if (!transaction) {
      console.error("[Webhook PodPay] Transação não encontrada:", podpayId);
      // Retornar 200 mesmo assim para não reenviar o webhook
      return NextResponse.json({ received: true, found: false });
    }

    // Mapear status
    const newStatus = mapTransactionStatus(data.status);
    const wasCompleted = transaction.status === TransactionStatus.COMPLETED;
    const isNowCompleted = newStatus === TransactionStatus.COMPLETED;

    console.log(`[Webhook PodPay] Transação ${transaction.id}: ${transaction.status} -> ${newStatus}`);

    // Atualizar status da transação
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        completedAt: isNowCompleted ? new Date() : undefined,
        metadata: {
          ...(transaction.metadata as object || {}),
          podpayStatus: data.status,
          podpayPaidAt: data.paidAt,
          podpayPaidAmount: data.paidAmount,
          webhookReceivedAt: new Date().toISOString(),
        },
      },
    });

    // Se o pagamento foi confirmado e ainda não tinha sido processado
    if (isNowCompleted && !wasCompleted) {
      const userId = transaction.userId;
      const amount = transaction.amount;

      console.log(`[Webhook PodPay] Creditando R$ ${amount} para usuário ${userId}`);

      // Creditar saldo na WalletGame
      await prisma.walletGame.upsert({
        where: { userId },
        create: {
          userId,
          balance: amount,
        },
        update: {
          balance: {
            increment: amount,
          },
        },
      });

      console.log(`[Webhook PodPay] Saldo creditado com sucesso!`);
    }

    return NextResponse.json({ 
      received: true, 
      transactionId: transaction.id,
      newStatus,
    });
  } catch (error) {
    console.error("[Webhook PodPay] Erro:", error);
    // Retornar 200 para evitar retry infinito
    return NextResponse.json({ received: true, error: "Erro interno" });
  }
}

// Aceitar GET para verificação de endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "PodPay Transaction Webhook",
    timestamp: new Date().toISOString(),
  });
}
