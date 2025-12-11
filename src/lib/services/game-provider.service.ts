/**
 * Game Provider Service
 * Integração real com a API Game Provider
 * Documentação: https://api.gameprovider.fun/api/docs
 */

const PROVIDER_API = process.env.GAME_PROVIDER_URL || 'https://api.gameprovider.fun/api/v1';
const API_KEY = process.env.GAME_PROVIDER_API_KEY || '';
const API_SECRET = process.env.GAME_PROVIDER_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiresAt: Date | null = null;

// Interface que reflete exatamente o que a API retorna
export interface ProviderGameRaw {
  id: string;
  gameCode: string;
  gameName: string;  // API retorna "gameName" não "name"
  provider: string;
  rtp: number;
  volatility: string;
  isActive: boolean;
  // Campos opcionais que podem não vir
  thumbnail?: string;
  minBet?: number;
  maxBet?: number;
}

// Interface normalizada para uso interno
export interface ProviderGame {
  gameCode: string;
  name: string;
  thumbnail: string;
  rtp: number;
  volatility: 'low' | 'medium' | 'high';
  minBet: number;
  maxBet: number;
  isActive: boolean;
}

export interface GameSession {
  sessionToken: string;
  gameUrl: string;
  expiresAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  spinCredits: number;
  totalCreditsPurchased: number;
  totalSpinsConsumed: number;
  ggrRate: number;
  allowedGames: string[];
  isActive: boolean;
  createdAt: string;
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(`${PROVIDER_API}/agent/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erro na autenticação com Provider:', error);
    throw new Error('Falha na autenticação com Game Provider');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha na autenticação com Game Provider');
  }

  const token: string = data.data.accessToken;
  cachedToken = token;
  tokenExpiresAt = new Date(Date.now() + data.data.expiresIn * 1000);

  return token;
}

export async function getProviderGames(): Promise<ProviderGame[]> {
  const token = await getAccessToken();

  const response = await fetch(`${PROVIDER_API}/agent/games`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Falha ao obter jogos do Provider');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha ao obter jogos do Provider');
  }

  // Mapear os campos da API para o formato esperado internamente
  const rawGames: ProviderGameRaw[] = data.data;
  
  return rawGames.map((game): ProviderGame => ({
    gameCode: game.gameCode,
    name: game.gameName,  // API retorna "gameName"
    thumbnail: game.thumbnail || `/games/${game.gameCode}.webp`,  // Fallback para thumbnail local
    rtp: game.rtp,
    volatility: (game.volatility?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
    minBet: game.minBet || 0.5,
    maxBet: game.maxBet || 1000,
    isActive: game.isActive,
  }));
}

export async function createGameSession(params: {
  userId: string;
  gameId: string;
  playerBalance: number;
  mode?: 'REAL' | 'DEMO';
  returnUrl?: string;
  playerName?: string;
}): Promise<GameSession> {
  const token = await getAccessToken();

  const response = await fetch(`${PROVIDER_API}/agent/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: params.userId,
      gameId: params.gameId,
      currency: 'BRL',
      playerBalance: params.playerBalance,
      mode: params.mode || 'REAL',
      returnUrl: params.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
      metadata: params.playerName ? { playerName: params.playerName } : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao criar sessão de jogo');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha ao criar sessão de jogo');
  }

  return data.data;
}

export async function getAgentProfile(): Promise<AgentProfile> {
  const token = await getAccessToken();

  const response = await fetch(`${PROVIDER_API}/agent/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Falha ao obter perfil do agente');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha ao obter perfil do agente');
  }

  return data.data;
}

export async function testConnection(): Promise<{
  success: boolean;
  agentName?: string;
  spinCredits?: number;
  gamesCount?: number;
  error?: string;
}> {
  try {
    const profile = await getAgentProfile();
    const games = await getProviderGames();

    return {
      success: true,
      agentName: profile.name,
      spinCredits: profile.spinCredits,
      gamesCount: games.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
