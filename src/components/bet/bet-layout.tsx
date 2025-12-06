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
  const currentPathname = usePathname();
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
  
  // Nova estrutura de botões flutuantes
  const floatingButtons = publicSettings?.experience?.identity?.floatingButtons;
  const telegramFloating = floatingButtons?.telegram;
  const whatsappFloating = floatingButtons?.whatsapp;
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _currentPath = currentPathname; // Keep for future use

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
    return navItems.map((item, index) => {
      const isCenterItem = index === centerIndex;
      return {
        id: item.id,
        label: item.label,
        href: item.href,
        // Ícone normal
        icon: item.customIconUrl ? (
          <img 
            src={item.customIconUrl} 
            alt={item.label} 
            className="h-6 w-6 object-contain"
          />
        ) : (
          React.createElement(getNavIconComponent(item.icon), { className: "h-6 w-6" })
        ),
        // Ícone quando selecionado/ativo
        activeIcon: item.customActiveIconUrl ? (
          <img 
            src={item.customActiveIconUrl} 
            alt={item.label} 
            className="h-6 w-6 object-contain"
          />
        ) : item.customIconUrl ? (
          <img 
            src={item.customIconUrl} 
            alt={item.label} 
            className="h-6 w-6 object-contain"
          />
        ) : (
          React.createElement(getNavIconComponent(item.icon), { className: "h-6 w-6" })
        ),
        // Ícone grande (para o botão central)
        iconLarge: isCenterItem && item.customIconUrl ? (
          <img 
            src={item.customIconUrl} 
            alt={item.label} 
            className="h-9 w-9 object-contain"
          />
        ) : undefined,
        // Ícone grande quando selecionado (para o botão central)
        activeIconLarge: isCenterItem && (item.customActiveIconUrl || item.customIconUrl) ? (
          <img 
            src={item.customActiveIconUrl || item.customIconUrl} 
            alt={item.label} 
            className="h-9 w-9 object-contain"
          />
        ) : undefined,
        onClick: (e) => handleNavClick(e, item),
      };
    });
  }, [navItems, isAuthenticated, centerIndex]); // Re-create if auth state changes to ensure closures are correct if needed, though handleNavClick uses current scope.

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
        {/* Botões Flutuantes - Nova estrutura */}
        <div className="fixed bottom-28 right-4 z-40 flex flex-col gap-3">
          {/* Botão Telegram Flutuante */}
          {telegramFloating?.enabled && telegramFloating?.link && (
            <a
              href={telegramFloating.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 shadow-lg backdrop-blur transition-transform hover:scale-110"
              style={{ boxShadow: "0 20px 45px rgba(3,7,18,0.45)" }}
            >
              {telegramFloating.imageUrl ? (
                <img
                  src={telegramFloating.imageUrl}
                  alt="Telegram"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Send className="h-6 w-6 text-blue-400" />
              )}
            </a>
          )}
          
          {/* Botão WhatsApp Flutuante */}
          {whatsappFloating?.enabled && whatsappFloating?.link && (
            <a
              href={whatsappFloating.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 shadow-lg backdrop-blur transition-transform hover:scale-110"
              style={{ boxShadow: "0 20px 45px rgba(3,7,18,0.45)" }}
            >
              {whatsappFloating.imageUrl ? (
                <img
                  src={whatsappFloating.imageUrl}
                  alt="WhatsApp"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Send className="h-6 w-6 text-emerald-400" />
              )}
            </a>
          )}
        </div>
        
        {children}

        {/* Footer */}
        <footer className="mt-auto px-4 pb-10 pt-8">
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Links de Navegação */}
            <div className="grid grid-cols-3 gap-6 text-center">
              {/* Cassino */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Cassino</h4>
                <nav className="flex flex-col gap-2">
                  <Link href="/convidar" className="text-xs text-white/60 hover:text-white transition">Convidar</Link>
                  <Link href="/eventos" className="text-xs text-white/60 hover:text-white transition">Eventos</Link>
                  <Link href="/vip" className="text-xs text-white/60 hover:text-white transition">VIP</Link>
                  <Link href="/afiliado" className="text-xs text-white/60 hover:text-white transition">Afiliado</Link>
                </nav>
              </div>

              {/* Jogos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Jogos</h4>
                <nav className="flex flex-col gap-2">
                  <Link href="/?categoria=all" className="text-xs text-white/60 hover:text-white transition">Todos</Link>
                  <Link href="/?categoria=hot" className="text-xs text-white/60 hover:text-white transition">Em Alta</Link>
                  <Link href="/?categoria=slots" className="text-xs text-white/60 hover:text-white transition">Slots</Link>
                  <Link href="/?categoria=crash" className="text-xs text-white/60 hover:text-white transition">Crash</Link>
                  <Link href="/?categoria=live" className="text-xs text-white/60 hover:text-white transition">Ao Vivo</Link>
                </nav>
              </div>

              {/* Suporte */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Suporte</h4>
                <nav className="flex flex-col gap-2">
                  <Link href="/suporte" className="text-xs text-white/60 hover:text-white transition">Suporte Online</Link>
                  <Link href="/ajuda" className="text-xs text-white/60 hover:text-white transition">Central de Ajuda</Link>
                  <Link href="/termos" className="text-xs text-white/60 hover:text-white transition">Termos de Uso</Link>
                  <Link href="/privacidade" className="text-xs text-white/60 hover:text-white transition">Privacidade</Link>
                </nav>
              </div>
            </div>

            {/* Descrição / Legislação */}
            {publicSettings?.experience?.identity?.footerDescription && (
              <p className="text-center text-xs leading-relaxed text-white/50">
                {publicSettings.experience.identity.footerDescription}
              </p>
            )}

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
        <CasinoNavBar 
          items={menuItems} 
          labelColor={theme?.navLabelColor}
          activeLabelColor={theme?.navActiveLabelColor}
        />
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
