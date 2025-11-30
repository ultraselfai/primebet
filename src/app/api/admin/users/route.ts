import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Lista todos os usuários com saldo
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        walletGame: true,
        walletInvest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || 'Sem nome',
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
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers,
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, cpf, password, role, status, initialBalance } = body

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha se fornecida
    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    // Criar usuário com carteiras
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        cpf,
        passwordHash,
        role: role || 'PLAYER',
        status: status || 'ACTIVE',
        walletGame: {
          create: {
            balance: initialBalance || 0,
          },
        },
        walletInvest: {
          create: {
            principal: 0,
            yields: 0,
          },
        },
      },
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
      },
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
