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
  const response = await fetch("/api/settings/public", { 
    cache: "no-store",
    // Adiciona timestamp para evitar cache do browser
    headers: {
      "Cache-Control": "no-cache",
    },
  });
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
  const [hasHydrated, setHasHydrated] = React.useState(false);

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
    // Sempre busca do servidor após hidratação para garantir dados atualizados
    // Isso resolve o problema de cache stale do Next.js server-side
    if (!hasHydrated) {
      setHasHydrated(true);
      // Se temos initialSettings, fazemos refresh silencioso em background
      // Se não temos, fazemos refresh com loading state
      if (initialSettings) {
        // Refresh silencioso - não mostra loading, apenas atualiza se houver diferença
        fetchPublicSettings()
          .then((data) => {
            setSettings(data);
          })
          .catch((err) => {
            console.warn("[PublicSettings] Falha ao revalidar settings:", err);
            // Mantém initialSettings em caso de erro
          });
      } else {
        refresh();
      }
    }
  }, [hasHydrated, initialSettings, refresh]);

  // Revalida settings quando a janela volta ao foco
  // Isso garante que após pagar PIX (que pode abrir app do banco), as settings estejam atualizadas
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasHydrated) {
        fetchPublicSettings()
          .then((data) => {
            setSettings(data);
          })
          .catch((err) => {
            console.warn("[PublicSettings] Falha ao revalidar no focus:", err);
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasHydrated]);

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
