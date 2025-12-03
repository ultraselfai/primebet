// Cache simples em memória para evitar queries repetidas de saldo
const userBalanceCache = new Map<string, { balance: number; timestamp: number }>();

export const CACHE_TTL = 5000; // 5 segundos

export function getBalanceFromCache(userId: string): { balance: number; timestamp: number } | undefined {
  return userBalanceCache.get(userId);
}

export function setBalanceInCache(userId: string, balance: number): void {
  userBalanceCache.set(userId, { balance, timestamp: Date.now() });
}

// Limpar cache quando saldo for atualizado
export function invalidateBalanceCache(userId: string): void {
  userBalanceCache.delete(userId);
}
