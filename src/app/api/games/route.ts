import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const provider = searchParams.get('provider')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const active = searchParams.get('active')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const where: Prisma.GameWhereInput = {}

    if (category) {
      where.category = category as Prisma.EnumGameCategoryFilter
    }

    if (provider) {
      where.providerName = { contains: provider, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (active !== 'false') {
      where.active = true
    }

    const games = await prisma.game.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { name: 'asc' }],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    })

    const total = await prisma.game.count({ where })

    return NextResponse.json({
      games,
      total,
      hasMore: limit ? (offset ? parseInt(offset) : 0) + games.length < total : false,
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem criar jogos
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { providerId, providerName, name, slug, thumbnail, description, category, tags, rtp, volatility, active, featured } = body

    if (!providerId || !providerName || !name || !slug || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const game = await prisma.game.create({
      data: { providerId, providerName, name, slug, thumbnail, description, category, tags: tags || [], rtp, volatility, active: active ?? true, featured: featured ?? false },
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    console.error('Error creating game:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Game already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
