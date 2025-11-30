# Plano de Desenvolvimento - PlayInvest

## 📋 Visão Geral

Plataforma híbrida de **Casa de Apostas + Fintech** com sistema de rendimentos automáticos.

---

## 🎨 Identidade Visual

| Item | Valor |
|------|-------|
| **Primary Color** | `#00faff` (Ciano Neon) |
| **Background** | `#00020e` (Azul Escuro) |
| **Fonte Principal** | Satoshi |
| **Fonte Secundária** | Switzer |
| **Fonte Display** | Walsheim |

---

## 🏗️ Arquitetura de Rotas

```
/                       → Bet (Mobile-first, Pública)
├── /                   → Home/Lobby de Jogos
├── /game/[id]          → Iframe do Jogo
├── /carteira           → Carteira Unificada
├── /perfil             → Perfil do Usuário
├── /login              → Login
└── /cadastro           → Cadastro

/admin                  → Painel Admin (Desktop, Privada)
├── /admin              → Dashboard Principal
├── /admin/financeiro   → Operacional (Depósitos/Saques)
├── /admin/jogos        → Gestão de Jogos
├── /admin/usuarios     → Gestão de Usuários
├── /admin/integracoes  → Hub de Integrações
├── /admin/banking      → FBSPAY Embedado (condicional)
└── /admin/editor       → CMS Visual
```

---

## 📱 Módulo Usuário (Mobile-First)

### 1. Sistema de Autenticação
- [ ] Popup Login/Cadastro ao acessar
- [ ] Guest Mode (visitante pode ver jogos)
- [ ] Restrições: jogar/carteira exigem login
- [ ] NextAuth.js ou Auth personalizado

### 2. Menu Inferior (3 itens)
- [ ] **Games** - Lobby com categorias e busca
- [ ] **Carteira** - Área financeira unificada
- [ ] **Perfil** - Dados e configurações

### 3. Lobby de Jogos
- [ ] Grid responsivo de cards de jogos
- [ ] Categorias (Slots, Ao Vivo, etc.)
- [ ] Busca de jogos
- [ ] Integração com Game Provider API

### 4. Carteira Unificada
- [ ] Depósito PIX (gera QR Code)
- [ ] Visualização:
  - Saldo Total Investido
  - Previsão de Rendimento (até 3%/mês)
  - Rendimentos Disponíveis (sacáveis)
- [ ] Saque de Juros (mensal)
- [ ] Histórico de transações

### 5. Perfil do Usuário
- [ ] Dados pessoais
- [ ] Verificação de identidade
- [ ] Configurações de notificação
- [ ] Histórico de apostas

---

## 🖥️ Módulo Admin (Desktop)

### 1. Dashboard Principal
- [ ] Métricas em tempo real
- [ ] Gráficos de depósitos/saques
- [ ] Usuários ativos
- [ ] Volume de apostas

### 2. Operacional Financeiro
- [ ] Histórico de depósitos
- [ ] Fila de saques pendentes
- [ ] Aprovar/Rejeitar saques
- [ ] Integração com Gateway para pagar PIX

### 3. Gestão de Jogos
- [ ] Listagem de jogos do Provider
- [ ] Ativar/Desativar jogos
- [ ] Configurar categorias
- [ ] Ordenação e destaque

### 4. Gestão de Usuários
- [ ] Lista de jogadores
- [ ] Detalhes do usuário
- [ ] Histórico financeiro
- [ ] Bloquear/Desbloquear

### 5. Hub de Integrações
- [ ] Multi-Gateway (PixUp, Quack, FBSPAY)
- [ ] Formulário de configuração (API URL, Token, Secret)
- [ ] Teste de conexão
- [ ] Ativação condicional de módulos

### 6. Banking FBSPAY (Condicional)
- [ ] Aparece apenas se integração ativa
- [ ] Iframe/Embed do painel Dinpayz
- [ ] Saldo real da operação
- [ ] Conciliação de entradas
- [ ] Transferências externas

### 7. Editor Visual (CMS)
- [ ] Live Preview mobile
- [ ] Editar cores (Primary/Secondary)
- [ ] Upload de Logo
- [ ] Gerenciar Banners
- [ ] Textos de boas-vindas
- [ ] Publicar com invalidação de cache

---

## 🗄️ Modelo de Dados (Prisma)

### Entidades Principais

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?
  name          String?
  cpf           String?  @unique
  passwordHash  String
  role          Role     @default(PLAYER)
  verified      Boolean  @default(false)
  blocked       Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  walletGame    WalletGame?
  walletInvest  WalletInvest?
  transactions  Transaction[]
  bets          Bet[]
  withdrawals   Withdrawal[]
}

enum Role {
  PLAYER
  ADMIN
  SUPER_ADMIN
}

