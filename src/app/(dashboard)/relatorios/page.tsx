"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Gamepad2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  PieChart,
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

// Dados zerados - aguardando integração com banco de dados
const summaryData = {
  revenue: {
    current: 0,
    previous: 0,
    change: 0,
  },
  deposits: {
    current: 0,
    previous: 0,
    change: 0,
  },
  withdrawals: {
    current: 0,
    previous: 0,
    change: 0,
  },
  users: {
    current: 0,
    previous: 0,
    change: 0,
  },
};

const dailyReport: { date: string; deposits: number; withdrawals: number; ggr: number; users: number }[] = [];

const topGames: { name: string; plays: number; revenue: number; users: number }[] = [];

const userAcquisition: { source: string; users: number; percentage: number }[] = [];

export default function RelatoriosPage() {
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}`);
  };

  const MetricCard = ({
    title,
    icon: Icon,
    current,
    change,
    format = "currency",
  }: {
    title: string;
    icon: React.ElementType;
    current: number;
    change: number;
    format?: "currency" | "number";
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === "currency" ? formatCurrency(current) : current.toLocaleString()}
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
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          icon={DollarSign}
          current={summaryData.revenue.current}
          change={summaryData.revenue.change}
        />
        <MetricCard
          title="Depósitos"
          icon={ArrowDownToLine}
          current={summaryData.deposits.current}
          change={summaryData.deposits.change}
        />
        <MetricCard
          title="Saques"
          icon={ArrowUpFromLine}
          current={summaryData.withdrawals.current}
          change={summaryData.withdrawals.change}
        />
        <MetricCard
          title="Usuários Ativos"
          icon={Users}
          current={summaryData.users.current}
          change={summaryData.users.change}
          format="number"
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
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily Summary Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Diário</CardTitle>
                <CardDescription>
                  Comparativo de depósitos, saques e GGR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Gráfico de barras interativo
                    </p>
                  </div>
                </div>
                {/* Table fallback */}
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Depósitos</TableHead>
                      <TableHead className="text-right">Saques</TableHead>
                      <TableHead className="text-right">GGR</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyReport.slice(0, 5).map((day) => (
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
                        <TableCell className="text-right">
                          {day.users.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* User Acquisition */}
            <Card>
              <CardHeader>
                <CardTitle>Aquisição de Usuários</CardTitle>
                <CardDescription>
                  Distribuição por canal de origem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg mb-4">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Gráfico de pizza interativo
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {userAcquisition.map((source) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {source.users.toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {source.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Jogos por Receita</CardTitle>
              <CardDescription>
                Os jogos mais lucrativos do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Jogo</TableHead>
                    <TableHead className="text-right">Jogadas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Usuários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topGames.map((game, index) => (
                    <TableRow key={game.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell className="text-right">
                        {game.plays.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(game.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {game.users.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">-- vs período anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">-- vs período anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(0)}</div>
                <p className="text-xs text-muted-foreground">-- vs período anterior</p>
              </CardContent>
            </Card>
          </div>
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
                      <span>Total Entradas</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-5 w-5 text-orange-600" />
                      <span>Total Saídas</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span>Saldo Líquido</span>
                    </div>
                    <span className="font-bold text-primary">
                      {formatCurrency(0)}
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
                    <span className="font-medium">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">NGR (Net Gaming Revenue)</span>
                    <span className="font-medium">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Margem Bruta</span>
                    <span className="font-medium">0%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ROI Afiliados</span>
                    <span className="font-medium">0%</span>
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
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
              <FileText className="h-4 w-4 mr-2" />
              Relatório Completo (Excel)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Resumo Executivo (PDF)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <FileText className="h-4 w-4 mr-2" />
              Dados Brutos (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
