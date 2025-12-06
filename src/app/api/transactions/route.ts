// ============================================
// PrimeBet - Transactions API
// Lista transações reais do banco
// ============================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType, Prisma } from "@prisma/client";

interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Parâmetros de filtro
    const type = searchParams.get("type") as TransactionType | null;
    const status = searchParams.get("status") as TransactionStatus | null;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Construir where clause
    const where: Prisma.TransactionWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
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
      ];
    }

    // Executar queries em paralelo
    const [transactions, total, stats] = await Promise.all([
      // Lista de transações
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
      
      // Estatísticas dos resultados filtrados
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Formatar transações para resposta
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      gatewayRef: t.gatewayRef,
      gatewayId: t.gatewayId,
      pixKey: t.pixKey,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt?.toISOString() || null,
      user: {
        id: t.user.id,
        name: t.user.name || "Sem nome",
        email: t.user.email,
        playerId: t.user.playerId,
        image: t.user.image,
      },
      metadata: t.metadata,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          count: stats._count,
          totalAmount: Number(stats._sum.amount || 0),
        },
      },
    });
  } catch (error) {
    console.error("[Transactions API] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar transações" },
      { status: 500 }
    );
  }
}
