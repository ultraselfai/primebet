import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar avatares ativos
  const avatars = await prisma.avatar.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (avatars.length === 0) {
    console.log("Nenhum avatar disponível!");
    return;
  }

  // Avatar aleatório
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  
  // Gerar playerId
  const playerId = String(Math.floor(10000000 + Math.random() * 90000000));

  // Atualizar usuário
  await prisma.user.update({
    where: { email: "john.doe@example.com" },
    data: { 
      avatarId: randomAvatar.id,
      playerId,
    },
  });

  console.log(`Usuário john.doe atualizado com avatarId: ${randomAvatar.id}, playerId: ${playerId}`);

  await prisma.$disconnect();
}

main().catch(console.error);
