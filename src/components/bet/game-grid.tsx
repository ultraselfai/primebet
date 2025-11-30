"use client";

import React from "react";
import { GameCard } from "./game-card";
import { cn } from "@/lib/utils";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
  provider?: string;
  isHot?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
}

interface GameGridProps {
  games: Game[];
  loading?: boolean;
  columns?: 1 | 2 | 3 | 4;
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    badge?: string;
  };
  onToggleFavorite?: (id: string, nextValue: boolean) => void;
}

// Mapeamento de colunas para classes CSS responsivas
const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

export function GameGrid({ games, loading, columns = 3, emptyState, onToggleFavorite }: GameGridProps) {
  const gridClass = columnClasses[columns] || columnClasses[3];

  if (loading) {
    return (
      <div className={cn("grid gap-3 px-4 py-4", gridClass)}>
        {Array.from({ length: columns * 3 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-[#0d1f3c] animate-pulse" />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          {emptyState?.icon || <span className="text-3xl">🎮</span>}
        </div>
        {emptyState?.badge && (
          <span className="mb-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
            {emptyState.badge}
          </span>
        )}
        <h3 className="text-lg font-semibold text-white">
          {emptyState?.title || "Nenhum jogo encontrado"}
        </h3>
        <p className="mt-2 text-sm text-white/60">
          {emptyState?.description || "Tente alterar os filtros para encontrar outros jogos."}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 px-4 py-4", gridClass)}>
      {games.map((game) => (
        <GameCard
          key={game.id}
          id={game.id}
          name={game.name}
          thumbnail={game.thumbnail}
          provider={game.provider}
          isHot={game.isHot}
          isNew={game.isNew}
          isFavorite={game.isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
