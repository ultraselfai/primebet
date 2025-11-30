flowchart TD
    %% 1. Acesso e Autenticação
    Start(("Acesso ao Site")) --> Popup{"Popup Login/Cadastro"}
    
    Popup -- "Fechar (X)" --> HomeGuest["🏠 Home (Visitante)"]
    Popup -- Cadastro --> RedirectLogin["Redireciona p/ Login"] --> Popup
    Popup -- "Login Sucesso" --> HomeUser["🏠 Home (Logado)"]

    %% 2. Navegação Visitante (Restrições)
    HomeGuest -->|"Menu: Games"| ViewGames["Ver Cards de Jogos"]
    ViewGames -->|"Clicar no Jogo"| AlertLogin["🔔 Alerta: 'Faça Login para Jogar'"]
    AlertLogin -.-> Popup
    
    HomeGuest -->|"Menu: Carteira/Perfil"| BlockAccess["🚫 Bloqueado: Exige Login"]

    %% 3. Navegação Usuário Logado (Menu Inferior: Games | Carteira | Perfil)
    HomeUser -->|"Aba Games"| UserGames["🎰 Lista de Jogos"]
    HomeUser -->|"Aba Carteira"| UserWallet["💰 Carteira & Investimentos"]
    HomeUser -->|"Aba Perfil"| UserProfile["👤 Gerenciar Perfil"]

    %% 4. Fluxo de Jogo (Logado)
    UserGames -->|"Clicar no Jogo"| CheckBalance{"Tem Saldo?"}
    
    CheckBalance -- Não --> AlertDeposit["🔔 Alerta: 'Faça um Depósito para Jogar'"]
    AlertDeposit --> UserWallet
    CheckBalance -- Sim --> Play["🎮 Abrir Jogo (Iframe)"]

    %% 5. Fluxo da Carteira (Investimento Simplificado)
    UserWallet -->|Visualizar| DashboardInv["👁️ UI: Total Investido + Previsão 3%"]
    UserWallet -->|Ação| ActionDeposit["Depositar PIX"]
    UserWallet -->|Ação| ActionWithdraw["Sacar Juros"]

    ActionDeposit -->|Entrada| WalletUnified[("Carteira Unificada")]
    WalletUnified -->|"Update Diário"| YieldDisplay{"Exibir Rendimento Diário"}
    
    ActionWithdraw --> CheckRule{"Regra de Saque"}
    CheckRule -- "Capital Principal" --> Lock["🔒 Bloqueado"]
    CheckRule -- Rendimentos --> CashOut["✅ Saque Permitido (Mensal)"]

    %% Estilização
    linkStyle default stroke:#64748b,stroke-width:2px;
    
    classDef auth fill:#fcd34d,stroke:#b45309,color:black,stroke-width:2px;
    classDef guest fill:#e2e8f0,stroke:#64748b,color:black,stroke-dasharray: 5 5;
    classDef user fill:#3b82f6,stroke:#1d4ed8,color:white,stroke-width:2px;
    classDef wallet fill:#10b981,stroke:#047857,color:white,stroke-width:2px;
    classDef alert fill:#ef4444,stroke:#b91c1c,color:white,stroke-width:2px;

    class Popup,RedirectLogin auth;
    class HomeGuest,ViewGames guest;
    class HomeUser,UserGames,UserProfile,Play user;
    class UserWallet,DashboardInv,WalletUnified,ActionDeposit,CashOut wallet;
    class AlertLogin,BlockAccess,AlertDeposit,Lock alert;
