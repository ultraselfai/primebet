---
status: active
generated: 2026-01-21
priority: high
agents:
  - type: "architect-specialist"
    role: "Modelagem do schema Prisma e design das APIs"
  - type: "feature-developer"
    role: "Implementação de backend e frontend"
  - type: "code-reviewer"
    role: "Revisão de código e qualidade"
phases:
  - id: "phase-1"
    name: "Database & Schema"
    prevc: "P"
    status: "pending"
  - id: "phase-2"
    name: "Backend APIs"
    prevc: "E"
    status: "pending"
  - id: "phase-3"
    name: "Frontend Admin & Player"
    prevc: "E"
    status: "pending"
  - id: "phase-4"
    name: "Validation & Deploy"
    prevc: "V"
    status: "pending"
---

# 🎯 Sistema de Influenciadores e Comissionamento

> Implementar sistema completo de influenciadores com links de indicação, tracking de depósitos dos indicados e comissionamento baseado em regras configuráveis pelo admin

## Task Snapshot
- **Primary goal:** Permitir que o admin transforme usuários em influenciadores, cada um com link de indicação único, e visualizar comissões baseadas em depósitos acumulados dos indicados
- **Success signal:** 
  - Admin consegue alterar role de usuário para INFLUENCER
  - Influencer vê seu link de indicação no perfil
  - Admin vê tabela de influencers com indicações e comissões na página Associados
  - Regras de comissão configuráveis (valor mínimo + percentual)
- **Escopo:** Apenas visualização de comissões no admin (pagamento é feito manualmente por fora)

## Arquitetura da Feature

### Mudanças no Schema Prisma

```prisma
// 1. Alterar enum Role
enum Role {
  PLAYER
  INFLUENCER  // NOVO
  ADMIN
  SUPER_ADMIN
}

// 2. Adicionar campo referredBy no User (quem indicou)
model User {
  // ... campos existentes
  referralCode   String?   @unique @map("referral_code")  // Código único do influencer
  referredBy     String?   @map("referred_by")            // ID do influencer que indicou
  referrer       User?     @relation("Referrals", fields: [referredBy], references: [id])
  referrals      User[]    @relation("Referrals")         // Usuários indicados
}

// 3. Nova tabela de configuração de comissão
model CommissionConfig {
  id                String   @id @default(cuid())
  minDepositAmount  Decimal  @db.Decimal(18, 2) @map("min_deposit_amount")  // Ex: 100
  commissionPercent Decimal  @db.Decimal(5, 2) @map("commission_percent")   // Ex: 10.00 (10%)
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  @@map("commission_configs")
}

// 4. Tabela para tracking de comissões por indicado
model ReferralCommission {
  id              String   @id @default(cuid())
  influencerId    String   @map("influencer_id")       // O influencer
  referredUserId  String   @map("referred_user_id")    // O indicado
  totalDeposits   Decimal  @default(0) @db.Decimal(18, 2) @map("total_deposits")
  commissionEarned Decimal @default(0) @db.Decimal(18, 2) @map("commission_earned")
  commissionPaid  Decimal  @default(0) @db.Decimal(18, 2) @map("commission_paid")
  lastDepositAt   DateTime? @map("last_deposit_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  influencer      User     @relation("InfluencerCommissions", fields: [influencerId], references: [id])
  referredUser    User     @relation("ReferredCommissions", fields: [referredUserId], references: [id])
  
  @@unique([influencerId, referredUserId])
  @@map("referral_commissions")
}
```

### Fluxo de Dados

```
[Novo Usuário] --cadastro com ?ref=ABC123--> [User.referredBy = influencer.id]
                                                      |
                                                      v
[Depósito Confirmado] --deposit.service.ts--> [Atualiza ReferralCommission.totalDeposits]
                                                      |
                                                      v
[Se totalDeposits >= minDepositAmount] --> [Calcula commissionEarned = totalDeposits * commissionPercent]
```

## Fases de Implementação

---

### Phase 1 — Database & Schema (Architect)
**Status:** 🔲 Pendente

**Arquivos a criar/modificar:**
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `prisma/schema.prisma` | Modificar | Adicionar INFLUENCER no Role, campos referral no User, tabelas CommissionConfig e ReferralCommission |
| Migration | Criar | `pnpm db:push` ou migração formal |

**Steps:**
1. ✅ Alterar enum `Role` para incluir `INFLUENCER`
2. ✅ Adicionar campos `referralCode` e `referredBy` no model `User`
3. ✅ Adicionar relações self-referencing `referrer` e `referrals`
4. ✅ Criar model `CommissionConfig`
5. ✅ Criar model `ReferralCommission` com relações
6. ✅ Rodar `pnpm db:push`

