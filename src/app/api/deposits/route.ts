// ============================================
// PrimeBet - Deposits API
// Lista depósitos do banco de dados
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Parâmetros de filtro
    const statusParam = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Construir where clause - apenas depósitos
    const where: Prisma.TransactionWhereInput = {
      type: TransactionType.DEPOSIT,
    };

    if (statusParam && statusParam !== "all") {
      where.status = statusParam as TransactionStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { gatewayRef: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { playerId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Executar queries em paralelo
    const [deposits, total, todayStats, pendingStats] = await Promise.all([
      // Lista de depósitos
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              playerId: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      
      // Contagem total
      prisma.transaction.count({ where }),
      
      // Estatísticas de hoje
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          completedAt: { gte: startOfToday },
        },
        _sum: { amount: true },
        _count: true,
      }),
      
      // Estatísticas de pendentes
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calcular taxa de conversão
    const totalAttempts = todayStats._count + pendingStats._count;
    const conversionRate = totalAttempts > 0 
      ? (todayStats._count / totalAttempts) * 100 
      : 0;

    // Formatar depósitos
    const formattedDeposits = deposits.map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      status: d.status,
      method: "PIX",
      gatewayRef: d.gatewayRef,
      createdAt: d.createdAt.toISOString(),
      completedAt: d.completedAt?.toISOString() || null,
      user: {
        id: d.user.id,
        name: d.user.name || "Sem nome",
        email: d.user.email,
        playerId: d.user.playerId,
        image: d.user.image,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        deposits: formattedDeposits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          today: {
            count: todayStats._count,
            amount: Number(todayStats._sum.amount || 0),
          },
          pending: {
            count: pendingStats._count,
            amount: Number(pendingStats._sum.amount || 0),
          },
          conversionRate,
        },
      },
    });
  } catch (error) {
    console.error("[Deposits API] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar depósitos" },
      { status: 500 }
    );
  }
}
