// ============================================
// PrimeBet - Create Withdrawal API
// Cria solicitação de saque com aprovação automática
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WithdrawalStatus, WithdrawType, PixKeyType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { defaultSettings } from "@/lib/settings/defaults";
import { createWithdraw } from "@/services/podpay.service";

interface CreateWithdrawalBody {
  amount: number;
  pixKeyType: string;
  pixKey: string;
}

// Mapear tipo de chave do frontend para o enum do Prisma
const pixKeyTypeMap: Record<string, PixKeyType> = {
  cpf: PixKeyType.CPF,
  cnpj: PixKeyType.CNPJ,
  email: PixKeyType.EMAIL,
  phone: PixKeyType.PHONE,
  random: PixKeyType.RANDOM,
};

// Mapear enum do Prisma para formato da API PodPay
const pixKeyTypeToPodPay: Record<PixKeyType, "cpf" | "cnpj" | "email" | "phone" | "evp" | "copypaste"> = {
  [PixKeyType.CPF]: "cpf",
  [PixKeyType.CNPJ]: "cnpj",
  [PixKeyType.EMAIL]: "email",
  [PixKeyType.PHONE]: "phone",
  [PixKeyType.RANDOM]: "evp", // PodPay usa 'evp' para chave aleatória
};

async function getFinancialSettings() {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    
    if (record?.data) {
      const data = record.data as Record<string, unknown>;
      const financial = data.financial as Record<string, unknown> | undefined;
      return {
        minWithdrawal: (financial?.minWithdrawal as number) ?? defaultSettings.financial.minWithdrawal,
        maxWithdrawal: (financial?.maxWithdrawal as number) ?? defaultSettings.financial.maxWithdrawal,
        autoApprovalLimit: (financial?.autoApprovalLimit as number) ?? defaultSettings.financial.autoApprovalLimit,
        // chargeTransactionFee: true = usuário paga a taxa, false = plataforma absorve
        chargeTransactionFee: (financial?.chargeTransactionFee as boolean) ?? defaultSettings.financial.chargeTransactionFee,
      };
    }
  } catch (error) {
    console.error("[Create Withdrawal] Erro ao buscar configurações:", error);
  }
  
  return {
    minWithdrawal: defaultSettings.financial.minWithdrawal,
    maxWithdrawal: defaultSettings.financial.maxWithdrawal,
    autoApprovalLimit: defaultSettings.financial.autoApprovalLimit,
    chargeTransactionFee: defaultSettings.financial.chargeTransactionFee,
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

    // Verificar se deve aprovar automaticamente
    const shouldAutoApprove = amount <= settings.autoApprovalLimit;
    
    console.log(`[Create Withdrawal] Valor: R$ ${amount} | Limite auto: R$ ${settings.autoApprovalLimit} | Auto-aprovar: ${shouldAutoApprove}`);

    // Buscar dados do usuário para descrição
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

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

      // 2. Criar solicitação de saque (status inicial depende se é auto ou manual)
      const newWithdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: new Decimal(amount),
          type: WithdrawType.GAME_BALANCE,
          pixKeyType: pixKeyTypeMap[pixKeyType],
          pixKey,
          status: shouldAutoApprove ? WithdrawalStatus.PROCESSING : WithdrawalStatus.PENDING,
          approvedAt: shouldAutoApprove ? new Date() : null,
        },
      });

      // 3. Log de auditoria
      await tx.auditLog.create({
        data: {
          userId,
          action: shouldAutoApprove ? "WITHDRAWAL_AUTO_APPROVED" : "WITHDRAWAL_REQUESTED",
          entity: "Withdrawal",
          entityId: newWithdrawal.id,
          newData: {
            amount,
            pixKeyType,
            pixKey,
            autoApproved: shouldAutoApprove,
          },
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return newWithdrawal;
    });

    console.log(`[Create Withdrawal] Saque criado: ${withdrawal.id} - R$ ${amount} - Auto: ${shouldAutoApprove}`);

    // Se for aprovação automática, processar via PodPay imediatamente
    if (shouldAutoApprove) {
      const amountInCents = Math.round(amount * 100);
      const podpayPixKeyType = pixKeyTypeToPodPay[pixKeyTypeMap[pixKeyType]];
      const postbackUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/podpay/transfer`
        : undefined;

      console.log(`[Create Withdrawal] Processando saque automático via PodPay... netPayout=${settings.chargeTransactionFee}`);

      const podpayResult = await createWithdraw({
        amount: amountInCents,
        pixKey,
        pixKeyType: podpayPixKeyType,
        postbackUrl,
        externalRef: withdrawal.id,
        description: `Saque PrimeBet - ${user?.name || user?.email || userId}`,
        // netPayout: true = taxa descontada do usuário
        // netPayout: false = plataforma absorve (usuário recebe valor integral)
        netPayout: settings.chargeTransactionFee,
      });

      if (podpayResult.success) {
        // Atualizar saque com dados do gateway
        const isPaid = podpayResult.transfer.status === "COMPLETED";
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: isPaid ? WithdrawalStatus.PAID : WithdrawalStatus.PROCESSING,
            paidAt: isPaid ? new Date() : null,
            gatewayRef: podpayResult.transfer.id.toString(),
          },
        });

        console.log(`[Create Withdrawal] PodPay OK - ID: ${podpayResult.transfer.id} - Status: ${podpayResult.transfer.status}`);

        return NextResponse.json({
          success: true,
          data: {
            withdrawalId: withdrawal.id,
            amount: Number(withdrawal.amount),
            status: isPaid ? "PAID" : "PROCESSING",
            pixKeyType: withdrawal.pixKeyType,
            pixKey: withdrawal.pixKey,
            createdAt: withdrawal.createdAt.toISOString(),
            autoApproved: true,
            message: isPaid 
              ? "Saque processado e enviado com sucesso!" 
              : "Saque aprovado automaticamente e está sendo processado.",
          },
        });
      } else {
        // Falha no gateway - reverter saldo e marcar como falha
        console.error(`[Create Withdrawal] Erro PodPay: ${podpayResult.error}`);
        
        await prisma.$transaction(async (tx) => {
          // Devolver saldo
          await tx.walletGame.update({
            where: { userId },
            data: { balance: { increment: amount } },
          });
          
          // Marcar como falha
          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: WithdrawalStatus.FAILED,
              rejectReason: `Erro no gateway: ${podpayResult.error}`,
            },
          });
        });

        return NextResponse.json(
          { success: false, error: `Erro ao processar saque: ${podpayResult.error}` },
          { status: 400 }
        );
      }
    }

    // Saque precisa de aprovação manual
    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        pixKeyType: withdrawal.pixKeyType,
        pixKey: withdrawal.pixKey,
        createdAt: withdrawal.createdAt.toISOString(),
        autoApproved: false,
        message: "Solicitação de saque enviada para aprovação.",
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
