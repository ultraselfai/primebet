export interface SocialLinks {
  instagram?: string;
  telegram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
}

// Central de Ajuda - cards com links e imagens
export interface HelpCenterSettings {
  whatsappLink: string;
  whatsappImageUrl: string;
  telegramLink: string;
  telegramImageUrl: string;
  emailSupport: string;
}

// Botões flutuantes - podem ser GIF/PNG/SVG
export interface FloatingButtonSettings {
  enabled: boolean;
  link: string;
  imageUrl: string;
}

export interface FloatingButtonsSettings {
  telegram: FloatingButtonSettings;
  whatsapp: FloatingButtonSettings;
}

export interface IdentitySettings {
  siteName: string;
  tagline: string;
  footerText: string;
  footerDescription: string;
  supportEmail: string;
  whatsapp: string;
  telegramButtonLink?: string; // @deprecated - usar floatingButtons
  socialLinks: SocialLinks;
  helpCenter: HelpCenterSettings;
  floatingButtons: FloatingButtonsSettings;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
}

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  customIconUrl?: string;
  customActiveIconUrl?: string;
  href: string;
  enabled: boolean;
  isMandatory: boolean;
  requiresAuth?: boolean;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  highlightIconColor?: string;
  favoriteIconColor?: string;
  loaderBackgroundColor: string;
  loaderSpinnerColor: string;
  navLabelColor?: string;
  navActiveLabelColor?: string;
  preset?: string;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  imageUrl: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  active: boolean;
  badge?: string;
}

export interface CustomIcons {
  trophyIconUrl?: string;
  highlightIconUrl?: string;
  favoriteIconUrl?: string;
  balanceCoinIconUrl?: string;
  categoryAllIconUrl?: string;
  categoryHotIconUrl?: string;
  categorySlotsIconUrl?: string;
  categoryCrashIconUrl?: string;
  categoryLiveIconUrl?: string;
  categoryFavoritesIconUrl?: string;
}

export interface MediaSettings {
  logo: {
    url: string;
    alt?: string;
  };
  favicon: {
    url: string;
  };
  banners: BannerItem[];
  loaderGifUrl?: string;
  icons?: CustomIcons;
}

export interface ExperienceSettings {
  identity: IdentitySettings;
  seo: SeoSettings;
  theme: ThemeSettings;
  media: MediaSettings;
  navigation: {
    bottomNav: BottomNavItem[];
  };
}

export interface BrandingSettings {
  logoUrl: string;
  mobileBannerUrl: string;
}

export interface FinancialPublicSettings {
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
}

export interface PublicSettings {
  gameColumns: number;
  siteName: string;
  branding: BrandingSettings;
  financial: FinancialPublicSettings;
  experience: ExperienceSettings;
}
