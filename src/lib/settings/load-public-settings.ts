import { readFile } from "fs/promises";
import path from "path";

import { defaultExperience, defaultSettings } from "./defaults";
import type { PublicSettings } from "@/types/settings";

const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

const defaultPublicSettings: PublicSettings = {
  gameColumns: defaultSettings.general.gameColumns,
  siteName: defaultSettings.general.siteName,
  branding: {
    logoUrl: defaultSettings.branding.logoUrl,
    mobileBannerUrl: defaultSettings.branding.mobileBannerUrl,
  },
  experience: defaultExperience,
};

export async function loadPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await readFile(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(data);

    return {
      gameColumns: settings.general?.gameColumns || defaultPublicSettings.gameColumns,
      siteName: settings.general?.siteName || defaultPublicSettings.siteName,
      branding: {
        logoUrl: settings.branding?.logoUrl || defaultPublicSettings.branding.logoUrl,
        mobileBannerUrl: settings.branding?.mobileBannerUrl || defaultPublicSettings.branding.mobileBannerUrl,
      },
      experience: {
        identity: {
          ...defaultExperience.identity,
          ...settings.experience?.identity,
        },
        seo: {
          ...defaultExperience.seo,
          ...settings.experience?.seo,
        },
        theme: {
          ...defaultExperience.theme,
          ...settings.experience?.theme,
        },
        media: {
          ...defaultExperience.media,
          ...settings.experience?.media,
          loaderGifUrl: settings.experience?.media?.loaderGifUrl ?? defaultExperience.media.loaderGifUrl,
          banners: settings.experience?.media?.banners || defaultExperience.media.banners,
        },
        features: {
          ...defaultExperience.features,
          ...settings.experience?.features,
        },
        navigation: {
          bottomNav: settings.experience?.navigation?.bottomNav?.length
            ? settings.experience.navigation.bottomNav
            : defaultExperience.navigation.bottomNav,
        },
      },
    } satisfies PublicSettings;
  } catch {
    return defaultPublicSettings;
  }
}

export { defaultPublicSettings };
