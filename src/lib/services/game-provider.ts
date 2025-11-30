/**
 * Game Provider Service - Ultraself Integration
 * 
 * Documentação: https://api.ultraself.space/api/docs
 * 
 * Este serviço conecta a Bet com o Game Provider para:
 * 1. Autenticação (obter/renovar access token)
 * 2. Listar jogos disponíveis
 * 3. Criar sessões de jogo para jogadores
 */

const PROVIDER_API = process.env.GAME_PROVIDER_URL || 'https://api.ultraself.space/api/v1';
const API_KEY = process.env.GAME_PROVIDER_API_KEY || '';
const API_SECRET = process.env.GAME_PROVIDER_SECRET || '';

// Cache do token em memória (em produção, usar Redis ou banco)
let cachedToken: string | null = null;
let tokenExpiresAt: Date | null = null;

export interface GameProviderGame {
  gameCode: string;
  gameName: string; // O provider retorna "gameName" e não "name"
  name?: string; // Alias para compatibilidade
  thumbnail?: string;
  rtp: number;
  volatility: string;
  minBet?: number;
  maxBet?: number;
  isActive: boolean;
  provider?: string;
}

export interface GameSession {
  sessionToken: string;
  launchUrl: string; // Provider retorna 'launchUrl' não 'gameUrl'
  gameUrl?: string; // Alias para compatibilidade
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

/**
 * Obtém ou renova o access token
 */
export async function getAccessToken(): Promise<string> {
  // Se token válido no cache, retorna
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return cachedToken;
  }

  console.log('[GameProvider] Obtendo novo access token...');

  const response = await fetch(`${PROVIDER_API}/agent/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error('[GameProvider] Falha na autenticação:', data);
    throw new Error(data.message || 'Falha na autenticação com Game Provider');
  }

  // Atualiza cache
  cachedToken = data.data.accessToken;
  tokenExpiresAt = new Date(Date.now() + (data.data.expiresIn * 1000) - 60000); // 1 min antes de expirar

  console.log('[GameProvider] Token obtido com sucesso');
  return cachedToken;
}

/**
 * Lista jogos disponíveis no provider
 */
export async function getGames(): Promise<GameProviderGame[]> {
  const token = await getAccessToken();

  const response = await fetch(`${PROVIDER_API}/agent/games`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha ao listar jogos');
  }

  return data.data;
}

/**
 * Obtém perfil do agente (créditos, status, etc)
 */
export async function getAgentProfile(): Promise<AgentProfile> {
  const token = await getAccessToken();

  const response = await fetch(`${PROVIDER_API}/agent/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Falha ao obter perfil');
  }

  return data.data;
}

/**
 * Cria sessão de jogo para um jogador
 */
export async function createGameSession(params: {
  userId: string;
  gameId: string;
  playerBalance: number;
  mode?: 'REAL' | 'DEMO';
  returnUrl?: string;
  metadata?: Record<string, unknown>;
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
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error('[GameProvider] Falha ao criar sessão:', data);
    throw new Error(data.message || 'Falha ao criar sessão de jogo');
  }

  // Provider retorna 'launchUrl', mapeamos para 'gameUrl' também
  // Workaround: substituir localhost:3006 pela URL de produção do provider
  let launchUrl = data.data.launchUrl;
  if (launchUrl && launchUrl.includes('localhost:3006')) {
    launchUrl = launchUrl.replace('http://localhost:3006', 'https://api.ultraself.space/originals');
  }
  
  return {
    ...data.data,
    launchUrl,
    gameUrl: launchUrl,
  };
}

/**
 * Testa conexão com o provider
 */
export async function testConnection(): Promise<{
  success: boolean;
  agentName?: string;
  spinCredits?: number;
  error?: string;
}> {
  try {
    const profile = await getAgentProfile();
    return {
      success: true,
      agentName: profile.name,
      spinCredits: profile.spinCredits,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
