export const defaultExperience = {
  identity: {
    siteName: "PlayInvest",
    tagline: "Aposte e Invista",
    footerText: "© 2024 PlayInvest. Todos os direitos reservados.",
    supportEmail: "suporte@playinvest.com",
    whatsapp: "5511999999999",
    socialLinks: {
      instagram: "https://instagram.com/playinvest",
      telegram: "https://t.me/playinvest",
      youtube: "",
    },
  },
  seo: {
    title: "PlayInvest - Apostas e Investimentos",
    description: "A melhor plataforma de apostas e investimentos do Brasil",
    keywords: "apostas, investimentos, jogos, cassino, slots",
  },
  theme: {
    primaryColor: "#00faff",
    secondaryColor: "#0a1628",
    accentColor: "#00ff88",
    preset: "cyan",
  },
  media: {
    logo: {
      url: "/logo-horizontal.png",
      alt: "Logotipo PlayInvest",
    },
    favicon: {
      url: "/favicon.ico",
    },
    banners: [
      {
        id: "hero",
        title: "Banner Principal",
        subtitle: "Aposte no futuro",
        ctaLabel: "Depositar agora",
        ctaLink: "/depositar",
        imageUrl: "/banners/banner-default.jpg",
        active: true,
      },
    ],
  },
  features: {
    showChat: true,
    showSupport: true,
    showPromoBar: true,
    enableInvestments: true,
    maintenanceMode: false,
  },
};

export const defaultSettings = {
  general: {
    siteName: "PlayInvest",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    language: "pt-BR",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    requireKYC: false,
    minAge: 18,
    gameColumns: 3,
  },
  branding: {
    logoUrl: "/logo-horizontal.png",
    mobileBannerUrl: "",
  },
  experience: defaultExperience,
};
