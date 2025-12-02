"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarButton } from "@/components/ui/star-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { usePublicSettings } from "@/contexts/public-settings-context";

export function BetHeader() {
  const {
    isAuthenticated,
    isLoading,
    user,
    openAuthModal,
    balance,
    balanceLoading,
    isImpersonating,
  } = useBetAuth();
  const { settings: publicSettings } = usePublicSettings();
  const logoUrl = publicSettings?.experience.media.logo.url || publicSettings?.branding.logoUrl || "/logo-horizontal.png";
  const theme = publicSettings?.experience.theme;
  const primaryColor = theme?.primaryColor ?? "#00faff";
  const secondaryColor = theme?.secondaryColor ?? "#050f1f";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Pegar iniciais do nome
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl"
      style={{ backgroundColor: secondaryColor, borderBottom: `1px solid ${primaryColor}22` }}
    >
      {/* Banner de impersonação */}
      {isImpersonating && (
        <div className="bg-yellow-500/90 text-yellow-900 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>Você está visualizando como: {user?.name || user?.email}</span>
          <Link href="/api/admin/users/exit-impersonation" className="underline hover:no-underline ml-2">
            Sair
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={logoUrl || "/logo-horizontal.png"}
            alt="PlayInvest"
            width={168}
            height={38}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            // Loading state
            <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse" />
          ) : isAuthenticated ? (
            // Logado - mostra saldo e perfil
            <>
              <div className="flex h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-[#0d1f3c] px-2.5">
                <Image
                  src="/coin.svg"
                  alt="Saldo"
                  width={24}
                  height={16}
                  className="h-4 w-6"
                />
                <span className="text-xs font-semibold text-white">
                  {balanceLoading ? "..." : formatCurrency(balance)}
                </span>
              </div>

              {/* Deposit Button - StarButton com animação */}
              <Link href="/depositar">
                <StarButton
                  lightColor="#03E6FF"
                  backgroundColor="#0246FF"
                  lightWidth={80}
                  duration={2.5}
                  borderWidth={1}
                  className="h-7 px-3 rounded-lg text-[11px]"
                >
                  Depositar
                </StarButton>
              </Link>

              {/* Profile */}
              <Link href="/perfil">
                <Avatar className="h-7 w-7 border border-[#00faff]/30">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-[#0d1f3c] text-[#00faff] text-[10px] font-medium">
                    {getInitials(user?.name || null)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            // Não logado - mostra botão de entrar
            <Button
              onClick={() => openAuthModal("login")}
              className="h-9 px-4 rounded-full bg-[#00faff] hover:bg-[#00faff]/90 text-[#0a1628] font-semibold text-sm"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