model WalletGame {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Decimal  @default(0)
  user      User     @relation(fields: [userId], references: [id])
}

model WalletInvest {
  id              String   @id @default(cuid())
  userId          String   @unique
  principal       Decimal  @default(0)  // Capital travado
  yields          Decimal  @default(0)  // Juros disponíveis
  lockedUntil     DateTime?
  user            User     @relation(fields: [userId], references: [id])
}

model Transaction {
  id          String          @id @default(cuid())
  userId      String
  type        TransactionType
  amount      Decimal
  status      TransactionStatus
  gatewayRef  String?
  metadata    Json?
  createdAt   DateTime        @default(now())
  user        User            @relation(fields: [userId], references: [id])
}

enum TransactionType {
  DEPOSIT
  WITHDRAW_GAME
  WITHDRAW_YIELDS
  BET
  WIN
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

model Withdrawal {
  id          String           @id @default(cuid())
  userId      String
  amount      Decimal
  type        WithdrawType
  pixKey      String
  status      WithdrawalStatus
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime         @default(now())
  user        User             @relation(fields: [userId], references: [id])
}

enum WithdrawType {
  GAME_BALANCE
  YIELDS
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}

model Game {
  id          String   @id @default(cuid())
  providerId  String   @unique
  name        String
  thumbnail   String
  category    String
  provider    String
  active      Boolean  @default(true)
  order       Int      @default(0)
  featured    Boolean  @default(false)
  bets        Bet[]
}

model Bet {
  id        String   @id @default(cuid())
  userId    String
  gameId    String
  amount    Decimal
  result    Decimal?
  status    BetStatus
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  game      Game     @relation(fields: [gameId], references: [id])
}

enum BetStatus {
  ACTIVE
  WON
  LOST
}

model Gateway {
  id          String   @id @default(cuid())
  name        String
  type        String   // pixup, quack, fbspay
  apiUrl      String
  credentials Json     // Encrypted
  active      Boolean  @default(false)
  primary     Boolean  @default(false)
}

model SiteConfig {
  id              String   @id @default(cuid())
  primaryColor    String   @default("#00faff")
  secondaryColor  String   @default("#00020e")
  logo            String?
  banners         Json?    // Array de banners
  welcomeText     String?
  updatedAt       DateTime @updatedAt
}
```

---

## 🔧 Integrações

### 1. Game Provider (api.ultraself.space)
- Autenticação
- Listagem de jogos
- Launch URL (iframe)
- Callbacks de resultado

### 2. Gateway de Pagamento
- **Depósito:** Gerar QR Code PIX
- **Webhook:** Confirmar pagamento + Split automático
- **Saque:** Enviar PIX via API

### 3. FBSPAY (Dinpayz)
- Embed do painel
- API de transferência
- Conciliação

---

## 📅 Roadmap de Fases

### Fase 1: Fundação (Semana 1-2)
- [x] Configuração Next.js + Prisma
- [ ] Schema do banco de dados
- [ ] Sistema de autenticação
- [ ] Layout base Mobile (Bet)
- [ ] Layout base Desktop (Admin)

### Fase 2: Core Bet (Semana 3-4)
- [ ] Integração Game Provider
- [ ] Lobby de jogos
- [ ] Iframe de jogo
- [ ] Guest mode

### Fase 3: Financeiro (Semana 5-6)
- [ ] Hub de integrações (Admin)
- [ ] Depósito PIX + Webhook
- [ ] Lógica de Split
- [ ] Carteira Unificada (UI)

### Fase 4: Admin Completo (Semana 7-8)
- [ ] Dashboard com métricas
- [ ] Fila de saques
- [ ] Gestão de usuários
- [ ] FBSPAY embedado

### Fase 5: Investimentos (Semana 9-10)
- [ ] Cron job de rendimentos
- [ ] UI de investimentos
- [ ] Saque de juros
- [ ] Histórico

### Fase 6: CMS & Polish (Semana 11-12)
- [ ] Editor Visual
- [ ] PWA (manifest + service worker)
- [ ] Testes
- [ ] Deploy

---

## 🎯 Próximos Passos Imediatos

1. **Configurar Prisma** com o schema acima
2. **Criar estrutura de pastas** para Bet (mobile) e Admin (desktop)
3. **Implementar autenticação** com NextAuth ou custom
4. **Desenvolver layout mobile** com menu inferior
5. **Criar dashboard admin** usando componentes shadcn existentes

---

## ⚠️ Pontos de Atenção

- **Segurança:** Criptografar credenciais de gateway
- **Performance:** Usar ISR/SSG onde possível
- **Mobile:** Testar em diversos dispositivos
- **Compliance:** Verificar regulamentações de apostas
- **Backup:** Estratégia de backup do banco
