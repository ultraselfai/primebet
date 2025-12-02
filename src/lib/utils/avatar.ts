import { prisma } from "@/lib/prisma";

/**
 * Busca um avatar aleatório ativo do banco de dados
 * @returns O ID do avatar ou null se não houver avatares
 */
export async function getRandomAvatarId(): Promise<string | null> {
  const avatars = await prisma.avatar.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (avatars.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex].id;
}

/**
 * Busca a URL da imagem do avatar pelo ID
 * @param avatarId ID do avatar
 * @returns URL da imagem ou null
 */
export async function getAvatarImageUrl(avatarId: string): Promise<string | null> {
  const avatar = await prisma.avatar.findUnique({
    where: { id: avatarId },
    select: { imageUrl: true },
  });

  return avatar?.imageUrl || null;
}
