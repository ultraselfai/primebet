"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gamepad2, Wallet2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { AuthModal } from "./auth-modal";
import { BetHeader } from "./bet-header";
import { usePublicSettings } from "@/contexts/public-settings-context";

interface BetLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", icon: Gamepad2, label: "Games", protected: false },
  { href: "/carteira", icon: Wallet2, label: "Carteira", protected: true },
  { href: "/perfil", icon: UserRound, label: "Perfil", protected: true },
];

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
  const { settings: publicSettings } = usePublicSettings();
  const [isGameFullscreen, setIsGameFullscreen] = React.useState(false);
  const theme = publicSettings?.experience.theme;
  const layoutStyle = React.useMemo<React.CSSProperties>(() => ({
    "--bet-primary": theme?.primaryColor ?? "#00faff",
    "--bet-secondary": theme?.secondaryColor ?? "#050f1f",
    "--bet-accent": theme?.accentColor ?? "#42e8ff",
  }), [theme]);

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

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.protected && !isAuthenticated) {
      e.preventDefault();
      showToast("Faça login para acessar", "info");
      openAuthModal("login");
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ backgroundColor: "var(--bet-secondary)", ...layoutStyle }}
    >
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
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isGameFullscreen && (
        <nav className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-[280px] items-center justify-between gap-1 rounded-[22px] border border-white/10 bg-[rgba(3,16,36,0.9)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 shadow-[0_22px_40px_rgba(3,7,18,0.7)] backdrop-blur-[22px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={cn(
                  "group flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1.5 text-center transition-colors",
                  isActive ? "text-white" : "text-white/70",
                  "hover:text-white"
                )}
                style={isActive ? { color: "var(--bet-accent)" } : undefined}
              >
                <item.icon
                  strokeWidth={isActive ? 2.8 : 2.2}
                  className="h-[18px] w-[18px] text-current transition-colors duration-200"
                  style={isActive ? { color: "var(--bet-accent)" } : undefined}
                />
                <span
                  className={cn(
                    "text-[9.5px] tracking-tight text-current transition-[color,font-weight] duration-200",
                    isActive ? "font-bold" : "font-semibold"
                  )}
                  style={isActive ? { color: "var(--bet-accent)" } : undefined}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          </div>
        </nav>
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
