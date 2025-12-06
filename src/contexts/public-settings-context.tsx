"use client";

import React from "react";
import type { PublicSettings } from "@/types/settings";

interface PublicSettingsContextValue {
  settings: PublicSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateCache: (next: Partial<PublicSettings>) => void;
}

const PublicSettingsContext = React.createContext<PublicSettingsContextValue | undefined>(undefined);

async function fetchPublicSettings(): Promise<PublicSettings> {
  const response = await fetch("/api/settings/public", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Falha ao carregar configurações públicas");
  }
  return response.json();
}

interface PublicSettingsProviderProps {
  children: React.ReactNode;
  initialSettings?: PublicSettings | null;
}

export function PublicSettingsProvider({ children, initialSettings = null }: PublicSettingsProviderProps) {
  const [settings, setSettings] = React.useState<PublicSettings | null>(initialSettings);
  const [loading, setLoading] = React.useState(!initialSettings);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPublicSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar configurações públicas", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCache = React.useCallback((next: Partial<PublicSettings>) => {
    setSettings((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        ...next,
        financial: {
          ...prev.financial,
          ...next.financial,
        },
        experience: {
          ...prev.experience,
          ...next.experience,
          identity: {
            ...prev.experience.identity,
            ...next.experience?.identity,
          },
          seo: {
            ...prev.experience.seo,
            ...next.experience?.seo,
          },
          theme: {
            ...prev.experience.theme,
            ...next.experience?.theme,
          },
          media: {
            ...prev.experience.media,
            ...next.experience?.media,
            loaderGifUrl: next.experience?.media?.loaderGifUrl ?? prev.experience.media.loaderGifUrl,
            banners: next.experience?.media?.banners ?? prev.experience.media.banners,
          },
          navigation: {
            bottomNav: next.experience?.navigation?.bottomNav ?? prev.experience.navigation.bottomNav,
          },
        },
      };
    });
  }, []);

  React.useEffect(() => {
    if (!initialSettings) {
      refresh();
    }
  }, [initialSettings, refresh]);

  return (
    <PublicSettingsContext.Provider value={{ settings, loading, error, refresh, updateCache }}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const context = React.useContext(PublicSettingsContext);
  if (!context) {
    throw new Error("usePublicSettings deve ser usado dentro de PublicSettingsProvider");
  }
  return context;
}
