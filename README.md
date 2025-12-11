# PrimeBet

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Plataforma completa de apostas online com sistema de investimentos integrado. Combina um **lobby de jogos mobile-first** para jogadores e um **painel administrativo** robusto para gestão da operação.

---

## 🎯 Visão Geral

O PrimeBet é uma solução fintech que une entretenimento e investimentos:

- **🎰 Lobby de Apostas** — Interface mobile-first com catálogo de jogos de diversos provedores
- **💰 Sistema de Carteiras Duplas** — Cada depósito é creditado tanto na carteira de jogos quanto na carteira de investimentos
- **📊 Painel Administrativo** — Gestão completa de usuários, finanças, jogos e configurações
- **🎨 Editor Visual** — Personalize cores, logos, banners e identidade visual sem código
- **🔐 KYC Integrado** — Sistema de verificação de identidade com aprovação administrativa

---

## ✨ Principais Funcionalidades

### 🎮 Para Jogadores

- **Lobby de Jogos** — Navegação por categorias (Slots, Crash, Ao Vivo, etc.)
- **Carteira Game** — Saldo para apostas com depósito via PIX
- **Carteira Invest** — Rendimentos mensais sobre o capital depositado
- **Perfil Completo** — Dados pessoais, histórico de apostas, verificação KYC
- **Notificações Push** — Alertas de promoções e atualizações

### 🏢 Para Administradores

- **Dashboard Analítico** — Métricas de usuários, depósitos e volume de apostas
- **Gestão de Usuários** — Listagem, bloqueio, impersonação e ajuste de saldo
- **Aprovações Financeiras** — Fila de saques com aprovação/rejeição manual
- **Gestão de Jogos** — CRUD completo, sincronização com provedores
- **Editor Visual** — Customização de tema, cores, logos e banners
- **Relatórios** — Visão consolidada de todas as operações

---

## 🏗️ Arquitetura

```
📁 primebet/
├── 📁 prisma/                    # Schema e migrações do banco
│   ├── schema.prisma             # Modelos: User, Wallet, Game, Transaction...
│   └── seed.ts                   # Seed de dados iniciais
│
├── 📁 src/
│   ├── 📁 app/                   # App Router (Next.js 15)
│   │   ├── 📁 (bet)/             # Rotas do lobby (mobile-first)
│   │   │   ├── 📁 carteira/      # Página da carteira
│   │   │   ├── 📁 depositar/     # Fluxo de depósito PIX
│   │   │   ├── 📁 jogo/[id]/     # Tela do jogo
│   │   │   ├── 📁 perfil/        # Perfil do jogador
│   │   │   └── 📁 sacar/         # Solicitação de saque
│   │   │
│   │   ├── 📁 (dashboard)/       # Rotas do admin (protegidas)
│   │   │   ├── 📁 dashboard/     # Home do painel
│   │   │   ├── 📁 usuarios/      # Gestão de usuários
│   │   │   ├── 📁 jogos/         # Gestão de jogos
│   │   │   ├── 📁 financeiro/    # Depósitos, saques, extrato
│   │   │   ├── 📁 aprovacoes/    # Fila de aprovações
│   │   │   ├── 📁 editor/        # Editor visual
│   │   │   └── 📁 configuracoes/ # Configurações gerais
│   │   │
│   │   ├── 📁 api/               # API Routes
│   │   │   ├── 📁 admin/         # Endpoints administrativos
│   │   │   ├── 📁 auth/          # Autenticação NextAuth
│   │   │   ├── 📁 games/         # CRUD de jogos
│   │   │   ├── 📁 wallet/        # Consulta de saldo
│   │   │   └── 📁 webhooks/      # Webhooks de provedores
│   │   │
│   │   └── 📁 landing/           # Página institucional
│   │
│   ├── 📁 components/
│   │   ├── 📁 bet/               # Componentes do lobby
│   │   ├── 📁 ui/                # shadcn/ui components
│   │   └── 📁 theme-customizer/  # Editor de temas
│   │
│   ├── 📁 contexts/              # Providers (Auth, Sidebar, etc.)
│   ├── 📁 hooks/                 # Custom hooks
│   ├── 📁 lib/                   # Utilitários (prisma, auth, etc.)
│   └── 📁 services/              # Lógica de negócio (deposits, etc.)
│
├── 📁 scripts/                   # Scripts auxiliares
├── 📄 docker-compose.yml         # PostgreSQL local
└── 📄 package.json
```

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+
- **pnpm** (recomendado)
- **Docker** (para PostgreSQL local)

### 1. Clone e Instale

```bash
git clone https://github.com/ultraselfai/primebet.git
cd primebet
pnpm install
```

### 2. Configure o Ambiente

Crie um arquivo `.env` na raiz:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/primebet?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"

