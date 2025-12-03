import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Função auxiliar para verificar se é admin
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null
  }
  return session
}

// POST - Adicionar saldo ao usuário
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { amount, type = 'game' } = body // type: 'game' | 'invest'

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valor inválido' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        walletGame: true,
        walletInvest: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (type === 'game') {
      // Adicionar ao saldo de jogo
      if (user.walletGame) {
        await prisma.walletGame.update({
          where: { userId: id },
          data: {
            balance: {
              increment: new Decimal(amount),
            },
          },
        })
      } else {
        await prisma.walletGame.create({
          data: {
            userId: id,
            balance: new Decimal(amount),
          },
        })
      }
    } else if (type === 'invest') {
      // Adicionar ao saldo de investimento (principal)
      if (user.walletInvest) {
        await prisma.walletInvest.update({
          where: { userId: id },
          data: {
            principal: {
              increment: new Decimal(amount),
            },
          },
        })
      } else {
        await prisma.walletInvest.create({
          data: {
            userId: id,
            principal: new Decimal(amount),
            yields: 0,
          },
        })
      }
    }

    // Buscar dados atualizados
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        walletGame: true,
        walletInvest: true,
      },
    })

    // Registrar transação
    await prisma.transaction.create({
      data: {
        userId: id,
        type: 'BONUS',
        amount: new Decimal(amount),
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          source: 'admin_manual',
          walletType: type,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        balanceGame: updatedUser!.walletGame?.balance?.toString() || '0',
        balanceInvest: updatedUser!.walletInvest?.principal?.toString() || '0',
        balanceYields: updatedUser!.walletInvest?.yields?.toString() || '0',
      },
      message: `R$ ${amount.toFixed(2)} adicionado ao saldo de ${type === 'game' ? 'jogo' : 'investimento'}`,
    })
  } catch (error) {
    console.error('Erro ao adicionar saldo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar saldo' },
      { status: 500 }
    )
  }
}
