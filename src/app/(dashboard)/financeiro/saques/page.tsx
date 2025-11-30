"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
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

// Mock data - virá do banco de dados
const mockWithdrawals = [
  {
    id: "SAQ-001",
    userId: "USR-123",
    userName: "João Silva",
    amount: 500.0,
    pixKey: "joao@email.com",
    status: "PENDING",
    createdAt: "2024-01-15T10:30:00",
  },
  {
    id: "SAQ-002",
    userId: "USR-456",
    userName: "Maria Santos",
    amount: 1250.0,
    pixKey: "11999998888",
    status: "APPROVED",
    createdAt: "2024-01-15T09:15:00",
    approvedAt: "2024-01-15T09:45:00",
  },
  {
    id: "SAQ-003",
    userId: "USR-789",
    userName: "Pedro Oliveira",
    amount: 200.0,
    pixKey: "123.456.789-00",
    status: "REJECTED",
    createdAt: "2024-01-14T18:00:00",
    reason: "Saldo insuficiente",
  },
  {
    id: "SAQ-004",
    userId: "USR-321",
    userName: "Ana Costa",
    amount: 3500.0,
    pixKey: "ana.costa@empresa.com",
    status: "PROCESSING",
    createdAt: "2024-01-15T08:00:00",
  },
  {
    id: "SAQ-005",
    userId: "USR-654",
    userName: "Carlos Lima",
    amount: 750.0,
    pixKey: "21988887777",
    status: "PENDING",
    createdAt: "2024-01-15T11:00:00",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  PROCESSING: { label: "Processando", variant: "secondary", icon: <Clock className="w-3 h-3 animate-spin" /> },
  APPROVED: { label: "Aprovado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED: { label: "Rejeitado", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function SaquesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredWithdrawals = mockWithdrawals.filter((w) => {
    const matchesSearch =
      w.userName.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase()) ||
      w.pixKey.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
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
  const pendingCount = mockWithdrawals.filter((w) => w.status === "PENDING").length;
  const pendingAmount = mockWithdrawals
    .filter((w) => w.status === "PENDING")
    .reduce((acc, w) => acc + w.amount, 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Solicitações de Saque</h1>
        <p className="text-muted-foreground">
          Gerencie e aprove as solicitações de saque dos usuários
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saques Pendentes</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(pendingAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovados Hoje</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: R$ 15.430,00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejeitados Hoje</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: R$ 800,00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tempo Médio</CardDescription>
            <CardTitle className="text-2xl">15 min</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID ou chave PIX..."
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
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="APPROVED">Aprovados</SelectItem>
            <SelectItem value="REJECTED">Rejeitados</SelectItem>
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
                <TableHead>Chave PIX</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => {
                const status = statusConfig[withdrawal.status];
                return (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-mono text-sm">
                      {withdrawal.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{withdrawal.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.userId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(withdrawal.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {withdrawal.pixKey}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(withdrawal.createdAt)}
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
                          {withdrawal.status === "PENDING" && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejeitar
                              </DropdownMenuItem>
                            </>
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
