"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

type TimeFilter = "3h" | "12h" | "24h" | "48h" | "7d";

interface GameRecord {
  gameId: string;
  gameName: string;
  gameImage?: string;
  totalBet: number;
  profit: number;
  rounds: number;
}

interface HistoryData {
  totalBets: number;
  totalAmount: number;
  netResult: number;
  games: GameRecord[];
}

const timeFilters: { key: TimeFilter; label: string }[] = [
  { key: "3h", label: "3 horas" },
  { key: "12h", label: "12 horas" },
  { key: "24h", label: "24 horas" },
  { key: "48h", label: "48 horas" },
  { key: "7d", label: "7 dias" },
];

export default function HistoricoPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useBetAuth();
  
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>("3h");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HistoryData>({
    totalBets: 0,
    totalAmount: 0,
    netResult: 0,
    games: [],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [selectedFilter, isAuthenticated]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/bet-history?period=${selectedFilter}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2);
  };

  const getFilterLabel = () => {
    const filter = timeFilters.find(f => f.key === selectedFilter);
    if (selectedFilter === "7d") return "dos últimos 7 dias";
    return `das últimas ${filter?.label}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/perfil" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Histórico</h1>
      </header>

      {/* Time Filter Tabs */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedFilter === filter.key
                  ? "bg-[#00faff] text-[#0a1628]"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Card - Design sofisticado */}
      <div className="px-4 mb-4">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1a2d] via-[#0f1e35] to-[#0d1a2d]" />
          
          {/* Blur glow effects */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#00faff]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#00faff]/15 rounded-full blur-3xl" />
          
          {/* Border glow */}
          <div className="absolute inset-0 rounded-2xl border border-[#00faff]/10" />
          
          {/* Content */}
          <div className="relative z-10 px-4 py-3">
            <p className="text-white/60 text-sm mb-2">
              Dados {getFilterLabel()}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-white/50 text-sm">Apostou</span>
                <span className="text-[#00faff] font-semibold">{data.totalBets} vezes:</span>
                <span className="text-[#00faff] font-semibold">{formatCurrency(data.totalAmount)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-white/50 text-sm">Ganhos ou Perdas:</span>
              <span className={cn(
                "font-semibold",
                data.netResult >= 0 ? "text-emerald-400" : "text-purple-400"
              )}>
                {data.netResult >= 0 ? "+" : ""}{formatCurrency(data.netResult)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
          </div>
        ) : data.games.length === 0 ? (
          /* Empty State - Usando imagem personalizada */
          <div className="flex flex-col items-center justify-center py-20">
            <Image
              src="/no-data.png"
              alt="Sem dados"
              width={160}
              height={160}
              className="mb-6 opacity-90"
            />
            <p className="text-white/40 text-base">Nenhum registro ainda</p>
          </div>
        ) : (
          /* Games Cards */
          <div className="space-y-3">
            {data.games.map((game) => (
              <div
                key={game.gameId}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                {/* Game Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  {game.gameImage ? (
                    <Image
                      src={game.gameImage}
                      alt={game.gameName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xl font-bold">
                      {game.gameName.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base truncate">
                    {game.gameName}
                  </h3>
                  <p className="text-white/50 text-sm">
                    Total apostado: <span className="text-white/70">{formatCurrency(game.totalBet)}</span>
                  </p>
                </div>
                
                {/* Profit & Rounds */}
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    "font-bold text-base",
                    game.profit >= 0 ? "text-green-400" : "text-purple-400"
                  )}>
                    {game.profit >= 0 ? "+" : ""}{formatCurrency(game.profit)}
                  </p>
                  <p className="text-white/50 text-sm">
                    {game.rounds} {game.rounds === 1 ? "Vez" : "Vezes"}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="text-white/30">
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                    <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom scrollbar hide */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
