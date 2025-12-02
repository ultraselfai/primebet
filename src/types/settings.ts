export interface SocialLinks {
  instagram?: string;
  telegram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
}

export interface IdentitySettings {
  siteName: string;
  tagline: string;
  footerText: string;
  footerDescription: string;
  supportEmail: string;
  whatsapp: string;
  telegramButtonLink?: string;
  socialLinks: SocialLinks;
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
  telegramButtonImageUrl?: string;
}

export interface FeatureToggles {
  showTelegramButton: boolean;
  showSupport: boolean;
  showPromoBar: boolean;
  enableInvestments: boolean;
  maintenanceMode: boolean;
}

export interface ExperienceSettings {
  identity: IdentitySettings;
  seo: SeoSettings;
  theme: ThemeSettings;
  media: MediaSettings;
  features: FeatureToggles;
  navigation: {
    bottomNav: BottomNavItem[];
  };
}

export interface BrandingSettings {
  logoUrl: string;
  mobileBannerUrl: string;
}

export interface PublicSettings {
  gameColumns: number;
  siteName: string;
  branding: BrandingSettings;
  experience: ExperienceSettings;
}
