import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { defaultExperience, defaultSettings } from "@/lib/settings/defaults";

// Arquivo de configurações
const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

// Configurações padrão para exibição pública
const defaultPublicSettings = {
  gameColumns: defaultSettings.general.gameColumns,
  siteName: defaultSettings.general.siteName,
  branding: {
    logoUrl: defaultSettings.branding.logoUrl,
    mobileBannerUrl: defaultSettings.branding.mobileBannerUrl,
  },
  experience: defaultExperience,
};

// GET - Buscar configurações públicas (para a home da bet)
export async function GET() {
  try {
    const data = await readFile(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(data);
    
    // Retorna apenas as configurações públicas necessárias
    return NextResponse.json({
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
          banners: settings.experience?.media?.banners || defaultExperience.media.banners,
        },
        features: {
          ...defaultExperience.features,
          ...settings.experience?.features,
        },
      },
    });
  } catch {
    // Se o arquivo não existe, retorna configurações padrão
    return NextResponse.json(defaultPublicSettings);
  }
}
