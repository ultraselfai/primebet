import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateBalanceCache } from "@/app/api/wallet/game/route";

/**
 * Webhook de Débito (Aposta) - Ultraself Game Provider
 * 
 * POST /api/webhooks/game-provider/debit
 * 
 * O provider chama este endpoint quando o jogador faz uma aposta.
 * Debita o valor do saldo do jogador.
 */

interface DebitRequest {
  playerId: string;
  amount: number | string;
  roundId?: string;
  gameCode?: string;
  sessionToken?: string;
  currency?: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DebitRequest = await request.json();
    if (process.env.NODE_ENV === "development") {
      console.log("[WEBHOOK/DEBIT] Payload", body);
    }
    const { playerId, roundId, gameCode } = body;
    const amount = Number(body.amount);

    // Validar payload
    if (!playerId) {
      return NextResponse.json({ success: false, error: "playerId é obrigatório" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "amount deve ser um número positivo" });
    }

    // Buscar saldo atual
    const wallet = await prisma.walletGame.findUnique({
      where: { userId: playerId },
      select: { balance: true },
    });

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Jogador não encontrado" });
    }

    const currentBalance = Number(wallet.balance);

    // Verificar saldo suficiente
    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: "Saldo insuficiente",
        playerId,
        balance: currentBalance,
        currency: "BRL",
      });
    }

    // Debitar do saldo
    const updated = await prisma.walletGame.update({
      where: { userId: playerId },
      data: { balance: { decrement: amount } },
      select: { balance: true },
    });

    const newBalance = Number(updated.balance);
    invalidateBalanceCache(playerId);

    // Log em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`[WEBHOOK/DEBIT] Player: ${playerId}, Aposta: R$${amount.toFixed(2)}, Saldo: R$${newBalance.toFixed(2)}, Game: ${gameCode}, Round: ${roundId}`);
    }

    return NextResponse.json({
      success: true,
      playerId,
      roundId,
      amount,
      balance: newBalance,
      currency: "BRL",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[WEBHOOK/DEBIT] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}

// GET para verificar se endpoint está ativo
export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/game-provider/debit",
    method: "POST",
    description: "Debita valor de aposta do jogador",
  });
}
