"use client";

import React, { useState } from "react";
import {
  ArrowDownLeft,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
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

// Mock data
const mockDeposits = [
  {
    id: "DEP-001",
    userId: "USR-123",
    userName: "João Silva",
    amount: 100.0,
    method: "PIX",
    status: "COMPLETED",
    createdAt: "2024-01-15T10:30:00",
    completedAt: "2024-01-15T10:31:00",
    txId: "E00000000202401151030ABCD1234",
  },
  {
    id: "DEP-002",
    userId: "USR-456",
    userName: "Maria Santos",
    amount: 500.0,
    method: "PIX",
    status: "PENDING",
    createdAt: "2024-01-15T11:15:00",
    txId: null,
  },
  {
    id: "DEP-003",
    userId: "USR-789",
    userName: "Pedro Oliveira",
    amount: 50.0,
    method: "PIX",
    status: "EXPIRED",
    createdAt: "2024-01-14T18:00:00",
    txId: null,
  },
  {
    id: "DEP-004",
    userId: "USR-321",
    userName: "Ana Costa",
    amount: 1000.0,
    method: "PIX",
    status: "COMPLETED",
    createdAt: "2024-01-15T08:00:00",
    completedAt: "2024-01-15T08:02:00",
    txId: "E00000000202401150800EFGH5678",
  },
  {
    id: "DEP-005",
    userId: "USR-654",
    userName: "Carlos Lima",
    amount: 200.0,
    method: "PIX",
    status: "COMPLETED",
    createdAt: "2024-01-15T07:00:00",
    completedAt: "2024-01-15T07:01:00",
    txId: "E00000000202401150700IJKL9012",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Aguardando", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  COMPLETED: { label: "Confirmado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  EXPIRED: { label: "Expirado", variant: "secondary", icon: <XCircle className="w-3 h-3" /> },
  FAILED: { label: "Falhou", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function DepositosPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDeposits = mockDeposits.filter((d) => {
    const matchesSearch =
      d.userName.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      (d.txId && d.txId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // Stats
  const todayCompleted = mockDeposits.filter((d) => d.status === "COMPLETED").length;
  const todayAmount = mockDeposits
    .filter((d) => d.status === "COMPLETED")
    .reduce((acc, d) => acc + d.amount, 0);

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
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Depósitos Hoje</CardDescription>
            <CardTitle className="text-2xl">{todayCompleted}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(todayAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando Pagamento</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: R$ 1.250,00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Conversão</CardDescription>
            <CardTitle className="text-2xl">87%</CardTitle>
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
            <CardTitle className="text-2xl">R$ 185,00</CardTitle>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {filteredDeposits.map((deposit) => {
                const status = statusConfig[deposit.status];
                return (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-mono text-sm">
                      {deposit.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deposit.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {deposit.userId}
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
                      {deposit.txId || "-"}
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
                          {deposit.status === "PENDING" && (
                            <DropdownMenuItem>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Verificar status
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
