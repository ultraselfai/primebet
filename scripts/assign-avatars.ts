/**
 * Script para atribuir avatares aleatórios aos usuários existentes
 * Rode: npx tsx scripts/assign-avatars.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🎭 Atribuindo Avatares aos Usuários...\n");

  // Buscar todos os avatares ativos
  const avatars = await prisma.avatar.findMany({
    where: { isActive: true },
    select: { id: true, imageUrl: true },
  });

  if (avatars.length === 0) {
    console.log("❌ Nenhum avatar encontrado. Execute primeiro: npx tsx scripts/seed-avatars.ts");
    return;
  }

  console.log(`Avatares disponíveis: ${avatars.length}\n`);

  // Buscar usuários sem avatar
  const usersWithoutAvatar = await prisma.user.findMany({
    where: { avatarId: null },
    select: { id: true, name: true, email: true },
  });

  console.log(`Usuários sem avatar: ${usersWithoutAvatar.length}\n`);

  for (const user of usersWithoutAvatar) {
    // Selecionar avatar aleatório
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarId: randomAvatar.id },
    });

    console.log(`✅ ${user.name || user.email}: ${randomAvatar.imageUrl}`);
  }

  console.log(`\n🎉 Concluído! ${usersWithoutAvatar.length} usuários atualizados.`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
