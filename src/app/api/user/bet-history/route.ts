import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TimeFilter = "3h" | "12h" | "24h" | "48h" | "7d";

function getDateFromFilter(filter: TimeFilter): Date {
  const now = new Date();
  switch (filter) {
    case "3h":
      return new Date(now.getTime() - 3 * 60 * 60 * 1000);
    case "12h":
      return new Date(now.getTime() - 12 * 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "48h":
      return new Date(now.getTime() - 48 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 3 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Pegar o filtro de período
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "3h") as TimeFilter;
    const startDate = getDateFromFilter(period);

    // Buscar apostas do usuário no período
    const bets = await prisma.bet.findMany({
      where: { 
        userId: session.user.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          },
        },
      },
    });

    // Agrupar por jogo
    const gameMap = new Map<string, {
      gameId: string;
      gameName: string;
      gameImage?: string;
      totalBet: number;
      profit: number;
      rounds: number;
    }>();

    let totalBets = 0;
    let totalAmount = 0;
    let netResult = 0;

    bets.forEach((bet) => {
      const gameId = bet.game.id;
      const amount = Number(bet.amount);
      const result = bet.result ? Number(bet.result) : 0;
      const profit = bet.status === "WON" ? result - amount : -amount;

      totalBets++;
      totalAmount += amount;
      netResult += profit;

      if (gameMap.has(gameId)) {
        const existing = gameMap.get(gameId)!;
        existing.totalBet += amount;
        existing.profit += profit;
        existing.rounds++;
      } else {
        gameMap.set(gameId, {
          gameId,
          gameName: bet.game.name,
          gameImage: bet.game.thumbnail || undefined,
          totalBet: amount,
          profit,
          rounds: 1,
        });
      }
    });

    // Ordenar por quantidade de rodadas (mais jogados primeiro)
    const games = Array.from(gameMap.values()).sort((a, b) => b.rounds - a.rounds);

    return NextResponse.json({
      success: true,
      data: {
        totalBets,
        totalAmount,
        netResult,
        games,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de apostas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
