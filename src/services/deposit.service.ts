// ============================================
// PrimeBet - Deposit Service
// Lógica de depósito com Split Duplo
// ============================================

import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Configurações
const INVESTMENT_LOCK_MONTHS = 12;

interface CreateDepositParams {
  userId: string;
  amount: number;
  gatewayId?: string;
}

interface DepositResult {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    pixQrCode?: string;
    pixCopyPaste?: string;
  };
  error?: string;
}

/**
 * Cria uma transação de depósito PIX
 * Retorna o QR Code para pagamento
 */
export async function createDeposit(params: CreateDepositParams): Promise<DepositResult> {
  const { userId, amount, gatewayId } = params;

  try {
    // Validar valor mínimo
    if (amount < 10) {
      return { success: false, error: "Valor mínimo de depósito é R$ 10,00" };
    }

    // Validar valor máximo
    if (amount > 100000) {
      return { success: false, error: "Valor máximo de depósito é R$ 100.000,00" };
    }

    // Verificar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Criar transação pendente
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT,
        amount: new Decimal(amount),
        status: TransactionStatus.PENDING,
        gatewayId,
        // Em produção, aqui geraria o PIX via API do gateway
        pixQrCode: generateMockQRCode(amount),
        pixCopyPaste: generateMockPixCode(amount),
        metadata: {
          createdVia: "api",
          userAgent: "web",
        },
      },
    });

    return {
      success: true,
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        pixQrCode: transaction.pixQrCode || undefined,
        pixCopyPaste: transaction.pixCopyPaste || undefined,
      },
    };
  } catch (error) {
    console.error("Erro ao criar depósito:", error);
    return { success: false, error: "Erro interno ao processar depósito" };
  }
}

/**
 * Confirma um depósito (chamado pelo webhook do gateway)
 * Aplica o Split Duplo: credita WalletGame + WalletInvest
 */
export async function confirmDeposit(transactionId: string, gatewayRef?: string): Promise<boolean> {
  try {
    // Buscar transação
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          include: {
            walletGame: true,
            walletInvest: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error("Transação não encontrada:", transactionId);
      return false;
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      console.warn("Transação já processada:", transactionId);
      return false;
    }

    const amount = transaction.amount;
    const userId = transaction.userId;

    // ============================================
    // SPLIT DUPLO - Regra do PRD
    // Depósito R$100 → R$100 WalletGame + R$100 WalletInvest
    // ============================================

    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da transação
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.COMPLETED,
          gatewayRef,
          completedAt: new Date(),
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

      // 3. Creditar Wallet Invest (ou criar se não existir)
      // O capital fica travado por 12 meses
      const lockUntilDate = new Date();
      lockUntilDate.setMonth(lockUntilDate.getMonth() + INVESTMENT_LOCK_MONTHS);

      await tx.walletInvest.upsert({
        where: { userId },
        update: {
          principal: {
            increment: amount,
          },
          // Atualiza o lock se o novo depósito estende o período
          lockedUntil: lockUntilDate,
        },
        create: {
          userId,
          principal: amount,
          yields: new Decimal(0),
          lockedUntil: lockUntilDate,
        },
      });

      // 4. Log de auditoria
      await tx.auditLog.create({
        data: {
          userId,
          action: "DEPOSIT_CONFIRMED",
          entity: "Transaction",
          entityId: transactionId,
          newData: {
            amount: Number(amount),
            splitGame: Number(amount),
            splitInvest: Number(amount),
            lockedUntil: lockUntilDate.toISOString(),
          },
        },
      });
    });

    console.log(`Depósito confirmado: ${transactionId} - R$ ${amount}`);
    return true;
  } catch (error) {
    console.error("Erro ao confirmar depósito:", error);
    return false;
  }
}

/**
 * Cancela/expira um depósito pendente
 */
export async function cancelDeposit(transactionId: string, reason: string = "EXPIRED"): Promise<boolean> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return false;
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: reason === "EXPIRED" ? TransactionStatus.EXPIRED : TransactionStatus.CANCELLED,
        metadata: {
          ...(transaction.metadata as object || {}),
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao cancelar depósito:", error);
    return false;
  }
}

// ============================================
// Mock Functions (substituir por API real do gateway)
// ============================================

function generateMockQRCode(amount: number): string {
  // Em produção, seria a imagem base64 do QR Code do PIX
  return `data:image/png;base64,MOCK_QR_CODE_${amount}`;
}

function generateMockPixCode(amount: number): string {
  // Em produção, seria o código PIX copia e cola
  const timestamp = Date.now();
  return `00020126580014br.gov.bcb.pix0136${generateRandomKey()}5204000053039865802BR5910PrimeBet6008Brasilia62070503***6304${timestamp}`;
}

function generateRandomKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
