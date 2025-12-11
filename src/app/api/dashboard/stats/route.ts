// ============================================
// PrimeBet - Dashboard Stats API
// Estatísticas reais do banco de dados com filtros
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType, WithdrawalStatus } from "@prisma/client";
import { getBalance } from "@/services/podpay.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de período
    const periodType = searchParams.get("period") || "month"; // today, week, month, custom
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Determinar período baseado no filtro
    let periodStart: Date;
    let periodEnd: Date = endOfToday;
    
    switch (periodType) {
      case "today":
        periodStart = startOfToday;
        break;
      case "week":
        periodStart = startOfWeek;
        break;
      case "month":
        periodStart = startOfMonth;
        break;
      case "custom":
        periodStart = startDateParam ? new Date(startDateParam) : startOfMonth;
        periodEnd = endDateParam ? new Date(endDateParam) : endOfToday;
        // Garantir que o final do dia seja incluído
        periodEnd.setHours(23, 59, 59, 999);
        break;
      default:
        periodStart = startOfMonth;
    }

    // Buscar saldo do gateway em paralelo (não bloqueia se falhar)
    const gatewayBalancePromise = getBalance().catch(() => null);

    // Executar todas as queries em paralelo
    const [
      // Data mais antiga de transação (para limitar o calendário)
      oldestTransaction,
      
      // Totais de carteiras
      totalWalletGame,
      totalWalletInvest,
      
      // Usuários
      totalUsers,
      newUsersToday,
      newUsersYesterday,
      activeUsersToday,
      activeUsersPeriod,
      
      // Depósitos do período selecionado
      depositsPeriod,
      depositsPeriodAmount,
      
      // Depósitos de hoje (sempre mostrar)
      depositsToday,
      depositsTodayAmount,
      depositsYesterday,
      depositsYesterdayAmount,
      depositsMonth,
      depositsMonthAmount,
      pendingDeposits,
      
      // Saques do período
      withdrawalsPeriod,
      withdrawalsPeriodAmount,
      
      // Saques de hoje
      withdrawalsToday,
      withdrawalsTodayAmount,
      withdrawalsYesterday,
      pendingWithdrawals,
      pendingWithdrawalsAmount,
      
      // Apostas (GGR) do período
      betsPeriod,
      betsWonPeriod,
      
      // Apostas totais (para referência)
      betsTotal,
      betsWon,
    ] = await Promise.all([
      // Data da primeira transação
      prisma.transaction.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      
      // Total em carteiras game
      prisma.walletGame.aggregate({
        _sum: { balance: true },
      }),
      
      // Total em carteiras invest
      prisma.walletInvest.aggregate({
        _sum: { principal: true, yields: true },
      }),
      
      // Total de usuários
      prisma.user.count({ where: { role: "PLAYER" } }),
      
      // Novos usuários hoje
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: startOfToday },
        },
      }),
      
      // Novos usuários ontem
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
      
      // Usuários ativos hoje (que fizeram transação)
      prisma.transaction.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: startOfToday },
        },
      }),
      
      // Usuários ativos no período selecionado
      prisma.transaction.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // Depósitos do período selecionado
      prisma.transaction.count({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // Valor depósitos do período
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
      
      // Depósitos confirmados hoje
      prisma.transaction.count({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: startOfToday },
        },
      }),
      
      // Valor depósitos hoje
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
      
      // Depósitos ontem
      prisma.transaction.count({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
      
      // Valor depósitos ontem
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
        _sum: { amount: true },
      }),
      
      // Depósitos este mês
      prisma.transaction.count({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: startOfMonth },
        },
      }),
      
      // Valor depósitos mês
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      
      // Depósitos pendentes
      prisma.transaction.count({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        },
      }),
      
      // Saques do período selecionado
      prisma.withdrawal.count({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // Valor saques do período
      prisma.withdrawal.aggregate({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
      
      // Saques aprovados hoje
      prisma.withdrawal.count({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: startOfToday },
        },
      }),
      
      // Valor saques hoje
      prisma.withdrawal.aggregate({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
      
      // Saques ontem
      prisma.withdrawal.count({
        where: {
          status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
          approvedAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
      
      // Saques pendentes
      prisma.withdrawal.count({
        where: { status: WithdrawalStatus.PENDING },
      }),
      
      // Valor saques pendentes
      prisma.withdrawal.aggregate({
        where: { status: WithdrawalStatus.PENDING },
        _sum: { amount: true },
      }),
      
      // Apostas do período selecionado
      prisma.bet.aggregate({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
      
      // Ganhos de jogadores no período
      prisma.bet.aggregate({
        where: {
          status: "WON",
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { result: true },
      }),
      
      // Total apostado (histórico)
      prisma.bet.aggregate({
        _sum: { amount: true },
      }),
      
      // Total ganho por jogadores (histórico)
      prisma.bet.aggregate({
        where: { status: "WON" },
        _sum: { result: true },
      }),
    ]);

    // Calcular métricas base
    const totalBalanceGame = Number(totalWalletGame._sum.balance || 0);
    const totalPrincipal = Number(totalWalletInvest._sum.principal || 0);
    const totalYields = Number(totalWalletInvest._sum.yields || 0);
    const totalInvested = totalPrincipal + totalYields;
    
    // Valores de depósitos
    const depositsTodayValue = Number(depositsTodayAmount._sum.amount || 0);
    const depositsYesterdayValue = Number(depositsYesterdayAmount._sum.amount || 0);
    const depositsMonthValue = Number(depositsMonthAmount._sum.amount || 0);
    const depositsPeriodValue = Number(depositsPeriodAmount._sum.amount || 0);
    
    // Valores de saques
    const withdrawalsTodayValue = Number(withdrawalsTodayAmount._sum.amount || 0);
    const withdrawalsPeriodValue = Number(withdrawalsPeriodAmount._sum.amount || 0);
    const pendingWithdrawalsValue = Number(pendingWithdrawalsAmount._sum.amount || 0);
    
    // GGR do período (receita bruta de jogos = apostas - prêmios)
    const betsPeriodValue = Number(betsPeriod._sum.amount || 0);
    const betsWonPeriodValue = Number(betsWonPeriod._sum.result || 0);
    const ggrPeriod = betsPeriodValue - betsWonPeriodValue;
    
    // GGR histórico
    const totalBetsAmount = Number(betsTotal._sum.amount || 0);
    const totalWonAmount = Number(betsWon._sum.result || 0);
    const ggrTotal = totalBetsAmount - totalWonAmount;
    const ggrMargin = totalBetsAmount > 0 ? (ggrTotal / totalBetsAmount) * 100 : 0;
    
    // Receita Total do período = Depósitos confirmados
    const receitaPeriodo = depositsPeriodValue;
    const receitaHoje = depositsTodayValue;
    
    // Prêmios Pagos = Saques pagos + Ganhos de apostas
    const premiosPeriodo = withdrawalsPeriodValue + betsWonPeriodValue;
    const premiosHoje = withdrawalsTodayValue;
    
    // Lucro do período = Receita - Prêmios (ou GGR - Saques)
    const lucroPeriodo = receitaPeriodo - premiosPeriodo;
    const lucroHoje = receitaHoje - premiosHoje;
    
    // Calcular variações percentuais
    const depositGrowth = depositsYesterdayValue > 0 
      ? ((depositsTodayValue - depositsYesterdayValue) / depositsYesterdayValue) * 100 
      : depositsTodayValue > 0 ? 100 : 0;
      
    const userGrowth = newUsersYesterday > 0
      ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100
      : newUsersToday > 0 ? 100 : 0;
    
    // Taxa de conversão de depósitos (confirmados vs pendentes + confirmados)
    const totalDepositsAttempted = depositsToday + pendingDeposits;
    const conversionRate = totalDepositsAttempted > 0 
      ? (depositsToday / totalDepositsAttempted) * 100 
      : 0;
    
    // Gateway balance (PodPay)
    let gatewayBalance = null;
    try {
      const balanceResult = await gatewayBalancePromise;
      if (balanceResult && balanceResult.success && balanceResult.balance) {
        const bal = balanceResult.balance;
        gatewayBalance = {
          available: Number(bal.amount || 0),
          waitingFunds: Number(bal.waitingFunds || 0),
          reserve: Number(bal.reserve || 0),
        };
      }
    } catch (e) {
      console.warn("[Dashboard] Falha ao obter saldo do gateway:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        // Período selecionado
        period: {
          type: periodType,
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        
        // Data mínima para o date picker (primeira transação)
        oldestTransactionDate: oldestTransaction?.createdAt?.toISOString() || null,
        
        // Cards principais (novo layout)
        cards: {
          receitaTotal: {
            value: receitaPeriodo,
            today: receitaHoje,
            label: "Receita Total",
            description: "Depósitos confirmados",
            icon: "dollar",
          },
          premiosPagos: {
            value: premiosPeriodo,
            today: premiosHoje,
            label: "Prêmios Pagos",
            description: "Saques + Ganhos de apostas",
            icon: "trophy",
          },
          lucroAtual: {
            value: lucroPeriodo,
            today: lucroHoje,
            label: "Lucro Atual",
            description: "Receita - Prêmios",
            icon: "trending-up",
            isProfit: lucroPeriodo >= 0,
          },
          usuariosAtivos: {
            value: activeUsersPeriod.length,
            today: activeUsersToday.length,
            total: totalUsers,
            newToday: newUsersToday,
            label: "Usuários Ativos",
            description: "Jogadores com apostas no período",
            icon: "users",
            change: userGrowth,
          },
        },
        
        // Saldo do gateway (PodPay)
        gateway: gatewayBalance,
        
        // Dados detalhados para tabelas/gráficos
        details: {
          // Saldos em carteiras
          wallets: {
            game: totalBalanceGame,
            invest: totalInvested,
            investPrincipal: totalPrincipal,
            investYields: totalYields,
          },
          
          // GGR (Gross Gaming Revenue)
          ggr: {
            period: ggrPeriod,
            total: ggrTotal,
            margin: ggrMargin,
            bets: {
              period: betsPeriodValue,
              total: totalBetsAmount,
            },
            wins: {
              period: betsWonPeriodValue,
              total: totalWonAmount,
            },
          },
          
          // Depósitos
          deposits: {
            period: {
              count: depositsPeriod,
              amount: depositsPeriodValue,
            },
            today: {
              count: depositsToday,
              amount: depositsTodayValue,
            },
            yesterday: {
              count: depositsYesterday,
              amount: depositsYesterdayValue,
            },
            month: {
              count: depositsMonth,
              amount: depositsMonthValue,
            },
            pending: pendingDeposits,
            conversionRate,
          },
          
          // Saques
          withdrawals: {
            period: {
              count: withdrawalsPeriod,
              amount: withdrawalsPeriodValue,
            },
            today: {
              count: withdrawalsToday,
              amount: withdrawalsTodayValue,
            },
            yesterday: {
              count: withdrawalsYesterday,
            },
            pending: {
              count: pendingWithdrawals,
              amount: pendingWithdrawalsValue,
            },
          },
        },
        
        // Metadados
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Dashboard Stats] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