# Game Provider (opcional)
GAME_PROVIDER_URL="https://api.gameprovider.fun/api/v1"
GAME_PROVIDER_API_KEY=""
GAME_PROVIDER_SECRET=""
```

### 3. Inicie o Banco de Dados

```bash
docker compose up -d postgres
```

### 4. Configure o Prisma

```bash
pnpm db:push    # Sincroniza schema com o banco
pnpm db:seed    # Popula dados iniciais (admin + jogadores)
```

### 5. Rode o Projeto

```bash
pnpm dev
```

**Acesse:**
- 🎮 **Lobby:** http://localhost:3000
- 🔐 **Admin:** http://localhost:3000/dashboard

**Credenciais padrão:**
- Admin: `admin@primebet.com` / `admin123`
- Jogador: `jogador@teste.com` / `123456`

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm dev:turbo        # Inicia com Turbopack (mais rápido)

# Build & Produção
pnpm build            # Build de produção
pnpm start            # Inicia servidor de produção

# Banco de Dados
pnpm db:push          # Sincroniza schema sem migração
pnpm db:seed          # Popula dados iniciais
pnpm db:reset         # Reseta banco (apaga tudo!)
pnpm db:studio        # Abre Prisma Studio (GUI)

# Linting
pnpm lint             # Executa ESLint
```

---

## 📦 Tech Stack

### **Core**
- **Next.js 15** — App Router, Server Components, API Routes
- **React 19** — Concurrent features, Suspense
- **TypeScript** — Type safety em todo o projeto

### **Estilização**
- **Tailwind CSS v4** — Utility-first com OKLCH colors
- **shadcn/ui** — Componentes acessíveis baseados em Radix UI
- **Lucide React** — Ícones consistentes

### **Dados**
- **Prisma** — ORM type-safe com PostgreSQL
- **NextAuth v5** — Autenticação com JWT strategy
- **Zustand** — Estado global leve

### **Formulários & Validação**
- **React Hook Form** — Formulários performáticos
- **Zod** — Validação de schemas

### **Extras**
- **Recharts** — Gráficos para dashboards
- **TanStack Table** — Tabelas avançadas
- **Web Push** — Notificações push

---

## 📊 Modelo de Dados

### Principais Entidades

| Entidade | Descrição |
|----------|-----------|
| `User` | Usuários (jogadores e admins) com KYC |
| `WalletGame` | Carteira de apostas |
| `WalletInvest` | Carteira de investimentos (principal + rendimentos) |
| `Transaction` | Depósitos, saques, apostas |
| `Withdrawal` | Fila de saques com aprovação |
| `Game` | Catálogo de jogos |
| `Bet` | Histórico de apostas |
| `SiteConfig` | Configurações visuais (CMS) |

### Sistema de Carteiras Duplas

Cada depósito confirmado credita automaticamente:
- ✅ Valor integral na **WalletGame** (para apostas)
- ✅ Valor integral na **WalletInvest** (capital bloqueado + rendimentos mensais)

---

## 🔐 Autenticação & Segurança

- **NextAuth v5** com JWT strategy
- **bcrypt** para hash de senhas
- **Middleware** protegendo rotas admin
- **Impersonação** de usuários para suporte
- **Verificação de senha** para operações sensíveis

### Rotas Protegidas

| Rota | Acesso |
|------|--------|
| `/dashboard/*` | ADMIN, SUPER_ADMIN |
| `/carteira`, `/depositar`, `/sacar` | Jogadores autenticados |
| `/perfil/*` | Jogadores autenticados |

---

## 🎨 Personalização Visual

O **Editor Visual** (`/editor`) permite customizar:

- 🎨 **Cores** — Primary, secondary, accent
- 🖼️ **Logos** — Logo claro/escuro, favicon
- 🏞️ **Banners** — Carrossel do lobby
- 📱 **Layout** — Colunas de jogos, navegação

As configurações são salvas no banco (`SiteConfig`) e aplicadas em tempo real.

---

## 📁 Estrutura de Pastas Detalhada

```
src/
├── app/
│   ├── (auth)/           # Login, cadastro, recuperação
│   ├── (bet)/            # Experiência do jogador
│   ├── (dashboard)/      # Painel administrativo
│   ├── api/              # API Routes
│   ├── landing/          # Página institucional
│   └── actions/          # Server Actions
│
├── components/
│   ├── bet/              # BetLayout, GameGrid, CategoryTabs...
│   ├── ui/               # shadcn/ui (Button, Card, Dialog...)
│   ├── landing/          # Componentes da landing page
│   └── theme-customizer/ # Editor de temas
│
├── contexts/             # AuthContext, SidebarContext...
├── hooks/                # useBetAuth, useSettings...
├── lib/                  # prisma, auth, utils
├── services/             # deposit.service, game-provider...
├── config/               # theme-data, sidebar-data
└── types/                # TypeScript types
```

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: nova feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Convenções

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **Código:** TypeScript strict, ESLint rules
- **Linguagem:** PT-BR para UI e mensagens

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

<div align="center">

**Desenvolvido com 💚 pela equipe PrimeBet**

</div>
