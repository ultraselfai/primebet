"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Star, Flame } from "lucide-react";
import { useBetAuth } from "@/contexts/bet-auth-context";

interface GameCardProps {
  id: string;
  name: string;
  thumbnail: string;
  provider?: string;
  isHot?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, nextValue: boolean) => void;
}

export function GameCard({
  id,
  name,
  thumbnail,
  provider,
  isHot,
  isNew,
  isFavorite,
  onToggleFavorite,
}: GameCardProps) {
  const { isAuthenticated, openAuthModal, showToast } = useBetAuth();

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      showToast("Faça login ou cadastre-se para jogar", "info");
      openAuthModal("login");
    }
  };

  return (
    <Link 
      href={`/jogo/${id}`} 
      className="block group"
      onClick={handleClick}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0d1f3c] border border-white/5 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]">
        {/* Game Thumbnail - Portrait */}
        <Image
          src={thumbnail || "/placeholder-game.png"}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isHot && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/90 text-[10px] font-bold text-white">
              <Flame className="w-3 h-3" />
            </span>
          )}
          {isNew && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#00faff] text-[10px] font-bold text-[#0a1628]">
              NEW
            </span>
          )}
        </div>

        {/* Favorite toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isAuthenticated) {
              showToast("Faça login para favoritar jogos", "info");
              openAuthModal("login");
              return;
            }

            onToggleFavorite?.(id, !isFavorite);
          }}
          className={cn(
            "absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 transition hover:bg-white/10",
            isFavorite && "border-yellow-400/70 bg-yellow-400/20 text-yellow-300"
          )}
          aria-label={isFavorite ? "Remover jogo dos favoritos" : "Adicionar jogo aos favoritos"}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-300 text-yellow-500")}
          />
        </button>

        {/* Provider badge */}
        {provider && (
          <div className="absolute bottom-2 left-2 right-2">
            <span className="text-[10px] text-white/70 font-medium truncate block">
              {provider}
            </span>
          </div>
        )}
      </div>

      {/* Game Name - visible on hover or always on mobile */}
      <p className="mt-2 text-xs text-gray-400 truncate text-center group-hover:text-white transition-colors">
        {name}
      </p>
    </Link>
  );
}
