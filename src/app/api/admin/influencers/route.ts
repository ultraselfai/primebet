import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// Função auxiliar para verificar se é admin
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null
  }
  return session
}

// GET - Listar todos os influencers com estatísticas
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    // Buscar todos os influencers
    const influencers = await prisma.user.findMany({
      where: { role: 'INFLUENCER' },
      select: {
        id: true,
        playerId: true,
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
        // Contar indicados diretos
        referrals: {
          select: { id: true },
        },
        // Buscar comissões como influencer
        influencerCommissions: {
          select: {
            totalDeposits: true,
            commissionEarned: true,
            commissionPaid: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatar dados com agregações
    const formattedInfluencers = influencers.map((influencer) => {
      // Somar totais das comissões
      const totals = influencer.influencerCommissions.reduce(
        (acc, comm) => ({
          totalDeposits: acc.totalDeposits + Number(comm.totalDeposits),
          commissionEarned: acc.commissionEarned + Number(comm.commissionEarned),
          commissionPaid: acc.commissionPaid + Number(comm.commissionPaid),
        }),
        { totalDeposits: 0, commissionEarned: 0, commissionPaid: 0 }
      )

      return {
        id: influencer.id,
        playerId: influencer.playerId,
        name: influencer.name || 'Sem nome',
        email: influencer.email,
        referralCode: influencer.referralCode,
        referralsCount: influencer.referrals.length,
        totalDeposits: totals.totalDeposits.toFixed(2),
        commissionEarned: totals.commissionEarned.toFixed(2),
        commissionPaid: totals.commissionPaid.toFixed(2),
        commissionPending: (totals.commissionEarned - totals.commissionPaid).toFixed(2),
        createdAt: influencer.createdAt.toISOString(),
      }
    })

    // Estatísticas gerais
    const stats = {
      totalInfluencers: formattedInfluencers.length,
      totalReferrals: formattedInfluencers.reduce((acc, i) => acc + i.referralsCount, 0),
      totalDeposits: formattedInfluencers.reduce((acc, i) => acc + parseFloat(i.totalDeposits), 0).toFixed(2),
      totalCommissionEarned: formattedInfluencers.reduce((acc, i) => acc + parseFloat(i.commissionEarned), 0).toFixed(2),
      totalCommissionPending: formattedInfluencers.reduce((acc, i) => acc + parseFloat(i.commissionPending), 0).toFixed(2),
    }

    return NextResponse.json({
      success: true,
      data: {
        influencers: formattedInfluencers,
        stats,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar influencers:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar influencers' },
      { status: 500 }
    )
  }
}
