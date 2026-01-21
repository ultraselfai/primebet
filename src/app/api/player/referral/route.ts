import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Buscar dados de indicação do usuário logado (influencer)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const userId = session.user.id

    // Buscar dados do usuário com informações de indicação
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        referralCode: true,
        // Usuários indicados por este influencer
        referrals: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        // Comissões como influencer
        influencerCommissions: {
          select: {
            totalDeposits: true,
            commissionEarned: true,
            commissionPaid: true,
            referredUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é influencer
    const isInfluencer = user.role === 'INFLUENCER'

    // Calcular totais
    const totals = user.influencerCommissions.reduce(
      (acc, comm) => ({
        totalDeposits: acc.totalDeposits + Number(comm.totalDeposits),
        commissionEarned: acc.commissionEarned + Number(comm.commissionEarned),
        commissionPaid: acc.commissionPaid + Number(comm.commissionPaid),
      }),
      { totalDeposits: 0, commissionEarned: 0, commissionPaid: 0 }
    )

    // Gerar link de indicação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://primebet.space'
    const referralLink = user.referralCode 
      ? `${baseUrl}/cadastro?ref=${user.referralCode}`
      : null

    return NextResponse.json({
      success: true,
      data: {
        isInfluencer,
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalReferrals: user.referrals.length,
          totalDeposits: totals.totalDeposits.toFixed(2),
          commissionEarned: totals.commissionEarned.toFixed(2),
          commissionPaid: totals.commissionPaid.toFixed(2),
          commissionPending: (totals.commissionEarned - totals.commissionPaid).toFixed(2),
        },
        referrals: user.referrals.map((r) => ({
          id: r.id,
          name: r.name || 'Sem nome',
          joinedAt: r.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar dados de indicação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}
