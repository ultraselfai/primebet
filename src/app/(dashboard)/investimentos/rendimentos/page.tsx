"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Calculator,
  RefreshCw,
  Play,
  Pause,
  Settings,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data - rendimentos calculados
const mockYieldHistory = [
  { date: "2024-11-28", totalPrincipal: 32000, dailyRate: 0.0986, dailyYield: 31.55, totalYield: 5460.00 },
  { date: "2024-11-27", totalPrincipal: 32000, dailyRate: 0.0986, dailyYield: 31.55, totalYield: 5428.45 },
  { date: "2024-11-26", totalPrincipal: 32000, dailyRate: 0.0986, dailyYield: 31.55, totalYield: 5396.90 },
  { date: "2024-11-25", totalPrincipal: 31500, dailyRate: 0.0986, dailyYield: 31.06, totalYield: 5365.35 },
  { date: "2024-11-24", totalPrincipal: 31500, dailyRate: 0.0986, dailyYield: 31.06, totalYield: 5334.29 },
  { date: "2024-11-23", totalPrincipal: 31500, dailyRate: 0.0986, dailyYield: 31.06, totalYield: 5303.23 },
  { date: "2024-11-22", totalPrincipal: 30000, dailyRate: 0.0986, dailyYield: 29.58, totalYield: 5272.17 },
];

const yieldConfig = {
  monthlyRate: 3.0, // 3% ao mês
  dailyRate: 0.0986, // ~3% / 30.4 dias
  minPrincipal: 100,
  maxPrincipal: 100000,
  lockPeriod: 365, // dias
  yieldFrequency: "daily", // daily | monthly
};

export default function RendimentosPage() {
  const [cronStatus, setCronStatus] = useState<"running" | "paused">("running");
  const [lastRun, setLastRun] = useState("2024-11-28T00:00:15");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dateString));
  };

  // Stats
  const todayYield = mockYieldHistory[0]?.dailyYield || 0;
  const monthYield = mockYieldHistory.slice(0, 30).reduce((acc, d) => acc + d.dailyYield, 0);
  const totalYield = mockYieldHistory[0]?.totalYield || 0;
  const totalPrincipal = mockYieldHistory[0]?.totalPrincipal || 0;

  const handleRunNow = async () => {
    // TODO: Trigger manual yield calculation
    console.log("Running yield calculation manually...");
    setLastRun(new Date().toISOString());
  };

  const toggleCron = () => {
    setCronStatus(cronStatus === "running" ? "paused" : "running");
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rendimentos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os rendimentos dos investimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunNow}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Calcular Agora
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(todayYield)}</div>
            <p className="text-xs text-muted-foreground">
              Taxa: {yieldConfig.dailyRate.toFixed(4)}% ao dia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Mensal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(monthYield)}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalYield)}</div>
            <p className="text-xs text-muted-foreground">Desde o início</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Base de Cálculo</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
            <p className="text-xs text-muted-foreground">Capital investido</p>
          </CardContent>
        </Card>
      </div>

      {/* Cron Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cálculo Automático (Cron Job)</CardTitle>
              <CardDescription>
                O sistema calcula os rendimentos diariamente à meia-noite
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={cronStatus === "running" ? "default" : "secondary"} className="gap-1">
                {cronStatus === "running" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Ativo
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" />
                    Pausado
                  </>
                )}
              </Badge>
              <Button
                variant={cronStatus === "running" ? "outline" : "default"}
                size="sm"
                onClick={toggleCron}
              >
                {cronStatus === "running" ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Última Execução</p>
              <p className="font-medium">{formatDateTime(lastRun)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Próxima Execução</p>
              <p className="font-medium">Amanhã às 00:00:00</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Taxa Configurada</p>
              <p className="font-medium">{yieldConfig.monthlyRate}% ao mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yield History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>
            Registro diário dos rendimentos calculados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Capital Base</TableHead>
                  <TableHead className="text-right">Taxa Diária</TableHead>
                  <TableHead className="text-right">Rendimento do Dia</TableHead>
                  <TableHead className="text-right">Total Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockYieldHistory.map((day, index) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {formatDate(day.date)}
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-2">Hoje</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.totalPrincipal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.dailyRate.toFixed(4)}%
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      +{formatCurrency(day.dailyYield)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(day.totalYield)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Rendimentos</CardTitle>
          <CardDescription>
            Parâmetros atuais do sistema de investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Taxa Mensal</p>
              <p className="text-xl font-bold">{yieldConfig.monthlyRate}%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Período de Lock</p>
              <p className="text-xl font-bold">{yieldConfig.lockPeriod} dias</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Investimento Mínimo</p>
              <p className="text-xl font-bold">{formatCurrency(yieldConfig.minPrincipal)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Investimento Máximo</p>
              <p className="text-xl font-bold">{formatCurrency(yieldConfig.maxPrincipal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