---

### Phase 2 — Backend APIs (Feature Developer)
**Status:** 🔲 Pendente

**Arquivos a criar/modificar:**
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/utils/generate-referral-code.ts` | Criar | Gerar código de indicação único |
| `src/app/api/admin/commission/route.ts` | Criar | CRUD config de comissão |
| `src/app/api/admin/influencers/route.ts` | Criar | Listar influencers + stats |
| `src/app/api/admin/users/[id]/route.ts` | Modificar | Ao mudar role para INFLUENCER, gerar referralCode |
| `src/app/api/referral/register/route.ts` | Criar | Endpoint para cadastro via link de indicação |
| `src/services/deposit.service.ts` | Modificar | Ao confirmar depósito, atualizar ReferralCommission |
| `src/app/api/player/referral/route.ts` | Criar | Influencer consulta seu link e stats |

**Steps:**
1. ✅ Criar `generate-referral-code.ts` (gera códigos tipo ABC123)
2. ✅ Modificar PUT `/api/admin/users/[id]` para:
   - Remover opções ADMIN/SUPER_ADMIN do frontend
   - Ao mudar para INFLUENCER, gerar `referralCode` automaticamente
3. ✅ Criar `/api/admin/commission` (GET/PUT) para configuração
4. ✅ Criar `/api/admin/influencers` (GET) com agregação de dados
5. ✅ Modificar `deposit.service.ts` para atualizar comissões
6. ✅ Criar `/api/player/referral` para influencer ver seus dados

---

### Phase 3 — Frontend Admin & Player (Feature Developer)
**Status:** 🔲 Pendente

**Arquivos a criar/modificar:**
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/app/(dashboard)/associados/page.tsx` | Reescrever | Página completa de gestão de influencers |
| `src/app/(dashboard)/usuarios/components/edit-user-dialog.tsx` | Modificar | Dropdown com apenas PLAYER/INFLUENCER |
| `src/app/(bet)/afiliado/page.tsx` | Criar | Página do influencer com seu link e stats |
| `src/components/bet/bet-header.tsx` | Modificar | Link para /afiliado se role = INFLUENCER |

**Steps:**
1. ✅ Reescrever página `/associados`:
   - Cards no topo: config de comissão (valor mínimo + %)
   - Botão salvar configuração
   - Tabela de influencers com: nome, código, indicações, depósitos totais, comissão gerada
2. ✅ Modificar dialog de edição de usuário:
   - Dropdown de role só mostra PLAYER e INFLUENCER
3. ✅ Criar página `/afiliado` para o player:
   - Mostrar link de indicação para copiar
   - Mostrar quantos indicados
   - Mostrar valor total de depósitos dos indicados
   - Mostrar comissão acumulada
4. ✅ Ajustar registro para aceitar `?ref=CODIGO` na URL

---

### Phase 4 — Validation & Deploy (Code Reviewer)
**Status:** 🔲 Pendente

**Checklist de Validação:**
- [ ] Admin consegue configurar regra de comissão
- [ ] Admin consegue mudar usuário para INFLUENCER
- [ ] Influencer vê seu código de indicação
- [ ] Novo cadastro com `?ref=CODIGO` vincula ao influencer
- [ ] Depósito confirmado atualiza comissão do influencer
- [ ] Tabela de associados mostra dados corretos
- [ ] Deploy no Coolify funciona

---

## Arquivos Finais

```
prisma/
  schema.prisma                          # Modificado

src/
  lib/utils/
    generate-referral-code.ts            # Novo
  
  services/
    deposit.service.ts                   # Modificado
    commission.service.ts                # Novo (opcional)
  
  app/
    api/
      admin/
        commission/route.ts              # Novo
        influencers/route.ts             # Novo
        users/[id]/route.ts              # Modificado
      player/
        referral/route.ts                # Novo
    
    (dashboard)/
      associados/page.tsx                # Reescrito
      usuarios/page.tsx                  # Modificado (dropdown)
    
    (bet)/
      afiliado/page.tsx                  # Novo
```

## Decisões Técnicas

1. **Código de indicação:** 6 caracteres alfanuméricos (ex: `ABC123`)
2. **Cálculo de comissão:** Feito no momento do depósito confirmado
3. **Comissão acumulativa:** Depósitos do indicado somam até atingir o mínimo
4. **Sem sistema de pagamento:** Apenas visualização no admin
5. **Link de indicação:** `https://primebet.space/cadastro?ref=CODIGO`

## Evidence & Follow-up

- [ ] Schema migrado com sucesso
- [ ] APIs testadas via Postman/Thunder
- [ ] Fluxo completo testado em staging
- [ ] Deploy em produção
