"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, Users, PiggyBank, ArrowUpDown, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  cards: {
    totalBalance: {
      value: number;
      label: string;
      description: string;
      change: number;
    };
    activeUsers: {
      value: number;
      total: number;
      newToday: number;
      label: string;
      description: string;
      change: number;
    };
    totalInvested: {
      value: number;
      principal: number;
      yields: number;
      label: string;
      description: string;
    };
    ggr: {
      value: number;
      margin: number;
      totalBets: number;
      totalWon: number;
      label: string;
      description: string;
    };
  };
  deposits: {
    today: { count: number; amount: number };
    yesterday: { count: number; amount: number };
    month: { count: number; amount: number };
    pending: number;
    conversionRate: number;
  };
  withdrawals: {
    today: { count: number; amount: number };
    pending: { count: number; amount: number };
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Erro ao carregar dados");
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 mt-2" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const { cards } = stats;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Saldo Total */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="size-4" />
            {cards.totalBalance.label}
            <Badge variant="outline" className="ml-1">
              {cards.totalBalance.change >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {formatPercentage(cards.totalBalance.change)}
            </Badge>
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(cards.totalBalance.value)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Depósitos hoje: {formatCurrency(stats.deposits.today.amount)}
            {stats.deposits.today.amount >= stats.deposits.yesterday.amount ? (
              <TrendingUp className="size-4 text-green-500" />
            ) : (
              <TrendingDown className="size-4 text-red-500" />
            )}
          </div>
          <div className="text-muted-foreground">
            {cards.totalBalance.description}
          </div>
        </CardFooter>
      </Card>

      {/* Usuários Ativos */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="size-4" />
            {cards.activeUsers.label}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {cards.activeUsers.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {cards.activeUsers.change >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {formatPercentage(cards.activeUsers.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Novos usuários hoje: {cards.activeUsers.newToday}
            <TrendingUp className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            Total de jogadores: {cards.activeUsers.total}
          </div>
        </CardFooter>
      </Card>

      {/* Total Investido */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <PiggyBank className="size-4" />
            {cards.totalInvested.label}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(cards.totalInvested.value)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-3" />
              Ativo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rendimentos: {formatCurrency(cards.totalInvested.yields)}
            <TrendingUp className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            {cards.totalInvested.description}
          </div>
        </CardFooter>
      </Card>

      {/* GGR */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <ArrowUpDown className="size-4" />
            {cards.ggr.label}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(cards.ggr.value)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {cards.ggr.value >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {cards.ggr.margin.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Apostas - Prêmios pagos
            {cards.ggr.value >= 0 ? (
              <TrendingUp className="size-4 text-green-500" />
            ) : (
              <TrendingDown className="size-4 text-red-500" />
            )}
          </div>
          <div className="text-muted-foreground">{cards.ggr.description}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
