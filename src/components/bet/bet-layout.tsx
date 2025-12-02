"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Gamepad2,
  Wallet2,
  UserRound,
  Instagram,
  Send,
  Youtube,
  Twitter,
  Users,
  Sparkles,
  Gift,
  Coins,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { AuthModal } from "./auth-modal";
import { BetHeader } from "./bet-header";
import { usePublicSettings } from "@/contexts/public-settings-context";
import { BetLoader } from "./bet-loader";
import { defaultExperience } from "@/lib/settings/defaults";
import type { BottomNavItem } from "@/types/settings";
import { CasinoNavBar, type MenuItem } from "./casino-nav-bar";

interface BetLayoutProps {
  children: React.ReactNode;
}

const NAV_ICON_COMPONENTS: Record<string, LucideIcon> = {
  gamepad: Gamepad2,
  wallet: Wallet2,
  user: UserRound,
  users: Users,
  sparkles: Sparkles,
  gift: Gift,
  coins: Coins,
  ticket: Ticket,
  send: Send,
};

const getNavIconComponent = (icon: string): LucideIcon => {
  return NAV_ICON_COMPONENTS[icon] ?? Gamepad2;
};

const getNavItems = (items?: BottomNavItem[]): BottomNavItem[] => {
  const fallback = defaultExperience.navigation.bottomNav;
  const source = items && items.length ? items : fallback;
  const visible = source.filter((item) => item.isMandatory || item.enabled);
  if (!visible.length) {
    return fallback;
  }
  return visible.map((item) => ({
    ...item,
    enabled: item.isMandatory ? true : item.enabled,
  }));
};

