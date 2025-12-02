"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
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

interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  selfieUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
    playerId: string | null;
  };
}

const statusConfig = {
  PENDING: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  APPROVED: { label: "Aprovado", variant: "default" as const, icon: ShieldCheck },
  REJECTED: { label: "Rejeitado", variant: "destructive" as const, icon: ShieldX },
};

export default function KycPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedKyc, setSelectedKyc] = useState<KycDocument | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/kyc?status=${statusFilter}`);
      const data = await res.json();
      
      if (data.success) {
        setDocuments(data.documents);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleApprove = async () => {
    if (!selectedKyc) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedKyc.id,
          action: "approve",
        }),
      });

      if (res.ok) {
        setReviewDialogOpen(false);
        setSelectedKyc(null);
        loadDocuments();
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKyc || !rejectionReason) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedKyc.id,
          action: "reject",
          reason: rejectionReason,
        }),
      });

      if (res.ok) {
        setReviewDialogOpen(false);
        setSelectedKyc(null);
        setRejectionReason("");
        loadDocuments();
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KYC / Verificação</h1>
          <p className="text-muted-foreground">
            Revise e aprove as solicitações de verificação de identidade
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* KYC List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de KYC</CardTitle>
          <CardDescription>
            Clique em uma solicitação para revisar os documentos
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
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="APPROVED">Aprovados</SelectItem>
                <SelectItem value="REJECTED">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma solicitação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const status = statusConfig[doc.status];

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(doc.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{doc.user.name || "Sem nome"}</p>
                              <p className="text-sm text-muted-foreground">{doc.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{doc.documentType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKyc(doc);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Revisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar KYC - {selectedKyc?.user.name}</DialogTitle>
            <DialogDescription>
              Verifique a selfie com documento do usuário
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
            <div className="space-y-6">
              {/* Dados do usuário */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <p className="font-medium">{selectedKyc.user.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">E-mail</Label>
                  <p className="font-medium">{selectedKyc.user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">CPF</Label>
                  <p className="font-medium">{selectedKyc.user.cpf || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telefone</Label>
                  <p className="font-medium">{selectedKyc.user.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Player ID</Label>
                  <p className="font-medium font-mono">{selectedKyc.user.playerId || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo de Documento</Label>
                  <p className="font-medium">{selectedKyc.documentType}</p>
                </div>
              </div>

              {/* Imagem */}
              <div className="space-y-2">
                <Label>Selfie com Documento</Label>
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
                  <Image
                    src={selectedKyc.selfieUrl}
                    alt="Selfie com documento"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {selectedKyc.status === "REJECTED" && selectedKyc.rejectReason && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <Label className="text-red-600">Motivo da Rejeição:</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedKyc.rejectReason}</p>
                </div>
              )}
            </div>
          )}

          {selectedKyc?.status === "PENDING" && (
            <>
              <div className="space-y-2">
                <Label>Motivo da Rejeição (obrigatório para rejeitar)</Label>
                <Textarea
                  placeholder="Ex: Documento ilegível, foto cortada, etc..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeitar
                </Button>
                <Button onClick={handleApprove} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar
                </Button>
              </DialogFooter>
            </>
          )}

          {selectedKyc?.status !== "PENDING" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
