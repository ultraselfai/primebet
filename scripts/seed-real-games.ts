import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Jogos reais do PGSoft Provider
const realGames = [
  {
    providerId: 'fortunetiger',
    providerName: 'PGSoft',
    name: 'Fortune Tiger',
    slug: 'fortune-tiger',
    thumbnail: '/banners-slots/fortune-tiger.webp',
    description: 'Fortune Tiger - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Todos', 'Popular'],
    active: true,
    featured: true,
    rtp: 96.81,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortuneox',
    providerName: 'PGSoft',
    name: 'Fortune Ox',
    slug: 'fortune-ox',
    thumbnail: '/banners-slots/fortune-ox.webp',
    description: 'Fortune Ox - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: true,
    rtp: 96.75,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunemouse',
    providerName: 'PGSoft',
    name: 'Fortune Mouse',
    slug: 'fortune-mouse',
    thumbnail: '/banners-slots/fortune-mouse.webp',
    description: 'Fortune Mouse - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: true,
    rtp: 96.50,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunepanda',
    providerName: 'PGSoft',
    name: 'Fortune Panda',
    slug: 'fortune-panda',
    thumbnail: '/banners-slots/fortune-panda.webp',
    description: 'Fortune Panda - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.50,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunerabbit',
    providerName: 'PGSoft',
    name: 'Fortune Rabbit',
    slug: 'fortune-rabbit',
    thumbnail: '/banners-slots/fortune-rabbit.webp',
    description: 'Fortune Rabbit - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.71,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'phoenixrises',
    providerName: 'PGSoft',
    name: 'Phoenix Rises',
    slug: 'phoenix-rises',
    thumbnail: '/banners-slots/phoenix-rises.webp',
    description: 'Phoenix Rises - Jogo de slots',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.60,
    volatility: 'HIGH' as const,
  },
]

async function main() {
  console.log('🗑️  Deletando jogos antigos...')
  const deleted = await prisma.game.deleteMany()
  console.log(`   Deletados: ${deleted.count} jogos`)

  console.log('\n🎮 Criando jogos reais do PGSoft...')
  for (const game of realGames) {
    const created = await prisma.game.create({
      data: game,
    })
    console.log(`   ✅ ${created.name} (${created.providerId})`)
  }

  console.log('\n✨ Pronto! Jogos atualizados com sucesso.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
