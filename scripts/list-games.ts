import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const games = await prisma.game.findMany({
    select: {
      id: true,
      providerId: true,
      name: true,
    }
  })
  console.log('Games no banco:')
  console.log(JSON.stringify(games, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
