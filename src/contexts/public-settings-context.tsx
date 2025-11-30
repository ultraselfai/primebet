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

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
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
            banners: next.experience?.media?.banners ?? prev.experience.media.banners,
          },
          features: {
            ...prev.experience.features,
            ...next.experience?.features,
          },
        },
      };
    });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

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
