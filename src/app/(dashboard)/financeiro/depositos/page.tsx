"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Deposit {
  id: string;
  amount: number;
  status: string;
  method: string;
  gatewayRef: string | null;
  createdAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    playerId: string | null;
  };
}

interface DepositsData {
  deposits: Deposit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    today: { count: number; amount: number };
    pending: { count: number; amount: number };
    conversionRate: number;
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Aguardando", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  PROCESSING: { label: "Processando", variant: "secondary", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  COMPLETED: { label: "Confirmado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  EXPIRED: { label: "Expirado", variant: "secondary", icon: <XCircle className="w-3 h-3" /> },
  FAILED: { label: "Falhou", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  CANCELLED: { label: "Cancelado", variant: "secondary", icon: <XCircle className="w-3 h-3" /> },
};

export default function DepositosPage() {
  const [data, setData] = useState<DepositsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/deposits?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar depósitos:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const stats = data?.stats || { today: { count: 0, amount: 0 }, pending: { count: 0, amount: 0 }, conversionRate: 0 };
  const ticketMedio = stats.today.count > 0 ? stats.today.amount / stats.today.count : 0;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Depósitos</h1>
          <p className="text-muted-foreground">
            Acompanhe os depósitos realizados na plataforma
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDeposits} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Depósitos Hoje</CardDescription>
            <CardTitle className="text-2xl">{stats.today.count}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(stats.today.amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando Pagamento</CardDescription>
            <CardTitle className="text-2xl">{stats.pending.count}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(stats.pending.amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Conversão</CardDescription>
            <CardTitle className="text-2xl">{stats.conversionRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              PIX gerados vs confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket Médio</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(ticketMedio)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Valor médio por depósito
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID ou TxID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Aguardando</SelectItem>
            <SelectItem value="COMPLETED">Confirmados</SelectItem>
            <SelectItem value="EXPIRED">Expirados</SelectItem>
            <SelectItem value="FAILED">Falhas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TxID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum depósito encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.deposits.map((deposit) => {
                    const status = statusConfig[deposit.status] || statusConfig.PENDING;
                    return (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-mono text-sm">
                          {deposit.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{deposit.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {deposit.user.playerId || deposit.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          +{formatCurrency(deposit.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deposit.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                          {deposit.gatewayRef || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(deposit.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {data.deposits.length} de {data.pagination.total} depósitos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
