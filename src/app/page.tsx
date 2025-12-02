"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import Image from "next/image";
import { BetLayout } from "@/components/bet/bet-layout";
import { SearchBar, CategoryTabs, GameGrid } from "@/components/bet";
import { RecentWinsMarquee } from "@/components/bet/recent-wins-marquee";
import { BetAuthProvider } from "@/contexts/bet-auth-context";
import { Flame, Star as StarIcon, Sparkles, Dices, Trophy, Zap, RadioTower } from "lucide-react";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { usePublicSettings } from "@/contexts/public-settings-context";
import type { BannerItem, CustomIcons } from "@/types/settings";

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

// Função helper para criar ícone de categoria
function CategoryIcon({ iconUrl, fallback, className }: { iconUrl?: string; fallback: React.ReactNode; className?: string }) {
  if (iconUrl) {
    return <Image src={iconUrl} alt="" width={16} height={16} className={className || "w-4 h-4 object-contain"} />;
  }
  return <>{fallback}</>;
}

// Gera as categorias com ícones personalizados
function getCategories(icons?: CustomIcons) {
  return [
    { id: "all", label: "Todos", icon: <CategoryIcon iconUrl={icons?.categoryAllIconUrl} fallback={<Sparkles className="w-4 h-4" />} /> },
    { id: "hot", label: "Em Alta", icon: <CategoryIcon iconUrl={icons?.categoryHotIconUrl} fallback={<Flame className="w-4 h-4" />} /> },
    { id: "slots", label: "Slots", icon: <CategoryIcon iconUrl={icons?.categorySlotsIconUrl} fallback={<Dices className="w-4 h-4" />} /> },
    { id: "crash", label: "Crash", icon: <CategoryIcon iconUrl={icons?.categoryCrashIconUrl} fallback={<Zap className="w-4 h-4" />} /> },
    { id: "live", label: "Ao Vivo", icon: <CategoryIcon iconUrl={icons?.categoryLiveIconUrl} fallback={<Trophy className="w-4 h-4" />} /> },
    { id: "favorites", label: "Favoritos", icon: <CategoryIcon iconUrl={icons?.categoryFavoritesIconUrl} fallback={<StarIcon className="w-4 h-4" />} /> },
  ];
}

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(3);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const { settings: publicSettings } = usePublicSettings();
  const theme = publicSettings?.experience.theme;
  const primaryColor = theme?.primaryColor ?? "#00faff";
  const secondaryColor = theme?.secondaryColor ?? "#0a1628";
  const { showToast } = useBetAuth();
  
  // Categorias com ícones personalizados
  const categories = useMemo(() => getCategories(publicSettings?.experience?.media?.icons), [publicSettings?.experience?.media?.icons]);

  const heroBanners = useMemo<BannerItem[]>(() => {
    const banners = publicSettings?.experience.media.banners ?? [];
    return banners.filter((banner) => banner.active !== false && !!banner.imageUrl);
  }, [publicSettings]);

  const extendedBanners = useMemo<BannerItem[]>(() => {
    if (!heroBanners.length) return [];
    return [...heroBanners, heroBanners[0]];
  }, [heroBanners]);

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

  // Resetar índice quando a lista de banners mudar
  useEffect(() => {
    setDisplayIndex(0);
    setIsTransitionEnabled(true);
  }, [heroBanners.length]);

  // Auto-play: fica 3s parado, depois avança uma posição com animação
  useEffect(() => {
    if (heroBanners.length <= 1 || isCarouselPaused) return;

    const idleTimer = setTimeout(() => {
      setIsTransitionEnabled(true);
      setDisplayIndex((prev) => prev + 1);
    }, 3000);

    return () => clearTimeout(idleTimer);
  }, [displayIndex, heroBanners.length, isCarouselPaused]);

  // Quando chega no clone (último item do array estendido), reseta sem animação
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    if (displayIndex === heroBanners.length) {
      const resetTimer = setTimeout(() => {
        setIsTransitionEnabled(false);
        setDisplayIndex(0);
      }, 500);
      return () => clearTimeout(resetTimer);
    }
  }, [displayIndex, heroBanners.length]);

  // carregar favoritos do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("primebet:favorites");
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
    window.localStorage.setItem("primebet:favorites", JSON.stringify(favoriteIds));
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
      {/* Hero Banner Carousel */}
      <section 
        className="mt-4 overflow-hidden"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
        onTouchStart={() => setIsCarouselPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsCarouselPaused(false), 3000)}
      >
        <div className="mx-auto w-full max-w-sm px-4">
          {extendedBanners.length ? (
            <div className="relative aspect-[1400/445] overflow-hidden rounded-2xl">
              <div
                className="flex h-full"
                style={{
                  width: `${extendedBanners.length * 100}%`,
                  transform: `translateX(-${(displayIndex * 100) / extendedBanners.length}%)`,
                  transition: isTransitionEnabled ? "transform 500ms ease-out" : "none",
                }}
              >
                {extendedBanners.map((banner, index) => (
                  <div
                    key={`${banner.id}-${index}`}
                    className="h-full flex-shrink-0 px-0"
                    style={{ width: `${100 / extendedBanners.length}%` }}
                  >
                    <div
                      className="relative h-full rounded-2xl border bg-gradient-to-br shadow-[0_20px_30px_rgba(5,10,25,0.45)]"
                      style={{
                        borderColor: `${primaryColor}33`,
                        backgroundImage: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 320px, 400px"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Skeleton placeholder - igual aos cards de jogos */
            <div 
              className="aspect-[1400/445] overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_20px_30px_rgba(5,10,25,0.45)] animate-pulse"
              style={{
                borderColor: `${primaryColor}33`,
                backgroundImage: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor})`,
              }}
            />
          )}
        </div>
      </section>

      {/* Recent Wins Marquee */}
      <RecentWinsMarquee 
        games={games.filter(g => g.thumbnail).slice(0, 10).map(g => ({
          id: g.id,
          name: g.name,
          thumbnail: g.thumbnail,
        }))} 
      />

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
