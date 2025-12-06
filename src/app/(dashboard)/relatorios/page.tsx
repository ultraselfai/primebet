"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Gamepad2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ReportData {
  summary: {
    revenue: { current: number; previous: number; change: number };
    deposits: { current: number; previous: number; change: number; count: number };
    withdrawals: { current: number; previous: number; change: number; count: number };
    users: { current: number; previous: number; change: number };
  };
  userMetrics: {
    newUsers: { current: number; previous: number; change: number };
    ltv: number;
    ticketMedio: { current: number; previous: number; change: number };
    totalPlayersWithDeposit: number;
  };
  topGames: Array<{ id: string; name: string; plays: number; revenue: number; users: number }>;
  dailyReport: Array<{ date: string; deposits: number; withdrawals: number; ggr: number; users: number }>;
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Exportação real usando xlsx
  const handleExport = (format: "xlsx" | "csv") => {
    if (!data) return;
    
    // Preparar dados para exportação
    const summarySheet = [
      ["Relatório de Métricas - PrimeBet"],
      ["Período:", period],
      ["Gerado em:", new Date().toLocaleString("pt-BR")],
      [],
      ["RESUMO FINANCEIRO"],
      ["Métrica", "Valor Atual", "Período Anterior", "Variação (%)"],
      ["Receita (GGR)", data.summary.revenue.current, data.summary.revenue.previous, `${data.summary.revenue.change.toFixed(1)}%`],
      ["Depósitos", data.summary.deposits.current, data.summary.deposits.previous, `${data.summary.deposits.change.toFixed(1)}%`],
      ["Saques", data.summary.withdrawals.current, data.summary.withdrawals.previous, `${data.summary.withdrawals.change.toFixed(1)}%`],
      ["Usuários Ativos", data.summary.users.current, data.summary.users.previous, `${data.summary.users.change.toFixed(1)}%`],
      [],
      ["MÉTRICAS DE USUÁRIOS"],
      ["Novos Usuários", data.userMetrics.newUsers.current, data.userMetrics.newUsers.previous, `${data.userMetrics.newUsers.change.toFixed(1)}%`],
      ["LTV (Lifetime Value)", formatCurrency(data.userMetrics.ltv), "", ""],
      ["Ticket Médio", data.userMetrics.ticketMedio.current, data.userMetrics.ticketMedio.previous, `${data.userMetrics.ticketMedio.change.toFixed(1)}%`],
    ];
    
    const gamesSheet = [
      ["TOP JOGOS"],
      ["Posição", "Jogo", "Jogadas", "Receita (GGR)", "Jogadores"],
      ...data.topGames.map((game, index) => [
        index + 1,
        game.name,
        game.plays,
        game.revenue,
        game.users,
      ]),
    ];
    
    const dailySheet = [
      ["RELATÓRIO DIÁRIO"],
      ["Data", "Depósitos", "Saques", "GGR"],
      ...data.dailyReport.map((day) => [
        day.date,
        day.deposits,
        day.withdrawals,
        day.ggr,
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(workbook, ws1, "Resumo");
    
    const ws2 = XLSX.utils.aoa_to_sheet(gamesSheet);
    XLSX.utils.book_append_sheet(workbook, ws2, "Jogos");
    
    const ws3 = XLSX.utils.aoa_to_sheet(dailySheet);
    XLSX.utils.book_append_sheet(workbook, ws3, "Diário");

    if (format === "xlsx") {
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `relatorio-primebet-${period}-${new Date().toISOString().split("T")[0]}.xlsx`);
    } else {
      const csvContent = XLSX.utils.sheet_to_csv(ws1);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `relatorio-primebet-${period}-${new Date().toISOString().split("T")[0]}.csv`);
    }
  };

  const summaryData = data?.summary || {
    revenue: { current: 0, previous: 0, change: 0 },
    deposits: { current: 0, previous: 0, change: 0, count: 0 },
    withdrawals: { current: 0, previous: 0, change: 0, count: 0 },
    users: { current: 0, previous: 0, change: 0 },
  };

  const userMetrics = data?.userMetrics || {
    newUsers: { current: 0, previous: 0, change: 0 },
    ltv: 0,
    ticketMedio: { current: 0, previous: 0, change: 0 },
    totalPlayersWithDeposit: 0,
  };

  const dailyReport = data?.dailyReport || [];
  const topGames = data?.topGames || [];

  const MetricCard = ({
    title,
    icon: Icon,
    current,
    change,
    format = "currency",
    loading: isLoading,
  }: {
    title: string;
    icon: React.ElementType;
    current: number;
    change: number;
    format?: "currency" | "number" | "percent";
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {format === "currency" 
                ? formatCurrency(current) 
                : format === "percent" 
                  ? `${current.toFixed(1)}%` 
                  : current.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change >= 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise e métricas de desempenho da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReports} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita (GGR)"
          icon={DollarSign}
          current={summaryData.revenue.current}
          change={summaryData.revenue.change}
          loading={loading}
        />
        <MetricCard
          title="Depósitos"
          icon={ArrowDownToLine}
          current={summaryData.deposits.current}
          change={summaryData.deposits.change}
          loading={loading}
        />
        <MetricCard
          title="Saques"
          icon={ArrowUpFromLine}
          current={summaryData.withdrawals.current}
          change={summaryData.withdrawals.change}
          loading={loading}
        />
        <MetricCard
          title="Usuários Ativos"
          icon={Users}
          current={summaryData.users.current}
          change={summaryData.users.change}
          format="number"
          loading={loading}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="games" className="gap-1">
            <Gamepad2 className="h-4 w-4" />
            Jogos
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Diário</CardTitle>
              <CardDescription>
                Comparativo de depósitos, saques e GGR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] flex items-center justify-center bg-muted/50 rounded-lg mb-4">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico de barras (em breve)
                  </p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dailyReport.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado encontrado para o período
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Depósitos</TableHead>
                      <TableHead className="text-right">Saques</TableHead>
                      <TableHead className="text-right">GGR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyReport.slice(0, 7).map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(day.deposits)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(day.withdrawals)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(day.ggr)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho dos Jogos</CardTitle>
              <CardDescription>
                Ranking por receita e número de jogadas no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : topGames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum jogo com apostas no período
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Jogo</TableHead>
                      <TableHead className="text-right">Jogadas</TableHead>
                      <TableHead className="text-right">Receita (GGR)</TableHead>
                      <TableHead className="text-right">Jogadores</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topGames.map((game, index) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{game.name || "Jogo sem nome"}</TableCell>
                        <TableCell className="text-right">
                          {game.plays.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={game.revenue >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(game.revenue)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {game.users.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{userMetrics.newUsers.current}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {userMetrics.newUsers.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-xs ${userMetrics.newUsers.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {userMetrics.newUsers.change >= 0 ? "+" : ""}{userMetrics.newUsers.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs período anterior</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LTV (Lifetime Value)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(userMetrics.ltv)}</div>
                    <p className="text-xs text-muted-foreground">
                      Valor médio por jogador
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(userMetrics.ticketMedio.current)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {userMetrics.ticketMedio.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-xs ${userMetrics.ticketMedio.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {userMetrics.ticketMedio.change >= 0 ? "+" : ""}{userMetrics.ticketMedio.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs período anterior</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Jogadores com depósito</span>
                  <span className="font-bold">{userMetrics.totalPlayersWithDeposit}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Usuários ativos no período</span>
                  <span className="font-bold">{summaryData.users.current}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Entradas vs Saídas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="h-5 w-5 text-green-600" />
                      <span>Total Entradas (Depósitos)</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(summaryData.deposits.current)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-5 w-5 text-orange-600" />
                      <span>Total Saídas (Saques)</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(summaryData.withdrawals.current)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span>Saldo Líquido</span>
                    </div>
                    <span className="font-bold text-primary">
                      {formatCurrency(summaryData.deposits.current - summaryData.withdrawals.current)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Financeiras</CardTitle>
                <CardDescription>Indicadores de performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GGR (Gross Gaming Revenue)</span>
                    <span className="font-medium">{formatCurrency(summaryData.revenue.current)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantidade de Depósitos</span>
                    <span className="font-medium">{summaryData.deposits.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantidade de Saques</span>
                    <span className="font-medium">{summaryData.withdrawals.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Margem Bruta</span>
                    <span className="font-medium">
                      {summaryData.deposits.current > 0 
                        ? `${((summaryData.revenue.current / summaryData.deposits.current) * 100).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar Relatórios</CardTitle>
          <CardDescription>Baixe relatórios detalhados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} disabled={!data}>
              <Download className="h-4 w-4 mr-2" />
              Relatório Completo (Excel)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={!data}>
              <Download className="h-4 w-4 mr-2" />
              Dados Brutos (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
