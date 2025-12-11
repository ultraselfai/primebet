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
  Settings,
  Zap,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  amount: number;
  type: string;
  pixKeyType: string;
  pixKey: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  rejectReason: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    playerId: string | null;
  };
}

interface WithdrawalsData {
  withdrawals: Withdrawal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    pending: { count: number; amount: number };
    today: { count: number; amount: number };
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  PROCESSING: { label: "Processando", variant: "secondary", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  APPROVED: { label: "Aprovado", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  PAID: { label: "Pago", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED: { label: "Rejeitado", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  FAILED: { label: "Falhou", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function SaquesPage() {
  const [data, setData] = useState<WithdrawalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Config states
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(100);
  const [tempLimit, setTempLimit] = useState("100");
  const [configLoading, setConfigLoading] = useState(false);

  // Buscar configuração de aprovação automática
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/public");
      if (response.ok) {
        const data = await response.json();
        const limit = data.financial?.autoApprovalLimit ?? 100;
        setAutoApprovalLimit(limit);
        setTempLimit(String(limit));
      }
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const fetchWithdrawals = useCallback(async () => {
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

      const response = await fetch(`/api/withdrawals?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar saques:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleApprove = async (withdrawal: Withdrawal) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: withdrawal.id, action: "approve" }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Saque aprovado com sucesso!");
        fetchWithdrawals();
      } else {
        toast.error(result.error || "Erro ao aprovar saque");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedWithdrawal.id, 
          action: "reject",
          reason: rejectReason,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Saque rejeitado e saldo devolvido");
        setRejectDialogOpen(false);
        setRejectReason("");
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        toast.error(result.error || "Erro ao rejeitar saque");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(false);
    }
  };

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

  const stats = data?.stats || { pending: { count: 0, amount: 0 }, today: { count: 0, amount: 0 } };

  const handleSaveConfig = async () => {
    const newLimit = parseFloat(tempLimit.replace(/\./g, "").replace(",", "."));
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error("Digite um valor válido");
      return;
    }

    setConfigLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financial: { autoApprovalLimit: newLimit },
        }),
      });

      if (response.ok) {
        setAutoApprovalLimit(newLimit);
        setConfigDialogOpen(false);
        toast.success(`Limite de aprovação automática alterado para R$ ${newLimit.toFixed(2)}`);
      } else {
        toast.error("Erro ao salvar configuração");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Solicitações de Saque</h1>
          <p className="text-muted-foreground">
            Gerencie e aprove as solicitações de saque dos usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setTempLimit(String(autoApprovalLimit));
              setConfigDialogOpen(true);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Aprovação
          </Button>
          <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Info Banner - Auto Approval */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-500/5">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">Aprovação automática ativada:</span>{" "}
              Saques até <span className="font-semibold text-blue-600">R$ {autoApprovalLimit.toFixed(2)}</span> são processados automaticamente.
              Valores acima aparecem aqui para aprovação manual.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saques Pendentes</CardDescription>
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
            <CardDescription>Aprovados Hoje</CardDescription>
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
            <CardDescription>Rejeitados Hoje</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total: R$ 0,00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tempo Médio</CardDescription>
            <CardTitle className="text-2xl">-- min</CardTitle>
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="APPROVED">Aprovados</SelectItem>
            <SelectItem value="PAID">Pagos</SelectItem>
            <SelectItem value="REJECTED">Rejeitados</SelectItem>
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
                  <Skeleton className="h-10 w-32" />
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
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum saque encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.withdrawals.map((withdrawal) => {
                    const status = statusConfig[withdrawal.status] || statusConfig.PENDING;
                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-mono text-sm">
                          {withdrawal.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {withdrawal.user.playerId || withdrawal.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          -{formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[200px] truncate">
                          <span className="text-xs text-muted-foreground mr-1">
                            ({withdrawal.pixKeyType})
                          </span>
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
                              <Button variant="ghost" size="icon" disabled={actionLoading}>
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
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => handleApprove(withdrawal)}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setRejectDialogOpen(true);
                                    }}
                                  >
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
            Mostrando {data.withdrawals.length} de {data.pagination.total} saques
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Saque</DialogTitle>
            <DialogDescription>
              O saldo será devolvido à carteira do usuário.
              {selectedWithdrawal && (
                <span className="block mt-2 font-medium">
                  Valor: {formatCurrency(selectedWithdrawal.amount)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Informe o motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Rejeitar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Aprovação Automática</DialogTitle>
            <DialogDescription>
              Defina o limite para aprovação automática de saques. Saques até esse valor serão processados automaticamente pelo sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Limite de aprovação automática (R$)</Label>
              <Input
                id="limit"
                type="text"
                placeholder="100,00"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saques até R$ {parseFloat(tempLimit.replace(/\./g, "").replace(",", ".")) || 0} serão aprovados automaticamente.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600">
                <strong>Atenção:</strong> Saques automáticos são enviados diretamente para o gateway de pagamento. Certifique-se de que o saldo da conta no gateway é suficiente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={configLoading}
            >
              {configLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
