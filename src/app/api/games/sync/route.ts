import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GameCategory, Volatility } from '@prisma/client'

interface ProviderGame {
  game_id: string
  game_name: string
  provider: string
  category: string
  thumbnail_url: string
  rtp: number
  volatility: string
}

function mapCategory(cat: string): GameCategory {
  const map: Record<string, GameCategory> = {
    'slots': 'SLOTS', 'slot': 'SLOTS', 'live_casino': 'LIVE_CASINO', 'live-casino': 'LIVE_CASINO',
    'live': 'LIVE_CASINO', 'table': 'TABLE_GAMES', 'table_games': 'TABLE_GAMES', 'crash': 'CRASH',
    'instant': 'CRASH', 'sports': 'SPORTS', 'virtual': 'VIRTUAL', 'virtual_sports': 'VIRTUAL',
  }
  return map[cat.toLowerCase()] || 'OTHER'
}

function mapVolatility(vol: string): Volatility | null {
  const map: Record<string, Volatility> = { 'low': 'LOW', 'medium': 'MEDIUM', 'med': 'MEDIUM', 'high': 'HIGH' }
  return map[vol.toLowerCase()] || null
}

function generateSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const PROVIDER_URL = process.env.GAME_PROVIDER_URL
    const API_KEY = process.env.GAME_PROVIDER_API_KEY
    const SECRET = process.env.GAME_PROVIDER_SECRET
    const OPERATOR_ID = process.env.GAME_PROVIDER_OPERATOR_ID

    if (!PROVIDER_URL || !API_KEY) {
      return NextResponse.json({
        success: true,
        message: 'Provider not configured. Configure GAME_PROVIDER_URL and GAME_PROVIDER_API_KEY in .env',
        synced: 0, total: 0,
      })
    }

    const response = await fetch(`${PROVIDER_URL}/games/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Operator-Id': OPERATOR_ID || '',
      },
      body: JSON.stringify({ secret: SECRET, operator_id: OPERATOR_ID }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Provider API error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch from provider', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    const providerGames: ProviderGame[] = data.games || data.data || []

    let synced = 0
    const errors: string[] = []

    for (const game of providerGames) {
      try {
        await prisma.game.upsert({
          where: { providerId: game.game_id },
          update: {
            name: game.game_name, providerName: game.provider, thumbnail: game.thumbnail_url,
            category: mapCategory(game.category), rtp: game.rtp, volatility: mapVolatility(game.volatility),
          },
          create: {
            providerId: game.game_id, providerName: game.provider, name: game.game_name,
            slug: generateSlug(game.game_name), thumbnail: game.thumbnail_url,
            category: mapCategory(game.category), rtp: game.rtp, volatility: mapVolatility(game.volatility),
            active: true, featured: false,
          },
        })
        synced++
      } catch (err) {
        console.error(`Error syncing ${game.game_name}:`, err)
        errors.push(game.game_name)
      }
    }

    return NextResponse.json({ success: true, synced, total: providerGames.length, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('Error syncing games:', error)
    return NextResponse.json({ error: 'Failed to sync games' }, { status: 500 })
  }
}
