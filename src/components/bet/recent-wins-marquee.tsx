"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { WinCard } from "./win-card";
import { useFakeWins } from "@/hooks/use-fake-wins";
import { usePublicSettings } from "@/contexts/public-settings-context";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
}

interface RecentWinsMarqueeProps {
  games: Game[];
}

export function RecentWinsMarquee({ games }: RecentWinsMarqueeProps) {
  const { settings } = usePublicSettings();
  const primaryColor = settings?.experience?.theme?.primaryColor || "#00faff";
  const trophyIconUrl = settings?.experience?.media?.icons?.trophyIconUrl;
  
  // Gerar 20 vitórias fake
  const wins = useFakeWins(games, 20);

  // Duplicar wins para criar efeito infinito
  const duplicatedWins = useMemo(() => {
    return [...wins, ...wins];
  }, [wins]);

  if (!games.length || !wins.length) {
    return null;
  }

  return (
    <section className="mt-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {trophyIconUrl ? (
          <Image 
            src={trophyIconUrl} 
            alt="Troféu" 
            width={20} 
            height={20} 
            className="w-5 h-5 object-contain"
          />
        ) : (
          <Trophy className="w-5 h-5" style={{ color: primaryColor }} />
        )}
        <h2 className="text-white font-semibold text-base">
          Grandes Vitórias Recentes
        </h2>
      </div>

      {/* Marquee Container */}
      <div className="relative overflow-hidden">
        {/* Gradiente esquerdo */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg-color)] to-transparent z-10 pointer-events-none" 
          style={{ "--bg-color": settings?.experience?.theme?.secondaryColor || "#0a1628" } as React.CSSProperties} 
        />
        
        {/* Gradiente direito */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-color)] to-transparent z-10 pointer-events-none"
          style={{ "--bg-color": settings?.experience?.theme?.secondaryColor || "#0a1628" } as React.CSSProperties}
        />

        {/* Marquee */}
        <div className="flex gap-3 animate-marquee hover:pause-animation">
          {duplicatedWins.map((win, index) => (
            <WinCard
              key={`${win.id}-${index}`}
              thumbnail={win.game.thumbnail}
              gameName={win.game.name}
              playerId={win.playerId}
              amount={win.amount}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
