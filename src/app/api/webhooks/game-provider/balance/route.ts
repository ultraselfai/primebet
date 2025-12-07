import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook de Consulta de Saldo - Ultraself Game Provider
 * 
 * POST /api/webhooks/game-provider/balance
 * 
 * O provider chama este endpoint para consultar o saldo atual do jogador
 * antes de permitir apostas ou durante o jogo.
 */

interface BalanceRequest {
  playerId: string;
  sessionToken?: string;
  gameCode?: string;
  currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Proteção contra body vazio ou malformado
    let body: BalanceRequest;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        console.error("[WEBHOOK/BALANCE] Body vazio recebido");
        return NextResponse.json({ success: false, error: "Body vazio" }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("[WEBHOOK/BALANCE] Erro ao parsear JSON:", parseError);
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[WEBHOOK/BALANCE] Payload", body);
    }
    const { playerId } = body;

    // Validar payload
    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "playerId é obrigatório" }
      );
    }

    // Buscar saldo do usuário
    const wallet = await prisma.walletGame.findUnique({
      where: { userId: playerId },
      select: { balance: true },
    });

    // Se não tem wallet, retornar saldo 0
    const balance = wallet ? Number(wallet.balance) : 0;

    // Log em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`[WEBHOOK/BALANCE] Player: ${playerId}, Saldo: R$${balance.toFixed(2)}`);
    }

    return NextResponse.json({
      success: true,
      playerId,
      balance,
      currency: "BRL",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[WEBHOOK/BALANCE] Erro:", error);
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
    endpoint: "/api/webhooks/game-provider/balance",
    method: "POST",
    description: "Consulta saldo do jogador",
  });
}
