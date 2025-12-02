"use client";

import React from "react";
import { usePublicSettings } from "@/contexts/public-settings-context";
import { defaultExperience } from "@/lib/settings/defaults";

export function BetLoader() {
  const { settings } = usePublicSettings();
  const theme = settings?.experience.theme ?? defaultExperience.theme;
  const media = settings?.experience.media ?? defaultExperience.media;

  const backgroundColor = theme.loaderBackgroundColor || defaultExperience.theme.loaderBackgroundColor;
  const spinnerColor = theme.loaderSpinnerColor || defaultExperience.theme.loaderSpinnerColor;
  const loaderGifUrl = media.loaderGifUrl || defaultExperience.media.loaderGifUrl || "";

  const hasLoaderGif = Boolean(loaderGifUrl);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0,transparent_45%)]" />
      </div>

      <div className="relative flex flex-col items-center">
        {hasLoaderGif ? (
          <img
            src={loaderGifUrl}
            alt="Loader personalizado"
            className="h-32 w-32 object-contain"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
        ) : (
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 rounded-full border-4 border-white/20" />
            <div
              className="absolute inset-[6px] rounded-full border-4 border-transparent border-t-current animate-spin"
              style={{ color: spinnerColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
