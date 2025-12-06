// ============================================
// PrimeBet - Create PIX Deposit API
// Cria depósito real via PodPay
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { createPixDeposit } from "@/services/podpay.service";
import { Decimal } from "@prisma/client/runtime/library";
import { defaultSettings } from "@/lib/settings/defaults";

interface CreateDepositBody {
  amount: number;
  userId: string;
}

interface FinancialSettings {
  minDeposit: number;
  maxDeposit: number;
  depositFee: number;
  chargeTransactionFee: boolean;
}

async function getFinancialSettings(): Promise<FinancialSettings> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    
    if (record?.data) {
      const data = record.data as Record<string, unknown>;
      const financial = data.financial as Partial<FinancialSettings> | undefined;
      return {
        minDeposit: financial?.minDeposit ?? defaultSettings.financial.minDeposit,
        maxDeposit: financial?.maxDeposit ?? defaultSettings.financial.maxDeposit,
        depositFee: financial?.depositFee ?? defaultSettings.financial.depositFee,
        chargeTransactionFee: financial?.chargeTransactionFee ?? defaultSettings.financial.chargeTransactionFee,
      };
    }
  } catch (error) {
    console.error("[Create Deposit] Erro ao buscar configurações:", error);
  }
  
  return defaultSettings.financial;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateDepositBody;
    const { amount, userId } = body;

    // Buscar configurações financeiras
    const financialSettings = await getFinancialSettings();

    // Validações
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Usuário não identificado" },
        { status: 401 }
      );
    }

    if (!amount || amount < financialSettings.minDeposit) {
      return NextResponse.json(
        { success: false, error: `Valor mínimo de depósito é R$ ${financialSettings.minDeposit.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (amount > financialSettings.maxDeposit) {
      return NextResponse.json(
        { success: false, error: `Valor máximo de depósito é R$ ${financialSettings.maxDeposit.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Obter URL base para webhook
    // Prioridade: NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
    let baseUrl = "http://localhost:3000";
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }

    console.log("[Create Deposit] Using webhook baseUrl:", baseUrl);

    // Criar transação no PodPay
    // Passar dados do usuário - o service vai preencher campos faltantes com fictícios
    const podpayResult = await createPixDeposit({
      amount: Math.round(amount * 100), // Converter para centavos
      customer: {
        name: user.name || "Cliente",
        email: user.email,
        phone: user.phone?.replace(/\D/g, "") || undefined,
        document: user.cpf ? {
          type: "cpf",
          number: user.cpf.replace(/\D/g, ""),
        } : undefined,
      },
      postbackUrl: `${baseUrl}/api/webhooks/podpay/transaction`,
      externalRef: userId,
    });

    if (!podpayResult.success) {
      console.error("[Create Deposit] Erro PodPay:", podpayResult.error);
      return NextResponse.json(
        { success: false, error: podpayResult.error || "Erro ao gerar PIX" },
        { status: 500 }
      );
    }

    const podpayTransaction = podpayResult.transaction;

    // Criar transação no nosso banco
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT,
        amount: new Decimal(amount),
        status: TransactionStatus.PENDING,
        gatewayRef: String(podpayTransaction.id),
        gatewayId: podpayTransaction.secureId,
        pixQrCode: podpayTransaction.pix?.qrcode || null,
        pixCopyPaste: podpayTransaction.pix?.qrcode || null,
        metadata: {
          podpayId: podpayTransaction.id,
          secureUrl: podpayTransaction.secureUrl,
          expirationDate: podpayTransaction.pix?.expirationDate,
          createdVia: "api",
        },
      },
    });

    // Calcular tempo de expiração
    const expirationDate = podpayTransaction.pix?.expirationDate 
      ? new Date(podpayTransaction.pix.expirationDate)
      : new Date(Date.now() + 30 * 60 * 1000); // 30 minutos default

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        amount,
        pix: {
          qrCode: podpayTransaction.pix?.qrcode || null,
          copyPaste: podpayTransaction.pix?.qrcode || null,
          expiresAt: expirationDate.toISOString(),
        },
        secureUrl: podpayTransaction.secureUrl,
      },
    });
  } catch (error) {
    console.error("[Create Deposit] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar depósito" },
      { status: 500 }
    );
  }
}
