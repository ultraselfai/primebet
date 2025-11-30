flowchart TD

    %% Ponto de Partida

    Start(("🔑 Login Admin")) --> Dash[("📊 Dashboard Principal")]



    %% Navegação Principal (Sidebar)

    Dash ==> MenuFin["💸 Operacional Bet"]

    Dash ==> MenuGames["🎮 Jogos & Provider"]

    Dash ==> MenuUsers["👥 Gestão Usuários"]

    Dash ==> MenuInteg["🔌 Integrações (Hub)"]

    

    %% O Módulo Especial FBSPAY (Só aparece se integrado)

    Dash -.->|Se Ativado| MenuFBSPAY["🏦 FBSPAY (Banking)"]



    %% 1. Fluxo de Integração do Gateway (Configuração)

    subgraph Integrations ["Hub de Integrações"]

        MenuInteg --> SelectType{"Tipo de Integração"}

        SelectType -- Gateway --> ListGateways["Lista: PixUp, Quack, FBSPAY..."]

        

        ListGateways --> ChooseFBS["Selecionar FBSPAY (Dinpayz)"]

        ChooseFBS --> InputKeys["📝 Inserir: API URL + Token + Client Secret"]

        InputKeys --> Validate["Testar Conexão"]

        

        Validate -- Sucesso --> EnableModule["✅ Ativar Item na Sidebar"]

        EnableModule --> ShowMenuFBSPAY["Exibir 'FBSPAY' no Menu"]

    end



    %% 2. O Módulo Bancário Embedado (White Label)

    subgraph BankingModule ["Módulo Bancário FBSPAY (Embedado)"]

        MenuFBSPAY --> Spinner["🔄 Spinner: 'Redirecionando para Ambiente Seguro...'"]

        Spinner --> EmbeddedFrame["🖥️ Painel Financeiro (Iframe/Embed)"]

        

        EmbeddedFrame --> ViewSaldoReal["💰 Ver Saldo Real (Conta Bancária)"]

        EmbeddedFrame --> Conciliacao["📑 Conciliação de Entradas"]

        EmbeddedFrame --> SplitRules["⚡ Configurar Regras de Split"]

        EmbeddedFrame --> WithdrawBank["🏦 Transferir para Conta Externa"]

    end



    %% 3. Operacional do Dia a Dia (Na Bet)

    subgraph FinanceOps ["Operacional da Bet (Fila de Solicitações)"]

        MenuFin --> DepList["📥 Histórico de Depósitos"]

        MenuFin --> WithdrawQueue["📤 Fila de Saques (Jogadores)"]

        

        WithdrawQueue --> DecisaoSaque{"Aprovar Saque?"}

        DecisaoSaque -- "Aprovar" --> CallFBSPAY["🚀 API FBSPAY: Pagar PIX"]

        CallFBSPAY --> LogFin["📜 Log na Bet"]

        LogFin -.->|Debita| ViewSaldoReal

    end



    %% 4. Outros Módulos

    subgraph OtherOps ["Outros Módulos"]

        MenuGames --> ConfigProvider["Configurar Jogos"]

        MenuUsers --> UserActions["Gerenciar Jogadores"]

    end



    %% Estilização

    linkStyle default stroke:#94a3b8,stroke-width:2px;

    

    classDef dashboard fill:#4f46e5,stroke:#312e81,color:white,stroke-width:2px;

    classDef banking fill:#0ea5e9,stroke:#0369a1,color:white,stroke-width:2px,stroke-dasharray: 0;

    classDef integ fill:#f59e0b,stroke:#b45309,color:white,stroke-width:2px;

    classDef ops fill:#64748b,stroke:#334155,color:white,stroke-width:2px;



    class Dash,MenuFBSPAY dashboard;

    class Spinner,EmbeddedFrame,ViewSaldoReal,Conciliacao,SplitRules,WithdrawBank banking;

    class MenuInteg,SelectType,ListGateways,ChooseFBS,InputKeys,Validate,EnableModule integ;

    class MenuFin,DepList,WithdrawQueue,CallFBSPAY,DecisaoSaque ops;

