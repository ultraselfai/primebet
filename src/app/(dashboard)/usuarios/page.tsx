"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Gamepad2,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldX,
  ChevronDown,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data - substituir por dados reais da API
const mockUsers = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-1234",
    cpf: "***.***.***-12",
    status: "active",
    kycStatus: "verified",
    createdAt: "2024-10-15",
    lastLogin: "2024-11-28T14:30:00",
    walletGame: 1250.50,
    walletInvest: 5000.00,
    totalBets: 342,
    totalDeposits: 15000.00,
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@email.com",
    phone: "(21) 98888-5678",
    cpf: "***.***.***-34",
    status: "active",
    kycStatus: "pending",
    createdAt: "2024-11-01",
    lastLogin: "2024-11-28T12:15:00",
    walletGame: 500.00,
    walletInvest: 2000.00,
    totalBets: 89,
    totalDeposits: 3500.00,
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    email: "carlos@email.com",
    phone: "(31) 97777-9012",
    cpf: "***.***.***-56",
    status: "blocked",
    kycStatus: "rejected",
    createdAt: "2024-09-20",
    lastLogin: "2024-11-25T09:00:00",
    walletGame: 0,
    walletInvest: 1500.00,
    totalBets: 567,
    totalDeposits: 8000.00,
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@email.com",
    phone: "(41) 96666-3456",
    cpf: "***.***.***-78",
    status: "active",
    kycStatus: "verified",
    createdAt: "2024-08-10",
    lastLogin: "2024-11-28T16:45:00",
    walletGame: 3200.00,
    walletInvest: 15000.00,
    totalBets: 1205,
    totalDeposits: 45000.00,
  },
  {
    id: "5",
    name: "Pedro Mendes",
    email: "pedro@email.com",
    phone: "(51) 95555-7890",
    cpf: "***.***.***-90",
    status: "pending",
    kycStatus: "none",
    createdAt: "2024-11-27",
    lastLogin: null,
    walletGame: 0,
    walletInvest: 0,
    totalBets: 0,
    totalDeposits: 0,
  },
];

const statusConfig = {
  active: { label: "Ativo", variant: "default" as const, icon: CheckCircle },
  blocked: { label: "Bloqueado", variant: "destructive" as const, icon: Ban },
  pending: { label: "Pendente", variant: "secondary" as const, icon: AlertTriangle },
};

const kycConfig = {
  verified: { label: "Verificado", variant: "default" as const, icon: ShieldCheck },
  pending: { label: "Pendente", variant: "secondary" as const, icon: AlertTriangle },
  rejected: { label: "Rejeitado", variant: "destructive" as const, icon: ShieldX },
  none: { label: "Não enviado", variant: "outline" as const, icon: ShieldX },
};

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.status === "active").length;
  const verifiedUsers = mockUsers.filter((u) => u.kycStatus === "verified").length;
  const totalBalance = mockUsers.reduce((acc, u) => acc + u.walletGame + u.walletInvest, 0);

  // Filter users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesKyc = kycFilter === "all" || user.kycStatus === kycFilter;
    return matchesSearch && matchesStatus && matchesKyc;
  });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários da plataforma
          </p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Exportar Lista
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeUsers / totalUsers) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">KYC Verificado</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((verifiedUsers / totalUsers) * 100).toFixed(0)}% verificados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Em todas as carteiras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários cadastrados
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
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os KYC</SelectItem>
                <SelectItem value="verified">Verificado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="none">Não enviado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead className="text-right">Saldo Jogo</TableHead>
                  <TableHead className="text-right">Saldo Investido</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const status = statusConfig[user.status as keyof typeof statusConfig];
                  const kyc = kycConfig[user.kycStatus as keyof typeof kycConfig];

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={kyc.variant} className="gap-1">
                          <kyc.icon className="h-3 w-3" />
                          {kyc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(user.walletGame)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(user.walletInvest)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Wallet className="h-4 w-4 mr-2" />
                              Ver Carteiras
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Gamepad2 className="h-4 w-4 mr-2" />
                              Histórico de Jogos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "active" ? (
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="h-4 w-4 mr-2" />
                                Bloquear Usuário
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Desbloquear
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
          </div>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredUsers.length} de {totalUsers} usuários
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
