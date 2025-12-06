"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Play, Share2, Info, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

interface GameData {
  id: string;
  name: string;
  thumbnail: string;
  provider: string;
  category: string;
  rtp: number;
  volatility: string;
  minBet: number;
  maxBet: number;
  isHot: boolean;
}

// Cache de dados do jogo em memória
const gameCache = new Map<string, { data: GameData; timestamp: number }>();
const GAME_CACHE_TTL = 60000; // 1 minuto

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  const { isAuthenticated, user, openAuthModal, showToast, balance, refreshBalance, isLoading: authLoading } = useBetAuth();
  
  const [game, setGame] = useState<GameData | null>(() => {
    // Tentar carregar do cache imediatamente
    const cached = gameCache.get(gameId);
    if (cached && (Date.now() - cached.timestamp) < GAME_CACHE_TTL) {
      return cached.data;
    }
    return null;
  });
  const [loading, setLoading] = useState(!game);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Estados do jogo
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [launchingGame, setLaunchingGame] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const toggleClass = (active: boolean) => {
      document.body.classList[active ? "add" : "remove"]("bet-game-fullscreen");
      window.dispatchEvent(new Event("bet-game-fullscreen-changed"));
    };

    if (gameUrl) {
      toggleClass(true);
    } else {
      toggleClass(false);
    }

    return () => {
      toggleClass(false);
    };
  }, [gameUrl]);

  // Carregar dados do jogo - OTIMIZADO
  useEffect(() => {
    if (game) return; // Já tem dados do cache
    
    const controller = new AbortController();
    
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`, {
          signal: controller.signal,
          cache: "force-cache", // Usar cache do browser
        });
        const data = await res.json();
        
        if (data.success && data.game) {
          setGame(data.game);
          // Salvar no cache
          gameCache.set(gameId, { data: data.game, timestamp: Date.now() });
        } else {
          setError(data.error || "Jogo não encontrado");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Erro ao carregar jogo");
        }
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
    
    return () => controller.abort();
  }, [gameId, game]);

  // Função para lançar o jogo - OTIMIZADA
  const launchGame = useCallback(async () => {
    if (!isAuthenticated) {
      showToast("Faça login para jogar", "info");
      openAuthModal("login");
      return;
    }

    if (balance <= 0) {
      showToast("Você precisa ter saldo para jogar. Faça um depósito!", "warning");
      return;
    }

    setLaunchingGame(true);

    try {
      const res = await fetch(`/api/provider/games/${gameId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "user_" + Date.now(),
          playerBalance: balance,
          mode: "REAL",
          returnUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.gameUrl) {
        setGameUrl(data.data.gameUrl);
      } else {
        showToast(data.error || "Erro ao abrir jogo", "error");
      }
    } catch {
      showToast("Erro ao conectar com o servidor", "error");
    } finally {
      setLaunchingGame(false);
    }
  }, [isAuthenticated, balance, gameId, user?.id, showToast, openAuthModal]);

  // Fechar jogo e voltar para home
  const goToHome = useCallback(async () => {
    // Atualizar saldo em background
    refreshBalance();
    router.push("/");
  }, [refreshBalance, router]);

  // Skeleton otimizado para loading inicial
  const LoadingSkeleton = useMemo(() => (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="w-32 h-5 rounded bg-white/10 animate-pulse" />
        <div className="w-12 h-6 rounded bg-white/10 animate-pulse" />
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-40 h-52 rounded-2xl bg-white/10 animate-pulse mx-auto mb-6" />
          <div className="w-48 h-8 rounded bg-white/10 animate-pulse mx-auto mb-4" />
          <div className="w-32 h-14 rounded-xl bg-[#00faff]/20 animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  ), []);

  // Loading state - mostrar skeleton
  if (loading) {
    return LoadingSkeleton;
  }

  // Error state
  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4">
        <p className="text-white/60 mb-4">{error || "Jogo não encontrado"}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Voltar para Home
        </Button>
      </div>
    );
  }

  // Se o jogo está aberto, mostrar iframe em tela cheia
  if (gameUrl) {
    return (
      <div className="fixed inset-0 bg-black z-[100]">
        <button
          onClick={goToHome}
          className="fixed top-4 left-4 z-[110] group"
          title="Voltar para Home"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-200 group-hover:bg-black/60 group-hover:border-white/20 group-hover:scale-110">
              <Home className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[10px] text-white/40 group-hover:text-white/70 transition-colors">
              Voltar
            </span>
          </div>
        </button>

        <iframe
          id="game-iframe"
          src={gameUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          loading="eager"
        />
      </div>
    );
  }

  // Tela de preview do jogo
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10 z-10 relative bg-[#0a1628]">
        <Link href="/" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold text-white truncate px-4">{game.name}</h1>
          {game.provider && (
            <p className="text-white/40 text-xs">{game.provider}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="text-white/70 hover:text-white transition"
          >
            <Star className={cn("w-5 h-5", isFavorite && "fill-yellow-500 text-yellow-500")} />
          </button>
          <button className="text-white/70 hover:text-white transition">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <div className="text-center p-4">
          {/* Thumbnail */}
          <div className="w-40 h-52 rounded-2xl overflow-hidden mx-auto mb-6 bg-white/10 relative">
            <Image 
              src={game.thumbnail} 
              alt={game.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
          
          {/* Nome e Provider */}
          <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
          {game.provider && (
            <p className="text-white/60 mb-6">{game.provider}</p>
          )}
          
          {/* Botão Jogar */}
          <Button 
            onClick={launchGame}
            disabled={launchingGame}
            className={cn(
              "h-14 px-12 text-lg font-semibold",
              "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
              "text-[#0a1628] hover:opacity-90"
            )}
          >
            {launchingGame ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Jogar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Game Info */}
      <div className="bg-[#0a1628] border-t border-white/10">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 p-4">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white/40 text-xs mb-1">RTP</p>
            <p className="text-white font-semibold text-sm">{game.rtp}%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white/40 text-xs mb-1">Max Win</p>
            <p className="text-white font-semibold text-sm">5000x</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white/40 text-xs mb-1">Volatilidade</p>
            <p className="text-white font-semibold text-sm">{game.volatility || "Alta"}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white/40 text-xs mb-1">Min Spin</p>
            <p className="text-white font-semibold text-sm">R$ 0.5</p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/60">
              Jogue com responsabilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
