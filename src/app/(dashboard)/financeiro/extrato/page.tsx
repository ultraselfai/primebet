"use client";

import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const mockTransactions = [
  { id: "TXN-001", type: "DEPOSIT", description: "Depósito PIX", amount: 500, userId: "USR-123", userName: "João Silva", createdAt: "2024-01-15T14:30:00" },
  { id: "TXN-002", type: "WITHDRAWAL", description: "Saque aprovado", amount: -250, userId: "USR-456", userName: "Maria Santos", createdAt: "2024-01-15T14:15:00" },
  { id: "TXN-003", type: "BET", description: "Aposta - Gates of Olympus", amount: -50, userId: "USR-123", userName: "João Silva", createdAt: "2024-01-15T14:00:00" },
  { id: "TXN-004", type: "WIN", description: "Prêmio - Gates of Olympus", amount: 175, userId: "USR-123", userName: "João Silva", createdAt: "2024-01-15T14:01:00" },
  { id: "TXN-005", type: "YIELD", description: "Rendimento investimento", amount: 15, userId: "USR-789", userName: "Pedro Oliveira", createdAt: "2024-01-15T00:00:00" },
  { id: "TXN-006", type: "DEPOSIT", description: "Depósito PIX", amount: 1000, userId: "USR-321", userName: "Ana Costa", createdAt: "2024-01-15T12:00:00" },
  { id: "TXN-007", type: "TRANSFER", description: "Transferência para investimento", amount: -500, userId: "USR-321", userName: "Ana Costa", createdAt: "2024-01-15T12:05:00" },
  { id: "TXN-008", type: "BET", description: "Aposta - Sweet Bonanza", amount: -100, userId: "USR-654", userName: "Carlos Lima", createdAt: "2024-01-15T11:30:00" },
  { id: "TXN-009", type: "WITHDRAWAL", description: "Saque aprovado", amount: -800, userId: "USR-987", userName: "Lucas Ferreira", createdAt: "2024-01-15T10:00:00" },
  { id: "TXN-010", type: "DEPOSIT", description: "Depósito PIX", amount: 200, userId: "USR-654", userName: "Carlos Lima", createdAt: "2024-01-15T09:00:00" },
];

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  DEPOSIT: { label: "Depósito", icon: <ArrowDownLeft className="w-4 h-4" />, color: "text-green-600" },
  WITHDRAWAL: { label: "Saque", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-red-600" },
  BET: { label: "Aposta", icon: <TrendingDown className="w-4 h-4" />, color: "text-orange-600" },
  WIN: { label: "Prêmio", icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600" },
  YIELD: { label: "Rendimento", icon: <TrendingUp className="w-4 h-4" />, color: "text-purple-600" },
  TRANSFER: { label: "Transferência", icon: <RefreshCw className="w-4 h-4" />, color: "text-blue-600" },
};

export default function ExtratoPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [period, setPeriod] = useState("today");

  const filteredTransactions = mockTransactions.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Calculate totals
  const totalDeposits = mockTransactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawals = Math.abs(
    mockTransactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((acc, t) => acc + t.amount, 0)
  );
  const totalBets = Math.abs(
    mockTransactions
      .filter((t) => t.type === "BET")
      .reduce((acc, t) => acc + t.amount, 0)
  );
  const totalWins = mockTransactions
    .filter((t) => t.type === "WIN")
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Extrato Financeiro</h1>
          <p className="text-muted-foreground">
            Todas as movimentações financeiras da plataforma
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-green-500" />
              Entradas
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(totalDeposits)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Depósitos do período</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-red-500" />
              Saídas
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(totalWithdrawals)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Saques aprovados</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              Volume Apostas
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalBets)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total apostado</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Prêmios Pagos
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalWins)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ganhos dos jogadores</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DEPOSIT">Depósitos</SelectItem>
            <SelectItem value="WITHDRAWAL">Saques</SelectItem>
            <SelectItem value="BET">Apostas</SelectItem>
            <SelectItem value="WIN">Prêmios</SelectItem>
            <SelectItem value="YIELD">Rendimentos</SelectItem>
            <SelectItem value="TRANSFER">Transferências</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const typeInfo = typeConfig[transaction.type];
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${typeInfo.color}`}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.userId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.amount > 0 ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
