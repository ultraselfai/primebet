import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook de Eventos Gerais - Ultraself Game Provider
 * 
 * POST /api/webhooks/game-provider/events
 * 
 * Recebe todos os eventos do jogo (game.start, game.end, etc)
 * Este endpoint é opcional, mas útil para auditoria e analytics.
 */

interface GameEvent {
  event: "game.start" | "game.end" | "game.error" | "session.expired" | string;
  playerId: string;
  sessionToken?: string;
  gameCode?: string;
  timestamp?: string;
  data?: {
    // game.start
    initialBalance?: number;
    // game.end
    finalBalance?: number;
    totalBets?: number;
    totalWins?: number;
    totalRounds?: number;
    duration?: number; // em segundos
    // game.error
    errorCode?: string;
    errorMessage?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GameEvent = await request.json();
    const { event, playerId, gameCode, data } = body;

    // Validar payload básico
    if (!event || !playerId) {
      return NextResponse.json(
        { success: false, error: "event e playerId são obrigatórios" },
        { status: 400 }
      );
    }

    // Log em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`[WEBHOOK/EVENT] ${event} | Player: ${playerId} | Game: ${gameCode || "N/A"}`);
      if (data) {
        console.log(`[WEBHOOK/EVENT] Data:`, JSON.stringify(data));
      }
    }

    // Processar eventos específicos
    switch (event) {
      case "game.start":
        // Apenas log - jogo iniciado
        break;

      case "game.end":
        // Sincronizar saldo final se fornecido (segurança extra)
        if (data?.finalBalance !== undefined) {
          const wallet = await prisma.walletGame.findUnique({
            where: { userId: playerId },
            select: { balance: true },
          });

          if (wallet) {
            const currentBalance = Number(wallet.balance);
            const finalBalance = data.finalBalance;

            // Se houver diferença significativa, logar para investigação
            if (Math.abs(currentBalance - finalBalance) > 0.01) {
              console.warn(`[WEBHOOK/EVENT] Diferença de saldo detectada!`);
              console.warn(`  Player: ${playerId}`);
              console.warn(`  Saldo DB: R$${currentBalance.toFixed(2)}`);
              console.warn(`  Saldo Provider: R$${finalBalance.toFixed(2)}`);
              console.warn(`  Diferença: R$${(finalBalance - currentBalance).toFixed(2)}`);
              
              // Opção: Sincronizar com saldo do provider (descomentar se necessário)
              // await prisma.walletGame.update({
              //   where: { userId: playerId },
              //   data: { balance: finalBalance },
              // });
            }
          }
        }
        break;

      case "game.error":
        // Logar erro do jogo
        console.error(`[WEBHOOK/EVENT] Erro no jogo!`);
        console.error(`  Player: ${playerId}`);
        console.error(`  Game: ${gameCode}`);
        console.error(`  Error: ${data?.errorCode} - ${data?.errorMessage}`);
        break;

      case "session.expired":
        // Sessão expirou - apenas log
        break;

      default:
        // Evento desconhecido - apenas log
        if (process.env.NODE_ENV === "development") {
          console.log(`[WEBHOOK/EVENT] Evento não tratado: ${event}`);
        }
    }

    return NextResponse.json({
      success: true,
      event,
      playerId,
      received: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[WEBHOOK/EVENT] Erro:", error);
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
    endpoint: "/api/webhooks/game-provider/events",
    method: "POST",
    description: "Recebe eventos gerais do jogo",
    events: ["game.start", "game.end", "game.error", "session.expired"],
  });
}
