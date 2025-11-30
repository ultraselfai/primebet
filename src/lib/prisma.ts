import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Otimizações de conexão
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Configurar pool de conexões via DATABASE_URL
    // Ex: postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Singleton para reusar conexão
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Em desenvolvimento, guardar no global para evitar múltiplas conexões no hot reload
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export { prisma };
