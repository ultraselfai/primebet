import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { PublicSettingsProvider } from "@/contexts/public-settings-context";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "PlayInvest - Casa de Apostas & Investimentos",
  description: "Plataforma híbrida de apostas e investimentos com rendimentos automáticos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <SidebarConfigProvider>
              <PublicSettingsProvider>
                {children}
              </PublicSettingsProvider>
            </SidebarConfigProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
