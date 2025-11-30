PRD - Plataforma de Apostas & Investimentos (Bet & Recompensas)

Versão: 3.0

Data: 27 de Novembro de 2025

Status: Definição Arquitetural Finalizada

1. Visão Geral do Produto

Uma plataforma híbrida que combina uma Casa de Apostas Premium com um sistema de Rendimentos Automáticos (Fintech).

* Diferencial do Usuário: Todo depósito gera "Cashback Investido" instantâneo. O usuário joga, mas seu dinheiro também "trabalha" gerando rendimentos mensais (liquidez apenas dos juros).
* Diferencial do Dono (Admin): O admin não apenas gerencia a Bet, mas possui um Banking Completo (FBSPAY) integrado ao painel, permitindo gestão financeira real, conciliação e pagamentos sem sair do sistema.

2. Jornada e Funcionalidades do Usuário (Mobile First)

2.1. Acesso e Navegação (Guest Mode)

* Popup Inicial: Ao acessar o site, abre-se um popup de Login/Cadastro.
  * Botão Fechar (X): Permite navegar no modo "Visitante".
* Restrições de Visitante: Pode ver a lista de jogos, banners e o layout.
  * Tentativa de Jogar: Clicar em um jogo dispara o alerta: "Faça Login para Jogar".
  * Tentativa de Acessar Carteira/Perfil: Bloqueado com redirecionamento para Login.
* Menu Inferior Simplificado: 3 Itens Fixos.
  1. Games: Home com lobby, categorias e busca.
  2. Carteira: Área financeira unificada.
  3. Perfil: Dados pessoais e configurações.

2.2. A Carteira Unificada (UI Simplificada)

O usuário não vê "3 carteiras complexas", ele vê uma interface de banco digital.

* Depósito PIX: Gera o Split automático no backend (Crédito Jogo + Crédito Investimento).
* Visualização:
  * Saldo Total Investido: Soma de todos os depósitos ativos.
  * Previsão de Rendimento: "Até 3% ao mês" (contador ou gráfico diário).
  * Rendimentos Disponíveis: Valor líquido gerado pelos juros (único valor sacável mensalmente).
* Bloqueio de Principal: O saldo investido principal fica travado (lock de 12 meses), apenas os juros têm liquidez.

2.3. Experiência de Jogo

* Verificação de Saldo: Ao clicar no jogo (estando logado), o sistema checa o saldo.
  * Sem saldo: Alerta "Faça um depósito para começar".
  * Com saldo: Abre o iframe do jogo.

3. Funcionalidades do Administrador (Backoffice & Banking)

3.1. Hub de Integrações (Gateway)

Uma área dedicada para conectar provedores de pagamento.

* Multi-Gateway: Suporte a PixUp, Quack, BSPay, etc.
* Integração FBSPAY (Dinpayz):
  * Campos: API URL, Client ID, Client Secret.
  * Ação de Ativação: Ao validar as credenciais com sucesso, ativa o módulo "Banking" na sidebar.

3.2. Módulo Banking Embedado (White-Label)

Quando a integração FBSPAY está ativa, um novo item "FBSPAY" ou "Banco" aparece no menu lateral.

* Experiência Embedada: Ao clicar, exibe um spinner ("Redirecionando para ambiente seguro...") e carrega o painel da Dinpayz via iframe/embed seguro dentro do Admin da Bet.
* Funcionalidades do Painel Bancário:
  * Ver saldo real da operação (BRL na conta PJ).
  * Conciliação de entradas PIX.
  * Regras de Split (se houver taxas automáticas).
  * Transferência para contas externas (retirada de lucro da casa).

3.3. Editor Visual do Site (CMS)

Ferramenta No-Code para personalização da aparência da Bet.

* Live Preview: Editor lateral com visualização mobile em tempo real.
* Elementos Editáveis: Cores (Primary/Secondary), Logo, Banners (Carrossel), Textos de Boas-vindas.
* Publicação: Botão "Salvar e Publicar" que invalida o cache do Next.js (ISR) para atualização imediata.

3.4. Gestão Operacional da Bet

* Aprovação de Saques:
  * Lista de solicitações.
  * Botão "Aprovar": Chama a API do Gateway configurado (ex: FBSPAY) para enviar o PIX.
  * Botão "Rejeitar": Estorna o valor para a carteira de jogo do usuário.
* Gestão de Jogos: Ativar/Desativar jogos via API do Provider.

4. Regras de Negócio Críticas

1. Split de Entrada: * Depósito de R$ 100,00 → Entra R$ 100,00 no Saldo Jogo (Backend) E entra R$ 100,00 no Saldo Investido (Backend).
2. Educação Financeira: O usuário perdeu no jogo? O Saldo Investido continua lá (travado). O usuário ganhou? O Saldo Investido continua lá.
3. Restrição de Saque:
  * Capital Principal: Bloqueado (regra padrão: 12 meses).
  * Rendimentos (Juros): Desbloqueado mensalmente.
  * Ganhos de Jogo: Segue regra de Rollover da casa.

5. Arquitetura Técnica

* Frontend: Next.js 16 latest (App Router) + Tailwind CSS + ShadcnUI.
* Backend: Next.js Server Actions + API Routes.
* Banco de Dados: PostgreSQL + Prisma ORM.
* State Management: Zustand (para carrinho/sessão) + React Query (para dados server-side).
* Integrações Externas:
  * Jogos: API Provider (api.ultraself.space).
  * Pagamentos: API Gateway (Dinpayz/FBSPAY).

6. Roadmap de Desenvolvimento (Checklist)

Fase 1: Core & Identidade

* [ ] Configuração do Next.js e Banco de Dados (Prisma Schema).
* [ ] Sistema de Autenticação (Login/Cadastro/Guest Mode).
* [ ] Editor Visual Básico (Troca de Logo e Cores).

Fase 2: Integrações & Banking

* [ ] Integração com Game Provider (Listagem e Iframe).
* [ ] Hub de Integrações (Lógica de conectar Gateway).
* [ ] Desenvolvimento do Wrapper para o painel FBSPAY (Embed no Admin).

Fase 3: Lógica Financeira (Split)

* [ ] Webhooks de Depósito (Lógica do Split Duplo).
* [ ] Carteira Unificada (Frontend).
* [ ] Script de Cálculo de Rendimentos (Cron Job).

Fase 4: Refinamento & Launch

* [ ] Sistema de Aprovação de Saques.
* [ ] PWA (Manifest e Service Workers).
* [ ] Testes de Carga e Segurança.