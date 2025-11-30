# Instruções para Agentes Copilot
## Visão Geral
- Projeto Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui, entregando um lobby Bet mobile-first e um painel admin; leia `PRD-playinvest.md` para entender o split de depósitos e o posicionamento fintech.
## Fluxos de Desenvolvimento
- Use `pnpm install` e `pnpm dev` (porta 3000); rode `docker compose up -d postgres` e configure `DATABASE_URL` antes de tocar nas APIs.
- Popular dados: `pnpm db:push`, `pnpm db:seed` cria usuários/carteiras, `npx tsx scripts/seed-games.ts` registra jogos; `pnpm db:reset` limpa tudo.
## Arquitetura & Pastas
- Rotas App Router ficam em `src/app`: `(bet)` é a experiência mobile, `(dashboard)` é o admin protegido, `landing/` mantém a página institucional, `api/**` aloja handlers REST/Next.
- Componentes compartilhados vivem em `src/components`; `src/components/bet` e `src/components/ui` concentram o lobby e o kit shadcn, enquanto layouts/temas ficam em `src/components/layouts` e `src/components/theme-customizer`.
- Estados globais residem em `src/contexts` (ex.: `sidebar-context`, `bet-auth-context`) com hooks em `src/hooks`; utilidades/domain logic vão para `src/services` e `src/lib`.
## Autenticação & Proteções
- NextAuth v5 (JWT strategy) está configurado em `src/lib/auth.ts` com provider de credenciais + PrismaAdapter; exponha novos dados via callbacks.
- `AuthProvider` (admin) e `BetAuthProvider` (lobby) envolvem o layout no `src/app/layout.tsx` e em `(bet)/layout.tsx`, fornecendo modal, toasts e cache de saldo (veja `useBetAuth`).
- `src/app/actions/auth.ts` guarda server actions de login/cadastro usando zod + bcrypt; reaproveite validações em novos formulários.
- `src/middleware.ts` decide quem acessa rotas admin (`/dashboard`, `/integracoes`, etc.) e telas protegidas de jogador (`/carteira`, `/depositar`); ao criar novas rotas privadas, atualize os arrays ali.
## Dados & Prisma
- O schema (`prisma/schema.prisma`) define usuários, carteiras duplas, transações, jogos e integrações; qualquer mudança exige `pnpm db:push` ou uma migração formal.
- `src/lib/prisma.ts` expõe o singleton; importe `prisma` diretamente em APIs/services para evitar múltiplas conexões.
- `prisma/seed.ts` provisiona admin + jogadores, enquanto `scripts/seed-games.ts` dá exemplos de `Game`; mantenha tags/categorias alinhadas com `GameCategory` enum.
## Lógica Financeira & Serviços
- `src/services/deposit.service.ts` materializa o “Split Duplo”: confirmar um depósito credita o mesmo valor em `WalletGame` e `WalletInvest` e gera logs; reaproveite essa service em webhooks e APIs de gateway.
- Carteira pública consulta `/api/wallet/game/route.ts`, que cacheia saldos em memória e suporta impersonação por cookie; invalide com `invalidateBalanceCache` sempre que editar o saldo.
## APIs Internas
- Handlers seguem o padrão Next Route Handler (`export async function GET/POST` + `NextResponse`); valide query params manualmente e capture erros para logar via `console.error`.
- `src/app/api/games` centraliza CRUD, filtros e sync de provedores; reutilize `Prisma.GameWhereInput` ao criar filtros avançados.
- Configurações públicas (`/api/settings/public`) alimentam o lobby; mantenha qualquer novo campo serializável para SerDes no frontend.
## UI, Temas & Layout
- O `RootLayout` envolve `ThemeProvider` (next-themes) + `SidebarConfigProvider`; o dashboard usa `AppSidebar`, `SiteHeader` e `ThemeCustomizer` (veja `src/components/theme-customizer` e `src/config/theme-data.ts`).
- O lobby reutiliza `BetLayout`, `BetHeader`, `CategoryTabs`, `GameGrid` (em `src/components/bet`); siga o padrão `props` + `useBetAuth` para gating de interações.
- `globals.css` define tokens via OKLCH, variantes `@theme inline` e correções de sidebar; mantenha novos estilos compatíveis com Tailwind v4 (`@import "tailwindcss"`).
## Convenções Adicionais
- Path alias único `@/*` (configurado no `tsconfig`); prefira importar de `@/components/...`, `@/lib/...` etc.
- Componentes shadcn vivem em `src/components/ui`; para gerar novos, alinhe `components.json` e mantenha classes Tailwind idiomáticas.
- Linguagem padrão da UI/API é PT-BR; mensagens de erro/logs seguem o mesmo idioma.
- Imagens remotas precisam constar em `next.config.ts (images.remotePatterns)` antes de usar `<Image>`.
- Sempre consulte `docs/` e `PRD-playinvest.md` antes de alterar regras de negócio (aprovação de saques, integrações FBSPAY, editor visual) para não quebrar requisitos.
