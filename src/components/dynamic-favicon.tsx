"use client";

import { useEffect } from "react";
import { usePublicSettings } from "@/contexts/public-settings-context";

/**
 * Componente que atualiza dinamicamente o favicon baseado nas configurações públicas.
 * Deve ser incluído no layout principal para que o favicon seja atualizado em tempo real.
 */
export function DynamicFavicon() {
  const { settings } = usePublicSettings();
  const faviconUrl = settings?.experience?.media?.favicon?.url;

  useEffect(() => {
    // Função para atualizar ou criar um link de favicon
    const updateOrCreateLink = (rel: string, href: string) => {
      // Remover links existentes com esse rel
      const existingLinks = document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`);
      existingLinks.forEach(link => link.remove());

      // Criar novo link
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href + "?v=" + Date.now(); // Cache bust
      document.head.appendChild(link);
    };

    // URL do favicon (usar padrão se não houver configuração)
    const url = faviconUrl || "/favicon/favicon.ico";

    // Atualizar todos os tipos de favicon
    updateOrCreateLink("icon", url);
    updateOrCreateLink("shortcut icon", url);
    updateOrCreateLink("apple-touch-icon", url);

    // Também adicionar com type específico para imagens
    if (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg")) {
      const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (iconLink) {
        iconLink.type = url.endsWith(".png") ? "image/png" : "image/jpeg";
      }
    }
  }, [faviconUrl]);

  return null;
}
