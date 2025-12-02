"use client";

import React, { useState } from "react";
import {
  Wallet,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  ArrowUpFromLine,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data - liberações de rendimentos
const mockReleases = [
  {
    id: "1",
    userId: "user_1",
    userName: "João Silva",
    userEmail: "joao@email.com",
    amount: 150.00,
    type: "monthly_yield",
    status: "available",
    releaseDate: "2024-11-01",
    withdrawnAt: null,
  },
  {
    id: "2",
    userId: "user_4",
    userName: "Ana Costa",
    userEmail: "ana@email.com",
    amount: 450.00,
    type: "monthly_yield",
    status: "withdrawn",
    releaseDate: "2024-11-01",
    withdrawnAt: "2024-11-05T14:30:00",
  },
  {
    id: "3",
    userId: "user_2",
    userName: "Maria Santos",
    userEmail: "maria@email.com",
    amount: 60.00,
    type: "monthly_yield",
    status: "available",
    releaseDate: "2024-11-01",
    withdrawnAt: null,
  },
  {
    id: "4",
    userId: "user_7",
    userName: "Roberto Lima",
    userEmail: "roberto@email.com",
    amount: 10000.00,
    type: "principal_unlock",
    status: "available",
    releaseDate: "2024-11-28",
    withdrawnAt: null,
  },
  {
    id: "5",
    userId: "user_1",
    userName: "João Silva",
    userEmail: "joao@email.com",
    amount: 150.00,
    type: "monthly_yield",
    status: "withdrawn",
    releaseDate: "2024-10-01",
    withdrawnAt: "2024-10-03T10:15:00",
  },
];

const statusConfig = {
  available: { label: "Disponível", variant: "default" as const, icon: Wallet },
  withdrawn: { label: "Sacado", variant: "secondary" as const, icon: CheckCircle },
  pending: { label: "Processando", variant: "outline" as const, icon: Clock },
};

const typeConfig = {
  monthly_yield: { label: "Rendimento Mensal", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  principal_unlock: { label: "Desbloqueio Principal", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

export default function LiberacoesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Stats
  const availableTotal = mockReleases
    .filter((r) => r.status === "available")
    .reduce((acc, r) => acc + r.amount, 0);
  const withdrawnTotal = mockReleases
    .filter((r) => r.status === "withdrawn")
    .reduce((acc, r) => acc + r.amount, 0);
  const pendingReleases = mockReleases.filter((r) => r.status === "available").length;
  const monthlyYieldTotal = mockReleases
    .filter((r) => r.type === "monthly_yield")
    .reduce((acc, r) => acc + r.amount, 0);

  // Filter
  const filteredReleases = mockReleases.filter((release) => {
    const matchesSearch =
      release.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || release.status === statusFilter;
    const matchesType = typeFilter === "all" || release.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liberações</h1>
          <p className="text-muted-foreground">
            Acompanhe as liberações de rendimentos e desbloqueios
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Gerar Liberações do Mês
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponível p/ Saque</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(availableTotal)}</div>
            <p className="text-xs text-muted-foreground">{pendingReleases} liberações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Já Sacado</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(withdrawnTotal)}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendimentos Liberados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyYieldTotal)}</div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próxima Liberação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">01/12</div>
            <p className="text-xs text-muted-foreground">Em 3 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Releases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Liberações</CardTitle>
          <CardDescription>
            Todas as liberações de rendimentos e desbloqueios de principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="withdrawn">Sacado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="monthly_yield">Rendimentos</SelectItem>
                <SelectItem value="principal_unlock">Desbloqueio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Liberação</TableHead>
                  <TableHead>Data Saque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReleases.map((release) => {
                  const status = statusConfig[release.status as keyof typeof statusConfig];
                  const type = typeConfig[release.type as keyof typeof typeConfig];

                  return (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(release.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{release.userName}</p>
                            <p className="text-sm text-muted-foreground">{release.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                          {type.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(release.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(release.releaseDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {release.withdrawnAt ? formatDate(release.withdrawnAt) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
