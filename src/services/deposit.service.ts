// ============================================
// PrimeBet - Deposit Service
// ============================================

import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

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
 * Credita o valor na WalletGame do usuário
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

      // 3. Log de auditoria
      await tx.auditLog.create({
        data: {
          userId,
          action: "DEPOSIT_CONFIRMED",
          entity: "Transaction",
          entityId: transactionId,
          newData: {
            amount: Number(amount),
          },
        },
      });

      // 4. Atualizar comissão do influencer (se usuário foi indicado)
      await updateInfluencerCommission(tx, userId, amount);
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
// Funções de Comissão de Influenciadores
// ============================================

/**
 * Atualiza a comissão do influencer quando um indicado faz depósito
 */
async function updateInfluencerCommission(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  depositAmount: Decimal
): Promise<void> {
  try {
    // Buscar usuário e verificar se foi indicado por alguém
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { 
        referredById: true,
        referredBy: {
          select: { role: true }
        }
      },
    });

    // Se não foi indicado ou o referrer não é INFLUENCER, não faz nada
    if (!user?.referredById || user.referredBy?.role !== 'INFLUENCER') {
      return;
    }

    const influencerId = user.referredById;

    // Buscar configuração de comissão ativa
    const config = await tx.commissionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      console.warn('Nenhuma configuração de comissão ativa encontrada');
      return;
    }

    // Upsert do registro de comissão
    const existingCommission = await tx.referralCommission.findUnique({
      where: {
        influencerId_referredUserId: {
          influencerId,
          referredUserId: userId,
        },
      },
    });

    const newTotalDeposits = existingCommission 
      ? new Decimal(existingCommission.totalDeposits).plus(depositAmount)
      : depositAmount;

    // Calcular comissão apenas se atingiu o mínimo
    let commissionEarned = new Decimal(0);
    if (newTotalDeposits.greaterThanOrEqualTo(config.minDepositAmount)) {
      // Comissão = totalDeposits * (percent / 100)
      commissionEarned = newTotalDeposits.times(config.commissionPercent).dividedBy(100);
    }

    await tx.referralCommission.upsert({
      where: {
        influencerId_referredUserId: {
          influencerId,
          referredUserId: userId,
        },
      },
      update: {
        totalDeposits: newTotalDeposits,
        commissionEarned,
        lastDepositAt: new Date(),
      },
      create: {
        influencerId,
        referredUserId: userId,
        totalDeposits: depositAmount,
        commissionEarned,
        commissionPaid: 0,
        lastDepositAt: new Date(),
      },
    });

    console.log(`Comissão atualizada: Influencer ${influencerId}, Indicado ${userId}, Depósito R$ ${depositAmount}, Total R$ ${newTotalDeposits}, Comissão R$ ${commissionEarned}`);
  } catch (error) {
    console.error('Erro ao atualizar comissão do influencer:', error);
    // Não lançar erro para não interromper a confirmação do depósito
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
