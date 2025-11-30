"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import Image from "next/image";
import { BetLayout } from "@/components/bet/bet-layout";
import { SearchBar, CategoryTabs, GameGrid } from "@/components/bet";
import { BetAuthProvider } from "@/contexts/bet-auth-context";
import { Flame, Star as StarIcon, Sparkles, Dices, Trophy, Zap, RadioTower } from "lucide-react";
import { useBetAuth } from "@/contexts/bet-auth-context";
import Link from "next/link";
import { usePublicSettings } from "@/contexts/public-settings-context";
import type { BannerItem } from "@/types/settings";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
  provider?: string;
  isHot?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  category?: string;
}

const categories = [
  { id: "all", label: "Todos", icon: <Sparkles className="w-4 h-4" /> },
  { id: "hot", label: "Em Alta", icon: <Flame className="w-4 h-4" /> },
  { id: "slots", label: "Slots", icon: <Dices className="w-4 h-4" /> },
  { id: "crash", label: "Crash", icon: <Zap className="w-4 h-4" /> },
  { id: "live", label: "Ao Vivo", icon: <Trophy className="w-4 h-4" /> },
  { id: "favorites", label: "Favoritos", icon: <StarIcon className="w-4 h-4" /> },
];

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(3);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const { settings: publicSettings } = usePublicSettings();
  const theme = publicSettings?.experience.theme;
  const primaryColor = theme?.primaryColor ?? "#00faff";
  const secondaryColor = theme?.secondaryColor ?? "#0a1628";
  const { showToast } = useBetAuth();

  const heroBanners = useMemo<BannerItem[]>(() => {
    const banners = publicSettings?.experience.media.banners ?? [];
    return banners.filter((banner) => banner.active !== false && !!banner.imageUrl);
  }, [publicSettings]);

  // Carregar jogos públicos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar jogos HABILITADOS da API pública
        const gamesRes = await fetch("/api/games/public");
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          if (gamesData.success && gamesData.games) {
            // Jogos já vêm no formato correto da API
            const transformedGames: Game[] = gamesData.games.map((game: {
              id: string;
              name: string;
              thumbnail: string;
              provider?: string;
              isHot?: boolean;
              category?: string;
              tags?: string[];
            }) => ({
              id: game.id,
              name: game.name,
              thumbnail: game.thumbnail || "/placeholder-game.png",
              provider: game.provider || "Ultraself",
              isHot: game.isHot || false,
              isNew: false,
              isFavorite: false,
              category: game.category || "Slots",
            }));
            setGames(transformedGames);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!publicSettings?.gameColumns) return;
    const cols = Math.max(1, Math.min(4, publicSettings.gameColumns));
    setColumns(cols as 1 | 2 | 3 | 4);
  }, [publicSettings?.gameColumns]);

  useEffect(() => {
    if (!heroBanners.length) {
      setCurrentBannerIndex(0);
      return;
    }

    if (currentBannerIndex >= heroBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [heroBanners, currentBannerIndex]);

  useEffect(() => {
    if (heroBanners.length <= 1 || isCarouselPaused) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroBanners.length, isCarouselPaused]);

  // carregar favoritos do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("playinvest:favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed);
        }
      } catch (error) {
        console.error("Erro ao ler favoritos:", error);
      }
    }
  }, []);

  // persistir favoritos
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("playinvest:favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const handleToggleFavorite = useCallback((gameId: string, nextValue: boolean) => {
    setFavoriteIds((prev) => {
      if (nextValue) {
        if (prev.includes(gameId)) return prev;
        return [...prev, gameId];
      }
      return prev.filter((id) => id !== gameId);
    });
    showToast(nextValue ? "Adicionado aos favoritos" : "Removido dos favoritos", "success");
  }, [showToast]);

  // Filtrar jogos
  const filteredGames = games.filter((game) => {
    const isFavoriteGame = favoriteIds.includes(game.id);
    const gameName = game.name || "";
    const gameCategory = game.category || "";
    const matchesSearch = gameName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      activeCategory === "all" || 
      (activeCategory === "hot" && game.isHot) ||
      (activeCategory === "favorites" && isFavoriteGame) ||
      (activeCategory === "slots" && (gameCategory.toLowerCase() === "slots" || !gameCategory)) ||
      (activeCategory === "crash" && gameCategory.toLowerCase() === "crash") ||
      (activeCategory === "live" && gameCategory.toLowerCase() === "live");
    return matchesSearch && matchesCategory;
  });

  const decoratedGames = filteredGames.map((game) => ({
    ...game,
    isFavorite: favoriteIds.includes(game.id),
  }));

  const emptyStateConfig =
    activeCategory === "crash"
      ? {
          badge: "Crash",
          title: "Em breve",
          description:
            "Estamos finalizando os jogos Crash com novos provedores e animações exclusivas. Fique ligado!",
          icon: <Zap className="h-7 w-7" />,
        }
      : activeCategory === "live"
        ? {
            badge: "Ao Vivo",
            title: "Em breve",
            description:
              "Integraremos mesas ao vivo com dealers reais e streaming 4K. Ative as notificações para saber quando lançar.",
            icon: <RadioTower className="h-7 w-7" />,
          }
        : activeCategory === "favorites"
          ? {
              badge: "Favoritos",
              title: "Você ainda não favoritou jogos",
              description: "Toque na estrela dos seus jogos preferidos para montar sua lista.",
              icon: <StarIcon className="h-7 w-7" />,
            }
        : undefined;

  return (
    <>
      {/* Hero Banner */}
      <section className="px-4 mt-4">
        <div className="mx-auto w-full max-w-sm">
          <div
            className="relative aspect-[320/131] overflow-hidden rounded-[28px] border bg-gradient-to-br shadow-[0_20px_30px_rgba(5,10,25,0.45)]"
            style={{
              borderColor: `${primaryColor}33`,
              backgroundImage: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor})`,
            }}
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {heroBanners.length ? (
              <>
                {heroBanners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${index === currentBannerIndex ? "opacity-100" : "opacity-0"}`}
                    aria-hidden={index !== currentBannerIndex}
                  >
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || "Banner mobile"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 320px, 400px"
                      priority={index === currentBannerIndex}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
                    <div className="absolute inset-0 flex flex-col justify-end gap-1 px-5 pb-5">
                      {banner.badge && (
                        <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          {banner.badge}
                        </span>
                      )}
                      <h2 className="text-lg font-semibold text-white drop-shadow">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-xs text-white/80">{banner.subtitle}</p>
                      )}
                      {banner.ctaLabel && (
                        <Link
                          href={banner.ctaLink || "/depositar"}
                          className="mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-lg"
                          style={{ backgroundColor: primaryColor, color: "#0a1628" }}
                        >
                          {banner.ctaLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {heroBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {heroBanners.map((banner, index) => (
                      <button
                        key={banner.id}
                        type="button"
                        className={`h-1.5 rounded-full transition-all ${index === currentBannerIndex ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                        aria-label={`Banner ${index + 1}`}
                        onClick={() => setCurrentBannerIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col justify-center gap-1 px-5">
                <p className="text-sm font-semibold text-white">Destaque mobile</p>
                <p className="text-xs text-white/70">
                  Suba banners no Editor Visual para controlar este carrossel.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <SearchBar 
        placeholder="Buscar jogos..." 
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Categories */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Games Grid */}
      <GameGrid 
        games={decoratedGames} 
        loading={loading}
        columns={columns}
        emptyState={emptyStateConfig}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
}

function HomePageInner() {
  return (
    <BetAuthProvider>
      <BetLayout>
        <HomeContent />
      </BetLayout>
    </BetAuthProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00faff] border-t-transparent" />
      </div>
    }>
      <HomePageInner />
    </Suspense>
  );
}
