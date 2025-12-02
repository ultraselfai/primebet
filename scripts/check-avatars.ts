import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Verificar avatares disponíveis
  const avatars = await prisma.avatar.findMany();
  console.log("\n=== AVATARES DISPONÍVEIS ===");
  console.log(`Total: ${avatars.length}`);
  avatars.forEach(a => console.log(`  - ${a.id}: ${a.name} (${a.imageUrl})`));

  // Verificar últimos usuários
  const users = await prisma.user.findMany({
    include: { avatar: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\n=== ÚLTIMOS 5 USUÁRIOS ===");
  users.forEach(u => {
    console.log(`  - ${u.name} (${u.email})`);
    console.log(`    avatarId: ${u.avatarId || "NULO"}`);
    console.log(`    avatar.imageUrl: ${u.avatar?.imageUrl || "NENHUM"}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
