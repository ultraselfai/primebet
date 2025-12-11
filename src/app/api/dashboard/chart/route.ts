// ============================================
// PrimeBet - API de Dados do Gráfico Financeiro
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionType, TransactionStatus, WithdrawalStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Calcular data de início
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Buscar depósitos agrupados por dia
    const deposits = await prisma.transaction.groupBy({
      by: ["completedAt"],
      where: {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Buscar saques agrupados por dia
    const withdrawals = await prisma.withdrawal.groupBy({
      by: ["approvedAt"],
      where: {
        status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
        approvedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Buscar ganhos de apostas agrupados por dia
    const betsWon = await prisma.bet.groupBy({
      by: ["createdAt"],
      where: {
        status: "WON",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        result: true,
      },
    });

    // Criar mapa de datas
    const dataMap = new Map<string, { receita: number; premios: number; saldo: number }>();

    // Inicializar todos os dias no período
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dataMap.set(dateKey, { receita: 0, premios: 0, saldo: 0 });
    }

    // Agregar depósitos (receita)
    deposits.forEach((d) => {
      if (d.completedAt) {
        const dateKey = d.completedAt.toISOString().split("T")[0];
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.receita += Number(d._sum.amount || 0);
        }
      }
    });

    // Agregar saques (prêmios)
    withdrawals.forEach((w) => {
      if (w.approvedAt) {
        const dateKey = w.approvedAt.toISOString().split("T")[0];
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.premios += Number(w._sum.amount || 0);
        }
      }
    });

    // Agregar ganhos de apostas (também conta como prêmios)
    betsWon.forEach((b) => {
      if (b.createdAt) {
        const dateKey = b.createdAt.toISOString().split("T")[0];
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.premios += Number(b._sum.result || 0);
        }
      }
    });

    // Calcular saldo líquido para cada dia
    dataMap.forEach((value) => {
      value.saldo = value.receita - value.premios;
    });

    // Converter para array ordenado
    const chartData = Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date,
        receita: Math.round(values.receita * 100) / 100,
        premios: Math.round(values.premios * 100) / 100,
        saldo: Math.round(values.saldo * 100) / 100,
      }));

    return NextResponse.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("[Dashboard Chart] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar dados do gráfico" },
      { status: 500 }
    );
  }
}
