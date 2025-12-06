// ============================================
// PrimeBet - Dashboard Stats API
// Estatísticas reais do banco de dados
// ============================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType, WithdrawalStatus } from "@prisma/client";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Executar todas as queries em paralelo
    const [
      // Totais de carteiras
      totalWalletGame,
      totalWalletInvest,
      
      // Usuários
      totalUsers,
      newUsersToday,
      newUsersYesterday,
      activeUsersToday,
      
      // Depósitos
      depositsToday,
      depositsTodayAmount,
      depositsYesterday,
      depositsYesterdayAmount,
      depositsMonth,
      depositsMonthAmount,
      pendingDeposits,
      
      // Saques
      withdrawalsToday,
      withdrawalsTodayAmount,
      withdrawalsYesterday,
      pendingWithdrawals,
      pendingWithdrawalsAmount,
      
      // Apostas (GGR)
      betsTotal,
      betsWon,
    ] = await Promise.all([
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
      
      // Total apostado
      prisma.bet.aggregate({
        _sum: { amount: true },
      }),
      
      // Total ganho por jogadores
      prisma.bet.aggregate({
        where: { status: "WON" },
        _sum: { result: true },
      }),
    ]);

    // Calcular métricas
    const totalBalanceGame = Number(totalWalletGame._sum.balance || 0);
    const totalPrincipal = Number(totalWalletInvest._sum.principal || 0);
    const totalYields = Number(totalWalletInvest._sum.yields || 0);
    const totalInvested = totalPrincipal + totalYields;
    
    const depositsTodayValue = Number(depositsTodayAmount._sum.amount || 0);
    const depositsYesterdayValue = Number(depositsYesterdayAmount._sum.amount || 0);
    const depositsMonthValue = Number(depositsMonthAmount._sum.amount || 0);
    
    const withdrawalsTodayValue = Number(withdrawalsTodayAmount._sum.amount || 0);
    const pendingWithdrawalsValue = Number(pendingWithdrawalsAmount._sum.amount || 0);
    
    const totalBetsAmount = Number(betsTotal._sum.amount || 0);
    const totalWonAmount = Number(betsWon._sum.result || 0);
    const ggr = totalBetsAmount - totalWonAmount;
    const ggrMargin = totalBetsAmount > 0 ? (ggr / totalBetsAmount) * 100 : 0;
    
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

    return NextResponse.json({
      success: true,
      data: {
        // Cards principais
        cards: {
          totalBalance: {
            value: totalBalanceGame,
            label: "Saldo Total",
            description: "Soma de todos os saldos de jogadores",
            change: depositGrowth,
          },
          activeUsers: {
            value: activeUsersToday.length,
            total: totalUsers,
            newToday: newUsersToday,
            label: "Usuários Ativos",
            description: "Jogaram nas últimas 24 horas",
            change: userGrowth,
          },
          totalInvested: {
            value: totalInvested,
            principal: totalPrincipal,
            yields: totalYields,
            label: "Total Investido",
            description: "Distribuição mensal",
          },
          ggr: {
            value: ggr,
            margin: ggrMargin,
            totalBets: totalBetsAmount,
            totalWon: totalWonAmount,
            label: "GGR (Receita Bruta)",
            description: `Margem: ${ggrMargin.toFixed(1)}% do volume`,
          },
        },
        
        // Depósitos
        deposits: {
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
