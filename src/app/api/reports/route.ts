// ============================================
// PrimeBet - Reports API
// Relatórios e métricas consolidadas
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType, WithdrawalStatus } from "@prisma/client";

function getDateRange(period: string): { start: Date; end: Date; previousStart: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  let previousStart: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      break;
    case "7d":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
      break;
    case "30d":
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 30);
      break;
    case "90d":
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 90);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
  }

  return { start, end, previousStart };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "7d";

    const { start, end, previousStart } = getDateRange(period);

    // Executar todas as queries em paralelo
    const [
      // Período atual
      currentDeposits,
      currentWithdrawals,
      currentBets,
      currentWins,
      currentUsers,
      
      // Período anterior
      previousDeposits,
      previousWithdrawals,
      previousBets,
      previousWins,
      previousUsers,
      
      // Top jogos
      topGames,
      
      // Relatório diário (últimos 7 dias)
      dailyStats,
      
      // Métricas de usuários
      newUsersCurrentPeriod,
      newUsersPreviousPeriod,
      totalPlayersWithDeposit,
      totalRevenue,
    ] = await Promise.all([
      // Depósitos período atual
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Saques período atual
      prisma.withdrawal.aggregate({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Apostas período atual
      prisma.bet.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Ganhos período atual
      prisma.bet.aggregate({
        where: {
          status: "WON",
          settledAt: { gte: start, lte: end },
        },
        _sum: { result: true },
      }),
      
      // Usuários ativos período atual
      prisma.user.count({
        where: {
          role: "PLAYER",
          transactions: {
            some: {
              createdAt: { gte: start, lte: end },
            },
          },
        },
      }),
      
      // Depósitos período anterior
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: previousStart, lt: start },
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Saques período anterior
      prisma.withdrawal.aggregate({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: previousStart, lt: start },
        },
        _sum: { amount: true },
      }),
      
      // Apostas período anterior
      prisma.bet.aggregate({
        where: {
          createdAt: { gte: previousStart, lt: start },
        },
        _sum: { amount: true },
      }),
      
      // Ganhos período anterior
      prisma.bet.aggregate({
        where: {
          status: "WON",
          settledAt: { gte: previousStart, lt: start },
        },
        _sum: { result: true },
      }),
      
      // Usuários ativos período anterior
      prisma.user.count({
        where: {
          role: "PLAYER",
          transactions: {
            some: {
              createdAt: { gte: previousStart, lt: start },
            },
          },
        },
      }),
      
      // Top 10 jogos por apostas (com receita real)
      prisma.$queryRaw<Array<{
        id: string;
        name: string;
        total_bets: bigint;
        total_players: number;
        bet_count: bigint;
        total_wagered: number;
        total_won: number;
      }>>`
        SELECT 
          g.id,
          g.name,
          g.total_bets,
          g.total_players,
          COUNT(b.id) as bet_count,
          COALESCE(SUM(b.amount), 0) as total_wagered,
          COALESCE(SUM(CASE WHEN b.status = 'WON' THEN b.result ELSE 0 END), 0) as total_won
        FROM games g
        LEFT JOIN bets b ON b.game_id = g.id AND b.created_at >= ${start} AND b.created_at <= ${end}
        GROUP BY g.id, g.name, g.total_bets, g.total_players
        ORDER BY bet_count DESC, g.total_bets DESC
        LIMIT 10
      `.catch(() => []),
      
      // Estatísticas diárias (últimos 7 dias)
      prisma.$queryRaw<Array<{ date: string; deposits: number; withdrawals: number }>>`
        SELECT 
          DATE(completed_at) as date,
          SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as deposits,
          0 as withdrawals
        FROM transactions
        WHERE status = 'COMPLETED'
          AND completed_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
        LIMIT 7
      `.catch(() => []),
      
      // Novos usuários período atual
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: start, lte: end },
        },
      }),
      
      // Novos usuários período anterior
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: previousStart, lt: start },
        },
      }),
      
      // Total de jogadores que já fizeram depósito (para calcular LTV)
      prisma.user.count({
        where: {
          role: "PLAYER",
          transactions: {
            some: {
              type: TransactionType.DEPOSIT,
              status: TransactionStatus.COMPLETED,
            },
          },
        },
      }),
      
      // Total de receita histórica (para calcular LTV)
      prisma.bet.aggregate({
        _sum: { amount: true },
      }),
    ]);

    // Calcular métricas
    const currentDepositsAmount = Number(currentDeposits._sum.amount || 0);
    const previousDepositsAmount = Number(previousDeposits._sum.amount || 0);
    const currentWithdrawalsAmount = Number(currentWithdrawals._sum.amount || 0);
    const previousWithdrawalsAmount = Number(previousWithdrawals._sum.amount || 0);
    
    const currentBetsAmount = Number(currentBets._sum.amount || 0);
    const previousBetsAmount = Number(previousBets._sum.amount || 0);
    const currentWinsAmount = Number(currentWins._sum.result || 0);
    const previousWinsAmount = Number(previousWins._sum.result || 0);
    
    const currentGGR = currentBetsAmount - currentWinsAmount;
    const previousGGR = previousBetsAmount - previousWinsAmount;
    
    // Calcular LTV (Lifetime Value) = Total de apostas / Total de jogadores que depositaram
    const totalRevenueAmount = Number(totalRevenue._sum.amount || 0);
    const ltv = totalPlayersWithDeposit > 0 ? totalRevenueAmount / totalPlayersWithDeposit : 0;
    
    // Ticket médio = Depósitos do período / Quantidade de depósitos
    const ticketMedio = currentDeposits._count > 0 
      ? currentDepositsAmount / currentDeposits._count 
      : 0;
    const previousTicketMedio = Number(previousDeposits._sum?.amount || 0) > 0 && previousDeposits 
      ? Number(previousDeposits._sum.amount || 0) / (previousDeposits._count || 1)
      : 0;
    
    // Calcular variações percentuais
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        
        summary: {
          revenue: {
            current: currentGGR,
            previous: previousGGR,
            change: calcChange(currentGGR, previousGGR),
          },
          deposits: {
            current: currentDepositsAmount,
            previous: previousDepositsAmount,
            change: calcChange(currentDepositsAmount, previousDepositsAmount),
            count: currentDeposits._count,
          },
          withdrawals: {
            current: currentWithdrawalsAmount,
            previous: previousWithdrawalsAmount,
            change: calcChange(currentWithdrawalsAmount, previousWithdrawalsAmount),
            count: currentWithdrawals._count,
          },
          users: {
            current: currentUsers,
            previous: previousUsers,
            change: calcChange(currentUsers, previousUsers),
          },
        },
        
        // Métricas de usuários
        userMetrics: {
          newUsers: {
            current: newUsersCurrentPeriod,
            previous: newUsersPreviousPeriod,
            change: calcChange(newUsersCurrentPeriod, newUsersPreviousPeriod),
          },
          ltv: ltv, // Lifetime Value por jogador
          ticketMedio: {
            current: ticketMedio,
            previous: previousTicketMedio,
            change: calcChange(ticketMedio, previousTicketMedio),
          },
          totalPlayersWithDeposit: totalPlayersWithDeposit,
        },
        
        topGames: Array.isArray(topGames) ? topGames.map((game) => ({
          id: game.id,
          name: game.name,
          plays: Number(game.bet_count || 0),
          revenue: Number(game.total_wagered || 0) - Number(game.total_won || 0), // GGR por jogo
          users: game.total_players || 0,
        })) : [],
        
        dailyReport: Array.isArray(dailyStats) ? dailyStats.map((day) => ({
          date: new Date(day.date).toLocaleDateString("pt-BR"),
          deposits: Number(day.deposits || 0),
          withdrawals: Number(day.withdrawals || 0),
          ggr: 0,
          users: 0,
        })) : [],
        
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Reports API] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar relatórios" },
      { status: 500 }
    );
  }
}
