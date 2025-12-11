"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Loader2,
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

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  gatewayRef: string | null;
  pixKey: string | null;
  createdAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    playerId: string | null;
  };
}

interface TransactionStats {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  DEPOSIT: { label: "Depósito", icon: <ArrowDownLeft className="w-4 h-4" />, color: "text-green-600" },
  WITHDRAWAL: { label: "Saque", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-red-600" },
  BET: { label: "Aposta", icon: <TrendingDown className="w-4 h-4" />, color: "text-orange-600" },
  WIN: { label: "Prêmio", icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600" },
  YIELD: { label: "Rendimento", icon: <TrendingUp className="w-4 h-4" />, color: "text-purple-600" },
  TRANSFER: { label: "Transferência", icon: <RefreshCw className="w-4 h-4" />, color: "text-blue-600" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  PROCESSING: { label: "Processando", variant: "outline" },
  COMPLETED: { label: "Concluído", variant: "default" },
  FAILED: { label: "Falhou", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  EXPIRED: { label: "Expirado", variant: "outline" },
};

export default function ExtratoPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      
      if (search) {
        params.set("search", search);
      }
      
      if (period !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (period) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        params.set("startDate", startDate.toISOString());
      }
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search, period]);

  const fetchStats = useCallback(async () => {
    try {
      const [depositsRes, withdrawalsRes, pendingDepositsRes, pendingWithdrawalsRes] = await Promise.all([
        fetch("/api/transactions?type=DEPOSIT&status=COMPLETED&limit=1000"),
        fetch("/api/transactions?type=WITHDRAWAL&status=COMPLETED&limit=1000"),
        fetch("/api/transactions?type=DEPOSIT&status=PENDING&limit=1000"),
        fetch("/api/transactions?type=WITHDRAWAL&status=PENDING&limit=1000"),
      ]);
      
      const [depositsData, withdrawalsData, pendingDepositsData, pendingWithdrawalsData] = await Promise.all([
        depositsRes.json(),
        withdrawalsRes.json(),
        pendingDepositsRes.json(),
        pendingWithdrawalsRes.json(),
      ]);
      
      setStats({
        totalDeposits: depositsData.data?.stats?.totalAmount || 0,
        totalWithdrawals: Math.abs(withdrawalsData.data?.stats?.totalAmount || 0),
        pendingDeposits: pendingDepositsData.data?.stats?.totalAmount || 0,
        pendingWithdrawals: Math.abs(pendingWithdrawalsData.data?.stats?.totalAmount || 0),
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = () => {
    fetchTransactions();
    fetchStats();
  };

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-green-500" />
              Depósitos Confirmados
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(stats.totalDeposits)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total de entradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-red-500" />
              Saques Pagos
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(stats.totalWithdrawals)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total de saídas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-yellow-500" />
              Depósitos Pendentes
            </CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {formatCurrency(stats.pendingDeposits)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-500" />
              Saques Pendentes
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {formatCurrency(stats.pendingWithdrawals)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="DEPOSIT">Depósitos</SelectItem>
            <SelectItem value="WITHDRAWAL">Saques</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Transações</CardTitle>
          <CardDescription>
            {total} transações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowDownLeft className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm">As transações aparecerão aqui quando forem realizadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const typeInfo = typeConfig[transaction.type] || typeConfig.DEPOSIT;
                  const statusInfo = statusConfig[transaction.status] || statusConfig.PENDING;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${typeInfo.color}`}>
                          {typeInfo.icon}
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "DEPOSIT" ? "+" : "-"}
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
          )}
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
