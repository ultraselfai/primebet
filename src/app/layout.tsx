import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { PublicSettingsProvider } from "@/contexts/public-settings-context";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { inter } from "@/lib/fonts";
import { loadPublicSettings } from "@/lib/settings/load-public-settings";

export const metadata: Metadata = {
  title: "PlayInvest - Casa de Apostas & Investimentos",
  description: "Plataforma híbrida de apostas e investimentos com rendimentos automáticos",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicSettings = await loadPublicSettings();
  const loaderGifUrl = publicSettings.experience.media.loaderGifUrl;

  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <head>
        {loaderGifUrl ? <link rel="preload" as="image" href={loaderGifUrl} /> : null}
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <SidebarConfigProvider>
              <PublicSettingsProvider initialSettings={publicSettings}>
                <DynamicFavicon />
                {children}
              </PublicSettingsProvider>
            </SidebarConfigProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
