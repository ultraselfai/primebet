import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

/**
 * Gera um Player ID único de 8 dígitos
 * Formato: XXXXXXXX (primeiro dígito 1-9, resto 0-9)
 */
export function generatePlayerId(): string {
  // Primeiro dígito: 1-9 (não começa com 0)
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  
  // Próximos 7 dígitos: 0-9
  let remaining = "";
  for (let i = 0; i < 7; i++) {
    remaining += Math.floor(Math.random() * 10);
  }
  
  return `${firstDigit}${remaining}`;
}

/**
 * Gera um Player ID único garantindo que não existe no banco
 * @param prismaClient - Cliente Prisma opcional (usa o default se não fornecido)
 */
export async function generateUniquePlayerId(prismaClient?: PrismaClient): Promise<string> {
  const prisma = prismaClient || defaultPrisma;
  let playerId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    playerId = generatePlayerId();
    const existing = await prisma.user.findUnique({
      where: { playerId },
      select: { id: true },
    });

    if (!existing) {
      return playerId;
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: adicionar timestamp para garantir unicidade
  const timestamp = Date.now().toString().slice(-4);
  return `${generatePlayerId().slice(0, 4)}${timestamp}`;
}

/**
 * Mascara o Player ID para exibição pública
 * Exemplo: 17485102 -> 174***02 (mostra 3 primeiros e 2 últimos)
 */
export function maskPlayerId(playerId: string): string {
  if (playerId.length !== 8) return playerId;
  return `${playerId.slice(0, 3)}***${playerId.slice(-2)}`;
}
