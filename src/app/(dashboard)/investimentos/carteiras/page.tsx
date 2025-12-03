"use client";

import React, { useState } from "react";
import {
  PiggyBank,
  Search,
  TrendingUp,
  Wallet,
  Lock,
  Calendar,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dados zerados para ambiente de produção
const mockInvestments: Array<{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  principal: number;
  earnings: number;
  earningsAvailable: number;
  monthlyRate: number;
  startDate: string;
  unlockDate: string;
  daysRemaining: number;
  status: string;
}> = [];

export default function CarteirasInvestimentoPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
  const totalPrincipal = mockInvestments.reduce((acc, i) => acc + i.principal, 0);
  const totalEarnings = mockInvestments.reduce((acc, i) => acc + i.earnings, 0);
  const totalAvailable = mockInvestments.reduce((acc, i) => acc + i.earningsAvailable, 0);
  const activeInvestors = mockInvestments.filter((i) => i.status === "active").length;

  // Filter
  const filteredInvestments = mockInvestments.filter((inv) => {
    return (
      inv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteiras de Investimento</h1>
          <p className="text-muted-foreground">
            Gerencie as carteiras de investimento dos usuários
          </p>
        </div>
        <Button variant="outline">
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capital Total</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
            <p className="text-xs text-muted-foreground">Principal investido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendimentos Gerados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponível p/ Saque</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAvailable)}</div>
            <p className="text-xs text-muted-foreground">Rendimentos liberados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investidores Ativos</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvestors}</div>
            <p className="text-xs text-muted-foreground">Com capital bloqueado</p>
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Carteiras Ativas</CardTitle>
          <CardDescription>
            Visualize todas as carteiras de investimento
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
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investidor</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Rendimentos</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Desbloqueio</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestments.map((inv) => {
                  const progressPercent = ((365 - inv.daysRemaining) / 365) * 100;

                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(inv.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{inv.userName}</p>
                            <p className="text-sm text-muted-foreground">{inv.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.principal)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +{formatCurrency(inv.earnings)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {formatCurrency(inv.earningsAvailable)}
                      </TableCell>
                      <TableCell>
                        <div className="w-32 space-y-1">
                          <Progress value={progressPercent} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {inv.daysRemaining > 0 ? `${inv.daysRemaining} dias restantes` : "Desbloqueado"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {inv.status === "active" ? (
                            <Lock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Wallet className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">{formatDate(inv.unlockDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
