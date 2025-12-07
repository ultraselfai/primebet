import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateBalanceCache } from "@/lib/balance-cache";

/**
 * Webhook de Débito (Aposta) - Ultraself Game Provider
 * 
 * POST /api/webhooks/game-provider/debit
 * 
 * O provider chama este endpoint quando o jogador faz uma aposta.
 * Debita o valor do saldo do jogador e registra a aposta no sistema.
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
    // Proteção contra body vazio ou malformado
    let body: DebitRequest;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        console.error("[WEBHOOK/DEBIT] Body vazio recebido");
        return NextResponse.json({ success: false, error: "Body vazio" }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("[WEBHOOK/DEBIT] Erro ao parsear JSON:", parseError);
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

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

    // Buscar o jogo pelo código (provider_id ou slug)
    let game = null;
    if (gameCode) {
      game = await prisma.game.findFirst({
        where: {
          OR: [
            { providerId: gameCode },
            { slug: gameCode },
          ],
        },
        select: { id: true },
      });
    }

    // Executar débito e criar aposta em transação
    const result = await prisma.$transaction(async (tx) => {
      // Debitar do saldo
      const updated = await tx.walletGame.update({
        where: { userId: playerId },
        data: { balance: { decrement: amount } },
        select: { balance: true },
      });

      // Criar registro de aposta (se o jogo existir)
      if (game) {
        // Verificar se é primeira vez que o jogador joga este jogo
        const existingBet = await tx.bet.findFirst({
          where: {
            userId: playerId,
            gameId: game.id,
          },
          select: { id: true },
        });
        const isNewPlayer = !existingBet;

        await tx.bet.create({
          data: {
            userId: playerId,
            gameId: game.id,
            amount: amount,
            status: "ACTIVE",
            roundId: roundId || null,
            sessionId: body.sessionToken || null,
          },
        });

        // Atualizar estatísticas do jogo
        await tx.game.update({
          where: { id: game.id },
          data: {
            totalBets: { increment: 1 },
            // Incrementar totalPlayers se for novo jogador
            ...(isNewPlayer ? { totalPlayers: { increment: 1 } } : {}),
          },
        });
      }

      return updated;
    });

    const newBalance = Number(result.balance);
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
