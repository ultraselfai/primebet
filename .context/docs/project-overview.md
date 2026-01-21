---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-01-20
status: filled
scaffoldVersion: "2.0.0"
---

# Project Overview

## Project Overview

PrimeBet é uma plataforma de apostas online completa que oferece uma experiência fintech inovadora com split duplo de depósitos. O projeto combina uma interface de lobby mobile-first para jogadores com um painel administrativo robusto, posicionando-se como uma solução fintech que divide automaticamente os depósitos entre carteiras de jogos e investimentos.

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `z:\dev\Projects\bet-primebet`
- Languages: TypeScript (200+ files), JavaScript (50+ files), CSS/SCSS (30+ files)
- Entry Points: 
  - Lobby: `src/app/(bet)/layout.tsx`
  - Admin: `src/app/(dashboard)/layout.tsx`
  - API: `src/app/api/`
- Framework: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- [src/app/layout.tsx](src/app/layout.tsx) — Root layout com providers globais
- [src/app/(bet)/layout.tsx](src/app/(bet)/layout.tsx) — Layout do lobby mobile-first
- [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx) — Layout do painel administrativo
- [src/app/api/](src/app/api/) — Handlers REST e Next.js API routes
- [src/middleware.ts](src/middleware.ts) — Middleware de autenticação e proteção de rotas

## Key Exports

Reference codebase-map.json for the complete list of 400+ exported symbols including:

- **Authentication**: `BetAuthProvider`, `AuthProvider`, `useBetAuth`
- **Financial Services**: `createDeposit`, `confirmDeposit`, `podpayRequest`
- **Game Management**: `GameGrid`, `CategoryTabs`, `gameProviderService`
- **UI Components**: shadcn/ui components, `BetLayout`, `AppSidebar`

## File Structure & Code Organization

- `src/app/` — Next.js App Router com rotas organizadas por grupos
  - `(bet)/` — Experiência mobile do lobby de apostas
  - `(dashboard)/` — Painel administrativo protegido
  - `(auth)/` — Páginas de autenticação
  - `api/` — API routes e webhooks
- `src/components/` — Componentes React compartilhados
  - `ui/` — Kit shadcn/ui
  - `bet/` — Componentes específicos do lobby
  - `layouts/` — Layouts reutilizáveis
- `src/services/` — Lógica de negócio e integrações externas
- `src/lib/` — Utilitários, configurações e helpers
- `src/contexts/` — Estados globais React Context
- `src/hooks/` — Custom hooks React
- `prisma/` — Schema do banco e migrations

## Technology Stack Summary

**Runtime & Platform**: Node.js com Next.js 15 (App Router) rodando em TypeScript, compilando para produção estática ou server-side rendering.

**Frontend Framework**: React 18+ com Tailwind CSS v4 para styling, shadcn/ui como design system, e next-themes para tematização avançada.

**Backend & Data**: Prisma ORM conectando ao PostgreSQL, NextAuth v5 para autenticação JWT, e integração com APIs externas via webhooks.

**Build Tooling**: ESLint + Prettier para linting/formatting, pnpm como package manager, e Docker Compose para ambiente de desenvolvimento.

## Core Framework Stack

**Backend**: Next.js API Routes servindo como BFF (Backend for Frontend), implementando padrão de server actions para mutations e route handlers para APIs REST.

**Frontend**: React Server Components + Client Components seguindo padrão de co-location, com estado global gerenciado via Context API para autenticação e cache de dados.

**Data Layer**: Prisma como ORM principal, implementando padrão Repository através de services, com cache em memória para dados críticos como saldos.

**Messaging**: Webhooks para comunicação assíncrona com gateways de pagamento e provedores de jogos, seguindo padrão event-driven para transações financeiras.

## UI & Interaction Libraries

**Design System**: shadcn/ui como base, customizado com tema próprio via CSS variables e Tailwind CSS v4, suportando dark/light mode e temas personalizáveis.

**Mobile-First**: Layout responsivo otimizado para mobile com breakpoints customizados, navegação bottom-tab no lobby e sidebar adaptativa no admin.

**Accessibility**: Componentes seguem WCAG guidelines através do shadcn/ui, com suporte a keyboard navigation e screen readers.

**Theming**: Sistema avançado de customização via `ThemeCustomizer` permitindo alteração dinâmica de cores, layouts e estilos.

## Development Tools Overview

**CLI Scripts**: `pnpm dev` para desenvolvimento, `pnpm db:*` para operações de banco, e scripts em `/scripts` para seeding e manutenção.

**Database Management**: Prisma Studio via `pnpm db:studio`, migrations automáticas com `pnpm db:push`, e seeding via `pnpm db:seed`.

**Testing & Quality**: ESLint configurado para Next.js + TypeScript, Prettier para formatação, e scripts de validação de dados.

Para configuração detalhada do ambiente, consulte [Tooling Guide](./tooling.md).

## Getting Started Checklist

1. **Instalar dependências**: `pnpm install`
2. **Configurar banco**: `docker compose up -d postgres` + configurar `DATABASE_URL`
3. **Popular dados**: `pnpm db:push` → `pnpm db:seed` → `npx tsx scripts/seed-games.ts`
4. **Iniciar desenvolvimento**: `pnpm dev` (porta 3000)
5. **Verificar funcionamento**: Acessar `http://localhost:3000` e testar login/cadastro
6. **Explorar admin**: Acessar `/dashboard` com credenciais de admin
7. **Revisar workflows**: Consultar [Development Workflow](./development-workflow.md) para processos diários

## Next Steps

**Product Context**: PrimeBet posiciona-se como uma fintech de apostas inovadora, implementando o conceito único de "Split Duplo" onde cada depósito credita automaticamente as carteiras de jogos e investimentos do usuário.

**Key Stakeholders**: Desenvolvido para operadores de apostas que buscam diferenciação no mercado através de funcionalidades fintech integradas.

**External Documentation**: Consulte `PRD-playinvest.md` para especificações detalhadas do produto e `docs/` para documentação técnica completa.

**Related Resources**:
- [Architecture](./architecture.md) — Visão arquitetural do sistema
- [Development Workflow](./development-workflow.md) — Processos de desenvolvimento
- [Tooling](./tooling.md) — Configuração do ambiente de desenvolvimento
