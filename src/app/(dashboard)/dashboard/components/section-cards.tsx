"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  Trophy,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker, PeriodType } from "@/components/ui/date-range-picker";

interface DashboardStats {
  period: {
    type: string;
    start: string;
    end: string;
  };
  oldestTransactionDate: string | null;
  cards: {
    receitaTotal: {
      value: number;
      today: number;
      label: string;
      description: string;
      icon: string;
    };
    premiosPagos: {
      value: number;
      today: number;
      label: string;
      description: string;
      icon: string;
    };
    lucroAtual: {
      value: number;
      today: number;
      label: string;
      description: string;
      icon: string;
      isProfit: boolean;
    };
    usuariosAtivos: {
      value: number;
      today: number;
      total: number;
      newToday: number;
      label: string;
      description: string;
      icon: string;
      change: number;
    };
  };
  gateway: {
    available: number;
    waitingFunds: number;
    reserve: number;
  } | null;
  details: {
    wallets: {
      game: number;
      invest: number;
    };
    ggr: {
      period: number;
      total: number;
      margin: number;
    };
    deposits: {
      period: { count: number; amount: number };
      today: { count: number; amount: number };
      pending: number;
    };
    withdrawals: {
      period: { count: number; amount: number };
      today: { count: number; amount: number };
      pending: { count: number; amount: number };
    };
  };
  generatedAt: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [minDate, setMinDate] = useState<Date | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (range?: DateRange, period?: PeriodType) => {
    try {
      setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("periodType", period || periodType);
      
      if (range?.from) {
        params.set("startDate", range.from.toISOString());
      }
      if (range?.to) {
        params.set("endDate", range.to.toISOString());
      }

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setLastUpdated(new Date());
        
        // Definir data mínima do date picker
        if (data.data.oldestTransactionDate && !minDate) {
          setMinDate(new Date(data.data.oldestTransactionDate));
        }
      } else {
        setError(data.error || "Erro ao carregar dados");
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodType, minDate]);

  useEffect(() => {
    fetchStats();

    // Auto-refresh a cada 30 minutos
    const interval = setInterval(() => fetchStats(dateRange, periodType), 1800000);
    return () => clearInterval(interval);
  }, []);

  const handleDateRangeChange = (range: DateRange | undefined, period: PeriodType) => {
    setDateRange(range);
    setPeriodType(period);
    fetchStats(range, period);
  };

  const handleManualRefresh = () => {
    fetchStats(dateRange, periodType);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-[400px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-32 mt-2" />
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={handleManualRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const { cards, gateway } = stats;

  return (
    <div className="space-y-4">
      {/* Filtros e controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          minDate={minDate}
          disabled={refreshing}
        />
        
        <div className="flex items-center gap-4">
          {/* Saldo do Gateway */}
          {gateway && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>Gateway:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(gateway.available)}
              </span>
            </div>
          )}
          
          {/* Última atualização e botão de refresh */}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards principais */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Receita Total */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="size-4 text-green-500" />
              {cards.receitaTotal.label}
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400 @[250px]/card:text-3xl">
              {formatCurrency(cards.receitaTotal.value)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Hoje: {formatCurrency(cards.receitaTotal.today)}
              <TrendingUp className="size-4 text-green-500" />
            </div>
            <div className="text-muted-foreground">
              {cards.receitaTotal.description}
            </div>
          </CardFooter>
        </Card>

        {/* Prêmios Pagos */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              {cards.premiosPagos.label}
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 @[250px]/card:text-3xl">
              {formatCurrency(cards.premiosPagos.value)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Hoje: {formatCurrency(cards.premiosPagos.today)}
            </div>
            <div className="text-muted-foreground">
              {cards.premiosPagos.description}
            </div>
          </CardFooter>
        </Card>

        {/* Saldo Líquido */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              {cards.lucroAtual.isProfit ? (
                <TrendingUp className="size-4 text-blue-500" />
              ) : (
                <TrendingDown className="size-4 text-red-500" />
              )}
              Saldo Líquido
              <Badge variant={cards.lucroAtual.isProfit ? "default" : "destructive"} className="ml-1">
                {cards.lucroAtual.isProfit ? "Positivo" : "Negativo"}
              </Badge>
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold tabular-nums @[250px]/card:text-3xl ${
                cards.lucroAtual.isProfit
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(cards.lucroAtual.value)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Hoje: {formatCurrency(cards.lucroAtual.today)}
              {cards.lucroAtual.today >= 0 ? (
                <TrendingUp className="size-4 text-green-500" />
              ) : (
                <TrendingDown className="size-4 text-red-500" />
              )}
            </div>
            <div className="text-muted-foreground">
              {cards.lucroAtual.description}
            </div>
          </CardFooter>
        </Card>

        {/* Usuários Ativos */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4 text-purple-500" />
              {cards.usuariosAtivos.label}
              <Badge variant="outline" className="ml-1">
                {cards.usuariosAtivos.change >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {cards.usuariosAtivos.change >= 0 ? "+" : ""}{cards.usuariosAtivos.change.toFixed(0)}%
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400 @[250px]/card:text-3xl">
              {formatCompact(cards.usuariosAtivos.value)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Ativos hoje: {cards.usuariosAtivos.today} | Novos: +{cards.usuariosAtivos.newToday}
            </div>
            <div className="text-muted-foreground">
              Total de usuários: {formatCompact(cards.usuariosAtivos.total)}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
