/**
 * Script para popular playerIds dos usuários existentes
 * Rode: npx tsx scripts/populate-player-ids.ts
 */

import { prisma } from "../src/lib/prisma";
import { generateUniquePlayerId } from "../src/lib/utils/generate-player-id";

async function main() {
  console.log("🎮 Populando Player IDs...\n");

  // Buscar usuários sem playerId
  const usersWithoutPlayerId = await prisma.user.findMany({
    where: { playerId: null },
    select: { id: true, name: true, email: true },
  });

  console.log(`Encontrados ${usersWithoutPlayerId.length} usuários sem Player ID\n`);

  for (const user of usersWithoutPlayerId) {
    const playerId = await generateUniquePlayerId(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { playerId },
    });
    console.log(`✅ ${user.name || user.email}: ${playerId}`);
  }

  console.log("\n🎉 Todos os Player IDs foram gerados!");
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
