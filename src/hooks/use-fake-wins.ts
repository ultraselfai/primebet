"use client";

import { useState, useEffect, useMemo } from "react";
import { generatePlayerId, maskPlayerId } from "@/lib/utils/generate-player-id";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
}

interface FakeWin {
  id: string;
  playerId: string;
  maskedPlayerId: string;
  game: Game;
  amount: number;
}

/**
 * Hook para gerar vitórias fake para o marquee
 */
export function useFakeWins(games: Game[], count: number = 20) {
  const [wins, setWins] = useState<FakeWin[]>([]);

  // Gerar valor aleatório - maioria entre R$ 200-600, poucos acima
  const generateAmount = (): number => {
    const random = Math.random();
    
    if (random < 0.70) {
      // 70% entre 200 e 600 (valores mais comuns)
      return Math.floor(Math.random() * 400) + 200;
    } else if (random < 0.90) {
      // 20% entre 600 e 1200
      return Math.floor(Math.random() * 600) + 600;
    } else if (random < 0.97) {
      // 7% entre 1200 e 2000
      return Math.floor(Math.random() * 800) + 1200;
    } else {
      // 3% entre 2000 e 3000 (raros)
      return Math.floor(Math.random() * 1000) + 2000;
    }
  };

  // Gerar vitórias fake
  const generateWins = useMemo(() => {
    return (): FakeWin[] => {
      if (!games.length) return [];

      const generatedIds = new Set<string>();
      const newWins: FakeWin[] = [];

      for (let i = 0; i < count; i++) {
        // Gerar ID único
        let playerId: string;
        do {
          playerId = generatePlayerId();
        } while (generatedIds.has(playerId));
        generatedIds.add(playerId);

        // Selecionar jogo aleatório
        const game = games[Math.floor(Math.random() * games.length)];

        newWins.push({
          id: `win-${i}-${Date.now()}`,
          playerId,
          maskedPlayerId: maskPlayerId(playerId),
          game,
          amount: generateAmount(),
        });
      }

      return newWins;
    };
  }, [games, count]);

  useEffect(() => {
    if (games.length > 0) {
      setWins(generateWins());
    }
  }, [games, generateWins]);

  // Regenerar vitórias periodicamente (a cada 60 segundos)
  useEffect(() => {
    if (games.length === 0) return;

    const interval = setInterval(() => {
      setWins(generateWins());
    }, 60000);

    return () => clearInterval(interval);
  }, [games, generateWins]);

  return wins;
}
