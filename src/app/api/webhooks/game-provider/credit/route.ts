import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateBalanceCache } from "@/app/api/wallet/game/route";

/**
 * Webhook de Crédito (Ganho) - Ultraself Game Provider
 * 
 * POST /api/webhooks/game-provider/credit
 * 
 * O provider chama este endpoint quando o jogador ganha.
 * Credita o valor no saldo do jogador.
 */

interface CreditRequest {
  playerId: string;
  amount: number | string;
  roundId?: string;
  gameCode?: string;
  sessionToken?: string;
  currency?: string;
  timestamp?: string;
  // Informações adicionais do ganho
  winType?: "normal" | "bonus" | "freespin" | "jackpot";
  multiplier?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreditRequest = await request.json();
    if (process.env.NODE_ENV === "development") {
      console.log("[WEBHOOK/CREDIT] Payload", body);
    }
    const { playerId, roundId, gameCode, winType, multiplier } = body;
    const amount = Number(body.amount ?? 0);

    // Validar payload
    if (!playerId) {
      return NextResponse.json({ success: false, error: "playerId é obrigatório" });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ success: false, error: "amount deve ser um número não-negativo" });
    }

    // Buscar ou criar wallet
    let wallet = await prisma.walletGame.findUnique({
      where: { userId: playerId },
      select: { balance: true },
    });

    if (!wallet) {
      // Criar wallet se não existir
      wallet = await prisma.walletGame.create({
        data: { userId: playerId, balance: 0 },
        select: { balance: true },
      });
    }

    // Creditar no saldo (mesmo se amount = 0, para confirmar a rodada)
    const updated = await prisma.walletGame.update({
      where: { userId: playerId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });

    const newBalance = Number(updated.balance);
    invalidateBalanceCache(playerId);

    // Log em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      const winInfo = winType ? ` (${winType}${multiplier ? ` ${multiplier}x` : ""})` : "";
      console.log(`[WEBHOOK/CREDIT] Player: ${playerId}, Ganho: R$${amount.toFixed(2)}${winInfo}, Saldo: R$${newBalance.toFixed(2)}, Game: ${gameCode}, Round: ${roundId}`);
    }

    return NextResponse.json({
      success: true,
      playerId,
      amount,
      balance: newBalance,
      currency: "BRL",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[WEBHOOK/CREDIT] Erro:", error);
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
    endpoint: "/api/webhooks/game-provider/credit",
    method: "POST",
    description: "Credita valor de ganho ao jogador",
  });
}
