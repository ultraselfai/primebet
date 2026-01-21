import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { Role, UserStatus } from '@prisma/client'
import { generateUniqueReferralCode } from '@/lib/utils/generate-referral-code'

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

// GET - Buscar usuário específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

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

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus,
        balanceGame: user.walletGame?.balance?.toString() || '0',
        balanceInvest: user.walletInvest?.principal?.toString() || '0',
        balanceYields: user.walletInvest?.yields?.toString() || '0',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { name, email, phone, cpf, role, status, password } = body

    // Buscar usuário atual para verificar mudança de role
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, referralCode: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: {
      name?: string
      email?: string
      phone?: string | null
      cpf?: string | null
      role?: Role
      status?: UserStatus
      passwordHash?: string
      referralCode?: string
    } = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone || null
    if (cpf !== undefined) updateData.cpf = cpf || null
    if (role !== undefined) updateData.role = role as Role
    if (status !== undefined) updateData.status = status as UserStatus

    // Se está mudando para INFLUENCER e não tem código de indicação, gerar um
    if (role === 'INFLUENCER' && currentUser.role !== 'INFLUENCER' && !currentUser.referralCode) {
      updateData.referralCode = await generateUniqueReferralCode()
    }

    // Se senha foi fornecida, fazer hash
    if (password && password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        walletGame: true,
        walletInvest: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        role: user.role,
        status: user.status,
        balanceGame: user.walletGame?.balance?.toString() || '0',
        balanceInvest: user.walletInvest?.principal?.toString() || '0',
        balanceYields: user.walletInvest?.yields?.toString() || '0',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: password ? 'Usuário e senha atualizados com sucesso' : 'Usuário atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir usuário
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir usuário' },
      { status: 500 }
    )
  }
}
