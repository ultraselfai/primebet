import { prisma } from "@/lib/prisma";

import { defaultExperience, defaultSettings } from "./defaults";
import type { PublicSettings } from "@/types/settings";

const defaultPublicSettings: PublicSettings = {
  gameColumns: defaultSettings.general.gameColumns,
  siteName: defaultSettings.general.siteName,
  branding: {
    logoUrl: defaultSettings.branding.logoUrl,
    mobileBannerUrl: defaultSettings.branding.mobileBannerUrl,
  },
  financial: {
    minDeposit: defaultSettings.financial.minDeposit,
    maxDeposit: defaultSettings.financial.maxDeposit,
    minWithdrawal: defaultSettings.financial.minWithdrawal,
    maxWithdrawal: defaultSettings.financial.maxWithdrawal,
  },
  experience: defaultExperience,
};

export async function loadPublicSettings(): Promise<PublicSettings> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      return defaultPublicSettings;
    }

    const settings = record.data as Record<string, unknown>;
    const financialSettings = settings.financial as Record<string, unknown> | undefined;

    return {
      gameColumns: (settings.general as Record<string, unknown>)?.gameColumns as number || defaultPublicSettings.gameColumns,
      siteName: (settings.general as Record<string, unknown>)?.siteName as string || defaultPublicSettings.siteName,
      branding: {
        logoUrl: (settings.branding as Record<string, unknown>)?.logoUrl as string || defaultPublicSettings.branding.logoUrl,
        mobileBannerUrl: (settings.branding as Record<string, unknown>)?.mobileBannerUrl as string || defaultPublicSettings.branding.mobileBannerUrl,
      },
      financial: {
        minDeposit: (financialSettings?.minDeposit as number) ?? defaultPublicSettings.financial.minDeposit,
        maxDeposit: (financialSettings?.maxDeposit as number) ?? defaultPublicSettings.financial.maxDeposit,
        minWithdrawal: (financialSettings?.minWithdrawal as number) ?? defaultPublicSettings.financial.minWithdrawal,
        maxWithdrawal: (financialSettings?.maxWithdrawal as number) ?? defaultPublicSettings.financial.maxWithdrawal,
      },
      experience: {
        identity: {
          ...defaultExperience.identity,
          ...((settings.experience as Record<string, unknown>)?.identity as Record<string, unknown>),
        },
        seo: {
          ...defaultExperience.seo,
          ...((settings.experience as Record<string, unknown>)?.seo as Record<string, unknown>),
        },
        theme: {
          ...defaultExperience.theme,
          ...((settings.experience as Record<string, unknown>)?.theme as Record<string, unknown>),
        },
        media: {
          ...defaultExperience.media,
          ...((settings.experience as Record<string, unknown>)?.media as Record<string, unknown>),
          loaderGifUrl: ((settings.experience as Record<string, unknown>)?.media as Record<string, unknown>)?.loaderGifUrl as string ?? defaultExperience.media.loaderGifUrl,
          banners: ((settings.experience as Record<string, unknown>)?.media as Record<string, unknown>)?.banners as typeof defaultExperience.media.banners || defaultExperience.media.banners,
        },
        navigation: {
          bottomNav: (((settings.experience as Record<string, unknown>)?.navigation as Record<string, unknown>)?.bottomNav as typeof defaultExperience.navigation.bottomNav)?.length
            ? ((settings.experience as Record<string, unknown>)?.navigation as Record<string, unknown>)?.bottomNav as typeof defaultExperience.navigation.bottomNav
            : defaultExperience.navigation.bottomNav,
        },
      },
    } satisfies PublicSettings;
  } catch (error) {
    console.error("[loadPublicSettings] Erro ao carregar:", error);
    return defaultPublicSettings;
  }
}

export { defaultPublicSettings };
