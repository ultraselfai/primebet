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
    description: 'O tigre da sorte traz prosperidade e grandes premios!',
    category: 'SLOTS' as const,
    tags: ['Popular', 'Slots'],
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
    description: 'O boi da fortuna multiplica sua sorte!',
    category: 'SLOTS' as const,
    tags: ['Popular', 'Slots'],
    active: true,
    featured: true,
    rtp: 96.75,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunerabbit',
    providerName: 'PGSoft',
    name: 'Fortune Rabbit',
    slug: 'fortune-rabbit',
    thumbnail: '/banners-slots/fortune-rabbit.webp',
    description: 'O coelho da sorte salta com grandes premios!',
    category: 'SLOTS' as const,
    tags: ['Popular', 'Slots'],
    active: true,
    featured: true,
    rtp: 96.70,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunepanda',
    providerName: 'PGSoft',
    name: 'Fortune Panda',
    slug: 'fortune-panda',
    thumbnail: '/banners-slots/fortune-panda.webp',
    description: 'O panda traz fortuna e muita diversao!',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.65,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'fortunemouse',
    providerName: 'PGSoft',
    name: 'Fortune Mouse',
    slug: 'fortune-mouse',
    thumbnail: '/banners-slots/fortune-mouse.webp',
    description: 'O ratinho da sorte distribui moedas de ouro!',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.50,
    volatility: 'MEDIUM' as const,
  },
  {
    providerId: 'phoenixrises',
    providerName: 'PGSoft',
    name: 'Phoenix Rises',
    slug: 'phoenix-rises',
    thumbnail: '/banners-slots/phoenix-rises.webp',
    description: 'A fenix renasce das cinzas com multiplicadores epicos!',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.55,
    volatility: 'HIGH' as const,
  },
  {
    providerId: 'hoodvswoolf',
    providerName: 'PGSoft',
    name: 'Hood vs Woolf',
    slug: 'hood-vs-woolf',
    thumbnail: '/banners-slots/hood-vs-woolf.webp',
    description: 'Chapeuzinho enfrenta o Lobo em busca de grandes premios!',
    category: 'SLOTS' as const,
    tags: ['Slots'],
    active: true,
    featured: false,
    rtp: 96.60,
    volatility: 'HIGH' as const,
  },
]

async function main() {
  console.log('Seeding jogos reais do PGSoft...\n')

  for (const game of realGames) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: game,
      create: game,
    })
    console.log(`Created/Updated: ${game.name}`)
  }

  // Remover jogos mockados antigos
  const realSlugs = realGames.map(g => g.slug)
  const deleted = await prisma.game.deleteMany({
    where: {
      slug: {
        notIn: realSlugs
      }
    }
  })

  if (deleted.count > 0) {
    console.log(`\nRemovidos ${deleted.count} jogos mockados antigos`)
  }

  console.log('\nSeed de jogos concluido!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
