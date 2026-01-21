import type { PrismaClient } from "@prisma/client";

/**
 * Caracteres permitidos para código de indicação
 * Removidos: 0, O, I, L para evitar confusão visual
 */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Gera um código de indicação de 6 caracteres
 * Formato: ABC123 (alfanumérico)
 */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/**
 * Gera um código de indicação único garantindo que não existe no banco
 * @param prismaClient - Cliente Prisma (opcional)
 */
export async function generateUniqueReferralCode(prismaClient?: PrismaClient): Promise<string> {
  const prisma = prismaClient || (await import("@/lib/prisma")).prisma;
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: adicionar caracteres extras para garantir unicidade
  const extra = CHARSET[Math.floor(Math.random() * CHARSET.length)] + 
                CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return generateReferralCode().slice(0, 4) + extra;
}

/**
 * Valida formato do código de indicação
 */
export function isValidReferralCode(code: string): boolean {
  if (!code || code.length < 6 || code.length > 8) return false;
  return /^[A-Z0-9]+$/i.test(code);
}
