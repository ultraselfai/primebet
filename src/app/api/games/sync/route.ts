import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GameCategory, Volatility } from '@prisma/client'
import { auth } from '@/lib/auth'
import { getProviderGames } from '@/lib/services/game-provider.service'

function mapCategory(cat: string): GameCategory {
  const map: Record<string, GameCategory> = {
    'slots': 'SLOTS', 'slot': 'SLOTS', 'live_casino': 'LIVE_CASINO', 'live-casino': 'LIVE_CASINO',
    'live': 'LIVE_CASINO', 'table': 'TABLE_GAMES', 'table_games': 'TABLE_GAMES', 'crash': 'CRASH',
    'instant': 'CRASH', 'sports': 'SPORTS', 'virtual': 'VIRTUAL', 'virtual_sports': 'VIRTUAL',
  }
  return map[cat?.toLowerCase()] || 'SLOTS'
}

function mapVolatility(vol: string): Volatility | null {
  const map: Record<string, Volatility> = { 'low': 'LOW', 'medium': 'MEDIUM', 'med': 'MEDIUM', 'high': 'HIGH' }
  return map[vol?.toLowerCase()] || null
}

function generateSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem sincronizar jogos
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se deve limpar jogos antigos
    const body = await request.json().catch(() => ({}));
    const clearOld = body?.clearOld === true;

    // Usar o service do Game Provider para buscar jogos
    let providerGames;
    try {
      providerGames = await getProviderGames();
    } catch (err) {
      console.error('Erro ao buscar jogos do provider:', err);
      return NextResponse.json({ 
        error: 'Falha ao conectar com o Game Provider', 
        details: err instanceof Error ? err.message : 'Erro desconhecido'
      }, { status: 500 });
    }

    if (!providerGames || providerGames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum jogo encontrado no provedor',
        synced: 0, 
        total: 0,
      })
    }

    // Se clearOld, deletar jogos que não existem no provedor
    const providerGameCodes = providerGames.map(g => g.gameCode);
    let deleted = 0;
    
    if (clearOld) {
      // Deletar jogos mockados (que não estão no provedor)
      const result = await prisma.game.deleteMany({
        where: {
          providerId: {
            notIn: providerGameCodes,
          },
          // Só deletar jogos que não têm apostas
          bets: {
            none: {},
          },
        },
      });
      deleted = result.count;
    }

    let synced = 0
    const errors: string[] = []

    for (const game of providerGames) {
      try {
        await prisma.game.upsert({
          where: { providerId: game.gameCode },
          update: {
            name: game.name, 
            thumbnail: game.thumbnail,
            rtp: game.rtp, 
            volatility: mapVolatility(game.volatility),
            active: game.isActive,
          },
          create: {
            providerId: game.gameCode, 
            providerName: 'PGSoft', 
            name: game.name,
            slug: generateSlug(game.name), 
            thumbnail: game.thumbnail,
            category: 'SLOTS', // O provider não retorna categoria, default para SLOTS
            rtp: game.rtp, 
            volatility: mapVolatility(game.volatility),
            active: game.isActive, 
            featured: false,
          },
        })
        synced++
      } catch (err) {
        console.error(`Error syncing ${game.name}:`, err)
        errors.push(game.name)
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced, 
      deleted,
      total: providerGames.length, 
      errors: errors.length > 0 ? errors : undefined 
    })
  } catch (error) {
    console.error('Error syncing games:', error)
    return NextResponse.json({ error: 'Failed to sync games' }, { status: 500 })
  }
}
