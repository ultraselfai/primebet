Claro! Aqui está a documentação completa:

```markdown
# 📚 Documentação Completa da API - Game Provider

**Última Atualização:** 28 de Novembro de 2025  
**Versão da API:** v1  
**URL de Produção:** `https://api.ultraself.space`  
**Status:** ✅ Em Produção

---

## 📖 Índice

1. [Visão Geral](#1-visão-geral)
2. [Autenticação](#2-autenticação)
3. [Fluxo de Integração](#3-fluxo-de-integração)
4. [Endpoints da API](#4-endpoints-da-api)
5. [Webhooks (Bet → Provider)](#5-webhooks-bet--provider)
6. [Configuração no Admin da Bet](#6-configuração-no-admin-da-bet)
7. [Modelo de Dados](#7-modelo-de-dados)
8. [Exemplos de Código](#8-exemplos-de-código)
9. [Tratamento de Erros](#9-tratamento-de-erros)

---

## 1. Visão Geral

O Game Provider é um **motor de jogos B2B** que fornece slots para plataformas de apostas. A Bet integra como um **Agente** (operador) que consome a API.

### Arquitetura de Integração

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│    BET (Next.js)    │◄───────►│   GAME PROVIDER     │
│                     │   API   │   (NestJS)          │
│  ┌───────────────┐  │         │                     │
│  │ Admin Panel   │  │         │  api.ultraself.space│
│  │ - Config API  │  │         │                     │
│  │ - Tokens      │  │         └─────────────────────┘
│  └───────────────┘  │                   │
│                     │                   │
│  ┌───────────────┐  │         ┌─────────▼───────────┐
│  │ Player App    │  │         │                     │
│  │ - Lobby       │──┼────────►│   GAME IFRAME       │
│  │ - Play Game   │  │         │   (Fortune Tiger)   │
│  └───────────────┘  │         │                     │
│                     │         └─────────────────────┘
└─────────────────────┘
```

### Jogos Disponíveis

| Código | Nome | RTP | Volatilidade |
|--------|------|-----|--------------|
| `fortune-tiger` | Fortune Tiger | 96.5% | Média |
| `fortune-ox` | Fortune Ox | 96.2% | Alta |
| `fortune-rabbit` | Fortune Rabbit | 96.8% | Média |
| `fortune-dragon` | Fortune Dragon | 96.0% | Alta |
| `fortune-mouse` | Fortune Mouse | 96.3% | Baixa |

---

## 2. Autenticação

### 2.1. Credenciais Necessárias

Para integrar, a Bet precisa de:

| Campo | Descrição | Onde Obter |
|-------|-----------|------------|
| `apiKey` | Identificador público do agente | Fornecido ao criar agente no Provider |
| `apiSecret` | Chave secreta para autenticação | Fornecido **uma única vez** ao criar agente |
| `accessToken` | Token JWT para chamadas autenticadas | Obtido via `/api/v1/agent/auth` |

### 2.2. Obter Access Token

Antes de usar a API, a Bet deve trocar `apiKey + apiSecret` por um `accessToken`:

```http
POST https://api.ultraself.space/api/v1/agent/auth
Content-Type: application/json

{
  "apiKey": "agk_abc123...",
  "apiSecret": "ags_xyz789..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "agentId": "uuid-do-agente"
  }
}
```

### 2.3. Usando o Access Token

Todas as chamadas autenticadas devem incluir o header:

```http
Authorization: Bearer <accessToken>
```

**Tempo de Expiração:** 24 horas. A Bet deve renovar quando expirar.

---

## 3. Fluxo de Integração

### 3.1. Fluxo Completo (Jogador Abre um Jogo)

```
JOGADOR                    BET                         GAME PROVIDER
   │                        │                                │
   │  1. Clica no jogo      │                                │
   │───────────────────────►│                                │
   │                        │                                │
   │                        │  2. POST /agent/sessions       │
   │                        │  {userId, gameId, balance}     │
   │                        │───────────────────────────────►│
   │                        │                                │
   │                        │  3. Retorna gameUrl + token    │
   │                        │◄───────────────────────────────│
   │                        │                                │
   │  4. Redirect/iframe    │                                │
   │◄───────────────────────│                                │
   │                        │                                │
   │  5. Abre jogo no iframe│                                │
   │─────────────────────────────────────────────────────────►
   │                        │                                │
   │                        │  6. Webhooks (debit/credit)    │
   │                        │◄───────────────────────────────│
   │                        │                                │
   │  7. Joga normalmente   │                                │
   │◄────────────────────────────────────────────────────────►
```

### 3.2. Dois Modos de Operação

O Provider suporta dois modos:

#### Modo LOCAL (Saldo Cacheado)
- Saldo é gerenciado **dentro do Provider**
- Bet envia `playerBalance` ao criar sessão
- Mais simples de integrar
- **Recomendado para começar**

#### Modo REMOTE (Webhooks)
- Provider chama webhooks da Bet para **debit/credit**
- Saldo real está na Bet
- Requer implementar 3 endpoints na Bet
- **Recomendado para produção**

---

## 4. Endpoints da API

### Base URL
```
https://api.ultraself.space/api/v1
```

---

### 4.1. Autenticação

#### `POST /agent/auth` - Obter Token
Troca credenciais por access token.

**Request:**
```json
{
  "apiKey": "agk_abc123...",
  "apiSecret": "ags_xyz789..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 86400,
    "agentId": "uuid"
  }
}
```

---

### 4.2. Perfil do Agente

#### `GET /agent/profile` - Dados do Agente
Retorna informações do agente autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Minha Bet",
    "email": "admin@minabet.com",
    "spinCredits": 10000,
    "totalCreditsPurchased": 50000,
    "totalSpinsConsumed": 40000,
    "ggrRate": 10,
    "allowedGames": ["fortune-tiger", "fortune-ox"],
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 4.3. Jogos Disponíveis

#### `GET /agent/games` - Listar Jogos
Retorna jogos que o agente pode oferecer.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "gameCode": "fortune-tiger",
      "name": "Fortune Tiger",
      "thumbnail": "https://api.ultraself.space/assets/fortune-tiger/thumb.png",
      "rtp": 96.5,
      "volatility": "medium",
      "minBet": 0.1,
      "maxBet": 100,
      "isActive": true
    },
    {
      "gameCode": "fortune-ox",
      "name": "Fortune Ox",
      "thumbnail": "https://api.ultraself.space/assets/fortune-ox/thumb.png",
      "rtp": 96.2,
      "volatility": "high",
      "minBet": 0.1,
      "maxBet": 100,
      "isActive": true
    }
  ]
}
```

---

### 4.4. Criar Sessão de Jogo ⭐

#### `POST /agent/sessions` - Abrir Jogo
**Este é o endpoint principal.** Cria uma sessão de jogo e retorna a URL para o jogador.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "player-123",
  "gameId": "fortune-tiger",
  "currency": "BRL",
  "playerBalance": 1000.00,
  "mode": "REAL",
  "returnUrl": "https://minabet.com/lobby",
  "metadata": {
    "playerName": "João Silva"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `userId` | string | ✅ | ID único do jogador na Bet |
| `gameId` | string | ✅ | Código do jogo (ex: `fortune-tiger`) |
| `currency` | string | ❌ | Moeda (default: `BRL`) |
| `playerBalance` | number | ❌ | Saldo do jogador (default: 1000) |
| `mode` | enum | ❌ | `REAL` ou `DEMO` (default: `REAL`) |
| `returnUrl` | string | ❌ | URL para voltar ao lobby |
| `metadata` | object | ❌ | Dados extras (ex: nome do player) |

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "sess_abc123xyz...",
    "gameUrl": "https://api.ultraself.space/originals/fortune-tiger/?token=sess_abc123xyz...",
    "expiresAt": "2024-11-28T22:00:00Z"
  }
}
```

#### Como usar a `gameUrl`:
```html
<!-- Opção 1: iframe fullscreen -->
<iframe 
  src="https://api.ultraself.space/originals/fortune-tiger/?token=sess_abc123xyz..."
  style="width: 100%; height: 100vh; border: none;"
  allowfullscreen
></iframe>

<!-- Opção 2: Redirect -->
<script>
  window.location.href = gameUrl;
</script>
```

---

### 4.5. Transações do Agente

#### `GET /agent/transactions` - Histórico
Retorna transações de créditos do agente.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "credit_addition",
      "amount": 1000,
      "previousBalance": 5000,
      "newBalance": 6000,
      "description": "Compra de 1000 créditos",
      "createdAt": "2024-11-28T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "spin_consumption",
      "amount": -50,
      "previousBalance": 6000,
      "newBalance": 5950,
      "description": "50 spins consumidos",
      "createdAt": "2024-11-28T12:00:00Z"
    }
  ]
}
```

---

## 5. Webhooks (Bet → Provider)

Se você quiser que o **saldo real** fique na Bet (modo REMOTE), precisa implementar estes endpoints na sua API:

### 5.1. Configurar Webhooks no Agente

O agente deve ter configurado:
- `balanceCallbackUrl` - Para consultar saldo
- `debitCallbackUrl` - Para debitar apostas
- `creditCallbackUrl` - Para creditar ganhos

### 5.2. Endpoint de Saldo

```http
POST https://minabet.com/api/webhooks/game-provider/balance
Content-Type: application/json
X-Webhook-Secret: <webhookSecret>

{
  "sessionToken": "sess_abc123...",
  "playerId": "player-123",
  "gameCode": "fortune-tiger"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "balance": 1500.50,
  "currency": "BRL"
}
```

### 5.3. Endpoint de Débito (Aposta)

```http
POST https://minabet.com/api/webhooks/game-provider/debit
Content-Type: application/json
X-Webhook-Secret: <webhookSecret>

{
  "sessionToken": "sess_abc123...",
  "playerId": "player-123",
  "roundId": "round-uuid",
  "amount": 10.00,
  "gameCode": "fortune-tiger"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "balance": 1490.50,
  "transactionId": "tx-uuid-bet"
}
```

**Se saldo insuficiente:**
```json
{
  "success": false,
  "error": "Insufficient balance",
  "balance": 5.00
}
```

### 5.4. Endpoint de Crédito (Ganho)

```http
POST https://minabet.com/api/webhooks/game-provider/credit
Content-Type: application/json
X-Webhook-Secret: <webhookSecret>

{
  "sessionToken": "sess_abc123...",
  "playerId": "player-123",
  "roundId": "round-uuid",
  "amount": 50.00,
  "gameCode": "fortune-tiger"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "balance": 1540.50,
  "transactionId": "tx-uuid-win"
}
```

---

## 6. Configuração no Admin da Bet

### 6.1. Tela de Configuração do Provider

O Admin da Bet deve ter uma seção para configurar a integração:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Configurações do Game Provider                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  URL da API:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://api.ultraself.space                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  API Key:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ agk_abc123def456ghi789...                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  API Secret:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••••••••••••••••                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Status: ✅ Conectado | Créditos: 10.000 spins                  │
│                                                                 │
│  [Testar Conexão]  [Salvar]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2. Dados a Armazenar no Banco (Bet)

```prisma
model GameProviderConfig {
  id            String   @id @default(cuid())
  
  // Conexão com Provider
  apiUrl        String   @default("https://api.ultraself.space")
  apiKey        String   // Fornecido pelo Provider
  apiSecret     String   // Fornecido pelo Provider (encriptar!)
  
  // Token de Acesso (cache)
  accessToken   String?  
  tokenExpiresAt DateTime?
  
  // Status
  isActive      Boolean  @default(true)
  lastSyncAt    DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 6.3. Service de Integração (Next.js)

```typescript
// lib/services/game-provider.service.ts

const PROVIDER_API = process.env.GAME_PROVIDER_URL || 'https://api.ultraself.space';

interface ProviderConfig {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
}

class GameProviderService {
  private config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Obtém ou renova o access token
   */
  async getAccessToken(): Promise<string> {
    // Se token válido, retorna
    if (this.config.accessToken && this.config.tokenExpiresAt) {
      if (new Date() < this.config.tokenExpiresAt) {
        return this.config.accessToken;
      }
    }

    // Senão, obtém novo token
    const response = await fetch(`${PROVIDER_API}/api/v1/agent/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Falha na autenticação com Game Provider');
    }

    // Atualiza cache
    this.config.accessToken = data.data.accessToken;
    this.config.tokenExpiresAt = new Date(Date.now() + data.data.expiresIn * 1000);

    // Salvar no banco também...
    
    return data.data.accessToken;
  }

  /**
   * Lista jogos disponíveis
   */
  async getGames() {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${PROVIDER_API}/api/v1/agent/games`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    return data.data;
  }

  /**
   * Cria sessão de jogo para o jogador
   */
  async createSession(params: {
    userId: string;
    gameId: string;
    playerBalance: number;
    returnUrl?: string;
  }) {
    const token = await this.getAccessToken();

    const response = await fetch(`${PROVIDER_API}/api/v1/agent/sessions`, {
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
        mode: 'REAL',
        returnUrl: params.returnUrl,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Falha ao criar sessão');
    }

    return data.data; // { sessionToken, gameUrl, expiresAt }
  }

  /**
   * Obtém perfil do agente (para verificar créditos)
   */
  async getProfile() {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${PROVIDER_API}/api/v1/agent/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    return data.data;
  }
}

export { GameProviderService };
```

---

## 7. Modelo de Dados

### 7.1. Game Session (no Provider)

```typescript
interface GameSession {
  id: string;
  sessionToken: string;
  operatorId: string;      // ID do Agente (Bet)
  playerId: string;        // ID do jogador na Bet
  gameCode: string;        // ex: 'fortune-tiger'
  playerCurrency: string;  // ex: 'BRL'
  cachedBalance: number;   // Saldo do jogador (modo LOCAL)
  status: 'active' | 'expired' | 'closed';
  expiresAt: Date;
  createdAt: Date;
}
```

### 7.2. Game Round (Rodada/Spin)

```typescript
interface GameRound {
  id: string;
  roundId: string;         // UUID único da rodada
  sessionId: string;
  playerId: string;
  gameCode: string;
  betAmount: number;       // Valor apostado
  winAmount: number;       // Valor ganho
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  resultData: object;      // Dados do resultado (grid, linhas, etc)
  createdAt: Date;
  completedAt?: Date;
}
```

---

## 8. Exemplos de Código

### 8.1. API Route - Abrir Jogo (Next.js App Router)

```typescript
// app/api/games/[gameId]/launch/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { GameProviderService } from '@/lib/services/game-provider.service';

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  // 1. Verificar autenticação
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Buscar usuário e saldo
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, gameBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // 3. Buscar config do Provider
  const providerConfig = await prisma.gameProviderConfig.findFirst();
  if (!providerConfig) {
    return NextResponse.json({ error: 'Provider não configurado' }, { status: 500 });
  }

  // 4. Criar sessão no Provider
  const provider = new GameProviderService({
    apiKey: providerConfig.apiKey,
    apiSecret: providerConfig.apiSecret,
  });

  try {
    const gameSession = await provider.createSession({
      userId: user.id,
      gameId: params.gameId,
      playerBalance: Number(user.gameBalance),
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/lobby`,
    });

    return NextResponse.json({
      success: true,
      data: {
        gameUrl: gameSession.gameUrl,
        sessionToken: gameSession.sessionToken,
        expiresAt: gameSession.expiresAt,
      },
    });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json(
      { error: 'Falha ao abrir jogo' },
      { status: 500 }
    );
  }
}
```

### 8.2. Componente - Lobby de Jogos

```tsx
// components/GameLobby.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Game {
  gameCode: string;
  name: string;
  thumbnail: string;
  rtp: number;
}

export function GameLobby() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data.data || []);
        setLoading(false);
      });
  }, []);

  const launchGame = async (gameCode: string) => {
    const res = await fetch(`/api/games/${gameCode}/launch`, {
      method: 'POST',
    });
    
    const data = await res.json();
    
    if (data.success) {
      // Abre em fullscreen
      window.location.href = data.data.gameUrl;
    } else {
      alert(data.error || 'Erro ao abrir jogo');
    }
  };

  if (loading) return <div>Carregando jogos...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {games.map(game => (
        <div
          key={game.gameCode}
          className="cursor-pointer hover:scale-105 transition"
          onClick={() => launchGame(game.gameCode)}
        >
          <Image
            src={game.thumbnail}
            alt={game.name}
            width={200}
            height={200}
            className="rounded-lg"
          />
          <p className="mt-2 text-center font-semibold">{game.name}</p>
          <p className="text-center text-sm text-gray-500">RTP: {game.rtp}%</p>
        </div>
      ))}
    </div>
  );
}
```

### 8.3. Webhook Handler (Modo REMOTE)

```typescript
// app/api/webhooks/game-provider/debit/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  // 1. Validar webhook secret
  const headersList = headers();
  const webhookSecret = headersList.get('x-webhook-secret');
  
  if (webhookSecret !== process.env.GAME_PROVIDER_WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const { playerId, roundId, amount, gameCode } = body;

  // 3. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { id: playerId },
    select: { id: true, gameBalance: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' });
  }

  // 4. Verificar saldo
  const currentBalance = Number(user.gameBalance);
  if (currentBalance < amount) {
    return NextResponse.json({
      success: false,
      error: 'Insufficient balance',
      balance: currentBalance,
    });
  }

  // 5. Debitar saldo
  const newBalance = currentBalance - amount;
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: playerId },
      data: { gameBalance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId: playerId,
        type: 'BET',
        wallet: 'GAME',
        amount: -amount,
        balanceAfter: newBalance,
        referenceId: roundId,
        referenceType: 'game_round',
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    balance: newBalance,
    transactionId: `tx-${Date.now()}`,
  });
}
```

---

## 9. Tratamento de Erros

### Códigos de Erro Comuns

| Código | Erro | Descrição |
|--------|------|-----------|
| 401 | `Invalid credentials` | API Key ou Secret incorretos |
| 401 | `Token expired` | Access token expirou, renovar |
| 403 | `Agent inactive` | Agente desativado no Provider |
| 404 | `Game not found` | Código do jogo inválido |
| 400 | `Insufficient credits` | Agente sem créditos de spin |
| 400 | `Invalid session` | Sessão expirada ou inválida |

### Exemplo de Tratamento

```typescript
try {
  const session = await provider.createSession({ ... });
  return session.gameUrl;
} catch (error) {
  if (error.message.includes('expired')) {
    // Força renovação do token
    await provider.refreshToken();
    return provider.createSession({ ... });
  }
  
  if (error.message.includes('Insufficient credits')) {
    // Notifica admin
    await notifyAdmin('Créditos de spin esgotados no Provider!');
    throw new Error('Sistema temporariamente indisponível');
  }
  
  throw error;
}
```

---

## 📞 Suporte

- **Documentação Swagger:** https://api.ultraself.space/api/docs
- **Health Check:** https://api.ultraself.space/health
- **Admin Panel:** https://console.ultraself.space

---

## Checklist de Integração

- [ ] Configurar `apiKey` e `apiSecret` no Admin da Bet
- [ ] Implementar serviço de autenticação (obter/renovar token)
- [ ] Implementar listagem de jogos no Lobby
- [ ] Implementar abertura de jogo (criar sessão)
- [ ] Testar em modo LOCAL primeiro
- [ ] (Opcional) Implementar webhooks para modo REMOTE
- [ ] Testar fluxo completo com jogador real
