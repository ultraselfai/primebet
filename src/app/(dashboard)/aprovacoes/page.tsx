"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Wallet,
  ArrowUpFromLine,
  AlertTriangle,
  Ban,
  Send,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mock withdrawal requests
const mockWithdrawals = [
  {
    id: "1",
    userId: "user_1",
    userName: "João Silva",
    userEmail: "joao@email.com",
    pixKey: "joao@email.com",
    pixType: "email",
    amount: 500.00,
    type: "game", // game ou investment
    status: "pending",
    requestedAt: "2024-11-28T14:30:00",
    userBalance: 1250.50,
    userKyc: "verified",
  },
  {
    id: "2",
    userId: "user_4",
    userName: "Ana Costa",
    userEmail: "ana@email.com",
    pixKey: "321.654.987-00",
    pixType: "cpf",
    amount: 150.00,
    type: "investment", // rendimentos
    status: "pending",
    requestedAt: "2024-11-28T12:00:00",
    userBalance: 3200.00,
    userKyc: "verified",
  },
  {
    id: "3",
    userId: "user_2",
    userName: "Maria Santos",
    userEmail: "maria@email.com",
    pixKey: "(21) 98888-5678",
    pixType: "phone",
    amount: 200.00,
    type: "game",
    status: "pending",
    requestedAt: "2024-11-28T10:15:00",
    userBalance: 500.00,
    userKyc: "pending",
  },
  {
    id: "4",
    userId: "user_5",
    userName: "Pedro Mendes",
    userEmail: "pedro@email.com",
    pixKey: "abc123-def456-ghi789",
    pixType: "random",
    amount: 1000.00,
    type: "game",
    status: "approved",
    requestedAt: "2024-11-27T16:00:00",
    processedAt: "2024-11-27T16:30:00",
    userBalance: 2500.00,
    userKyc: "verified",
  },
  {
    id: "5",
    userId: "user_6",
    userName: "Lucas Ferreira",
    userEmail: "lucas@email.com",
    pixKey: "lucas@email.com",
    pixType: "email",
    amount: 300.00,
    type: "game",
    status: "rejected",
    requestedAt: "2024-11-27T14:00:00",
    processedAt: "2024-11-27T14:15:00",
    rejectionReason: "KYC não verificado",
    userBalance: 800.00,
    userKyc: "pending",
  },
];

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  approved: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
  rejected: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
  processing: { label: "Processando", variant: "outline" as const, icon: Clock },
};

const typeConfig = {
  game: { label: "Jogo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  investment: { label: "Rendimentos", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export default function AprovacoesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<typeof mockWithdrawals[0] | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Stats
  const pendingCount = mockWithdrawals.filter((w) => w.status === "pending").length;
  const pendingAmount = mockWithdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + w.amount, 0);
  const approvedToday = mockWithdrawals.filter((w) => w.status === "approved").length;
  const approvedAmount = mockWithdrawals
    .filter((w) => w.status === "approved")
    .reduce((acc, w) => acc + w.amount, 0);

  // Filter
  const filteredWithdrawals = mockWithdrawals.filter((w) => {
    const matchesSearch =
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesType = typeFilter === "all" || w.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = async () => {
    setIsProcessing(true);
    // TODO: API call to approve and trigger PIX payment
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Approving withdrawal:", selectedWithdrawal?.id);
    setIsProcessing(false);
    setReviewDialogOpen(false);
    setSelectedWithdrawal(null);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    // TODO: API call to reject and return funds
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Rejecting withdrawal:", selectedWithdrawal?.id, "Reason:", rejectionReason);
    setIsProcessing(false);
    setReviewDialogOpen(false);
    setSelectedWithdrawal(null);
    setRejectionReason("");
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aprovações de Saque</h1>
          <p className="text-muted-foreground">
            Revise e processe as solicitações de saque
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingAmount)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedToday}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(approvedAmount)} enviado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saques de Jogo</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockWithdrawals.filter((w) => w.type === "game" && w.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendimentos</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockWithdrawals.filter((w) => w.type === "investment" && w.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Saque</CardTitle>
          <CardDescription>
            Revise e aprove ou rejeite as solicitações
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
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="game">Jogo</SelectItem>
                <SelectItem value="investment">Rendimentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => {
                  const status = statusConfig[withdrawal.status as keyof typeof statusConfig];
                  const type = typeConfig[withdrawal.type as keyof typeof typeConfig];

                  return (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(withdrawal.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{withdrawal.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                          {type.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-mono">{withdrawal.pixKey}</p>
                          <p className="text-muted-foreground capitalize">{withdrawal.pixType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(withdrawal.requestedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={withdrawal.status === "pending" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {withdrawal.status === "pending" ? "Revisar" : "Ver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Revisar Saque</DialogTitle>
            <DialogDescription>
              Verifique os dados e processe a solicitação
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedWithdrawal.userName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.userEmail}</p>
                  <Badge
                    variant={selectedWithdrawal.userKyc === "verified" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    KYC: {selectedWithdrawal.userKyc === "verified" ? "Verificado" : "Pendente"}
                  </Badge>
                </div>
              </div>

              {/* Withdrawal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Valor</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Saldo Atual</Label>
                  <p className="text-lg">{formatCurrency(selectedWithdrawal.userBalance)}</p>
                </div>
              </div>

              {/* PIX Info */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <Label className="text-muted-foreground">Chave PIX</Label>
                <p className="font-mono text-lg">{selectedWithdrawal.pixKey}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  Tipo: {selectedWithdrawal.pixType}
                </p>
              </div>

              {/* Warnings */}
              {selectedWithdrawal.userKyc !== "verified" && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-600">
                    Atenção: O usuário ainda não completou a verificação KYC.
                  </p>
                </div>
              )}

              {/* Rejection reason for rejected */}
              {selectedWithdrawal.status === "rejected" && selectedWithdrawal.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <Label className="text-red-600">Motivo da Rejeição:</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedWithdrawal.rejectionReason}</p>
                </div>
              )}

              {/* Actions for pending */}
              {selectedWithdrawal.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label>Motivo da Rejeição (se aplicável)</Label>
                    <Textarea
                      placeholder="Descreva o motivo caso rejeite..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReviewDialogOpen(false)}
                      disabled={isProcessing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectionReason || isProcessing}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button onClick={handleApprove} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Aprovar e Enviar PIX
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selectedWithdrawal.status !== "pending" && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
