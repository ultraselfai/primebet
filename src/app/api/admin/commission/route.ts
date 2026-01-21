import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Função auxiliar para verificar se é admin
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null
  }
  return session
}

// GET - Buscar configuração de comissão ativa
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    // Buscar configuração ativa ou criar padrão
    let config = await prisma.commissionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!config) {
      // Criar configuração padrão
      config = await prisma.commissionConfig.create({
        data: {
          minDepositAmount: 100,
          commissionPercent: 10,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        minDepositAmount: config.minDepositAmount.toString(),
        commissionPercent: config.commissionPercent.toString(),
        isActive: config.isActive,
        updatedAt: config.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar configuração de comissão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configuração' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configuração de comissão
export async function PUT(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { minDepositAmount, commissionPercent } = body

    // Validações
    const minDeposit = parseFloat(minDepositAmount)
    const percent = parseFloat(commissionPercent)

    if (isNaN(minDeposit) || minDeposit < 0) {
      return NextResponse.json(
        { success: false, error: 'Valor mínimo de depósito inválido' },
        { status: 400 }
      )
    }

    if (isNaN(percent) || percent < 0 || percent > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentual de comissão deve estar entre 0 e 100' },
        { status: 400 }
      )
    }

    // Desativar configurações anteriores
    await prisma.commissionConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Criar nova configuração ativa
    const config = await prisma.commissionConfig.create({
      data: {
        minDepositAmount: minDeposit,
        commissionPercent: percent,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        minDepositAmount: config.minDepositAmount.toString(),
        commissionPercent: config.commissionPercent.toString(),
        isActive: config.isActive,
        updatedAt: config.updatedAt.toISOString(),
      },
      message: 'Configuração de comissão atualizada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar configuração de comissão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar configuração' },
      { status: 500 }
    )
  }
}