export function BetLayout({ children }: BetLayoutProps) {
  const pathname = usePathname();
  const { 
    isAuthenticated, 
    openAuthModal, 
    showToast,
    isAuthModalOpen,
    closeAuthModal,
    authModalTab
  } = useBetAuth();
  const { settings: publicSettings, loading: publicSettingsLoading } = usePublicSettings();
  const [isGameFullscreen, setIsGameFullscreen] = React.useState(false);
  const [showEntryLoader, setShowEntryLoader] = React.useState(true);
  const loaderDismissedRef = React.useRef(false);
  const theme = publicSettings?.experience.theme;
  const secondaryColor = theme?.secondaryColor ?? "#050f1f";
  const accentColor = theme?.accentColor ?? "#42e8ff";
  const telegramButtonEnabled = Boolean(publicSettings?.experience.features.showTelegramButton);
  const telegramButtonLink = publicSettings?.experience.identity.telegramButtonLink;
  const telegramButtonImage = publicSettings?.experience.media.telegramButtonImageUrl;
  const layoutStyle = React.useMemo(() => ({
    "--bet-primary": theme?.primaryColor ?? "#00faff",
    "--bet-secondary": secondaryColor,
    "--bet-accent": accentColor,
  }) as React.CSSProperties, [theme, secondaryColor, accentColor]);
  const navItems = React.useMemo(
    () => getNavItems(publicSettings?.experience?.navigation?.bottomNav),
    [publicSettings?.experience?.navigation?.bottomNav],
  );
  const centerIndex = Math.floor(navItems.length / 2);
  const centerNavItem = navItems[centerIndex];
  const leftNavItems = navItems.slice(0, centerIndex);
  const rightNavItems = navItems.slice(centerIndex + 1);

  React.useEffect(() => {
    const updateFullscreen = () => {
      if (typeof document === "undefined") return;
      setIsGameFullscreen(document.body.classList.contains("bet-game-fullscreen"));
    };

    updateFullscreen();
    const handler = () => updateFullscreen();
    window.addEventListener("bet-game-fullscreen-changed", handler);
    return () => window.removeEventListener("bet-game-fullscreen-changed", handler);
  }, []);

  React.useEffect(() => {
    if (loaderDismissedRef.current) return;
    if (publicSettingsLoading) return;
    if (typeof window === "undefined") {
      loaderDismissedRef.current = true;
      setShowEntryLoader(false);
      return;
    }

    let readyDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const releaseLoader = () => {
      if (loaderDismissedRef.current) return;
      loaderDismissedRef.current = true;
      setShowEntryLoader(false);
    };

    const handleWindowLoad = () => {
      if (readyDelayTimer) clearTimeout(readyDelayTimer);
      readyDelayTimer = setTimeout(releaseLoader, 300);
    };

    if (document.readyState === "complete") {
      handleWindowLoad();
    } else {
      window.addEventListener("load", handleWindowLoad, { once: true } as AddEventListenerOptions);
    }

    fallbackTimer = setTimeout(releaseLoader, 6000);

    return () => {
      window.removeEventListener("load", handleWindowLoad);
      if (readyDelayTimer) clearTimeout(readyDelayTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [publicSettingsLoading]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (showEntryLoader) {
      const originalOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [showEntryLoader]);

  const handleNavClick = (e: React.MouseEvent, item: BottomNavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      showToast("Faça login para acessar", "info");
      openAuthModal("login");
    }
  };

  const menuItems: MenuItem[] = React.useMemo(() => {
    return navItems.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: React.createElement(getNavIconComponent(item.icon), { className: "h-6 w-6" }),
      onClick: (e) => handleNavClick(e, item),
    }));
  }, [navItems, isAuthenticated]); // Re-create if auth state changes to ensure closures are correct if needed, though handleNavClick uses current scope.

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ backgroundColor: "var(--bet-secondary)", ...layoutStyle }}
    >
      {showEntryLoader && (
        <div className="fixed inset-0 z-[9999]">
          <BetLoader />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-x-[-25%] top-[-35%] h-[55vh] rounded-full blur-[140px] opacity-60"
          style={{ backgroundColor: "var(--bet-primary)" }}
        />
        <div
          className="absolute inset-x-[-20%] top-0 h-[25vh]"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)",
          }}
        />
      </div>

      {!isGameFullscreen && <BetHeader />}
      {/* Main Content */}
      <main className="relative z-10 flex min-h-screen flex-col pb-28 pt-[3.5rem]">
        {telegramButtonEnabled && telegramButtonLink && (
          <a
            href={telegramButtonLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-28 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 shadow-lg backdrop-blur"
            style={{
              boxShadow: "0 20px 45px rgba(3,7,18,0.45)",
            }}
          >
            {telegramButtonImage ? (
              <img
                src={telegramButtonImage}
                alt="Atendimento Telegram"
                className="h-full w-full object-contain"
              />
            ) : (
              <Send className="h-6 w-6 text-white" />
            )}
          </a>
        )}
        {children}

        {/* Footer */}
        <footer className="mt-auto px-4 pb-32 pt-8">
          <div className="mx-auto max-w-lg space-y-6">
            {/* Redes sociais */}
            {publicSettings?.experience?.identity?.socialLinks && (
              <div className="flex justify-center gap-4">
                {publicSettings.experience.identity.socialLinks.instagram && (
                  <a 
                    href={publicSettings.experience.identity.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {publicSettings.experience.identity.socialLinks.telegram && (
                  <a 
                    href={publicSettings.experience.identity.socialLinks.telegram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    <Send className="h-5 w-5" />
                  </a>
                )}
                {publicSettings.experience.identity.socialLinks.youtube && (
                  <a 
                    href={publicSettings.experience.identity.socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
                {publicSettings.experience.identity.socialLinks.twitter && (
                  <a 
                    href={publicSettings.experience.identity.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            {/* Descrição / Legislação */}
            {publicSettings?.experience?.identity?.footerDescription && (
              <p className="text-center text-xs leading-relaxed text-white/50">
                {publicSettings.experience.identity.footerDescription}
              </p>
            )}

            {/* Copyright */}
            {publicSettings?.experience?.identity?.footerText && (
              <p className="text-center text-xs text-white/40">
                {publicSettings.experience.identity.footerText}
              </p>
            )}
          </div>
        </footer>
      </main>

      {/* Bottom Navigation */}
      {!isGameFullscreen && navItems.length > 0 && (
        <CasinoNavBar items={menuItems} />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal}
        defaultTab={authModalTab}
      />
    </div>
  );
}
