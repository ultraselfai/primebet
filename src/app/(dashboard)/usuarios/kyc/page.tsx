"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Image,
  User,
  Calendar,
  AlertTriangle,
  Download,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mock KYC data
const mockKycRequests = [
  {
    id: "1",
    userId: "user_1",
    userName: "João Silva",
    userEmail: "joao@email.com",
    status: "pending",
    submittedAt: "2024-11-28T10:30:00",
    documents: {
      selfie: "/kyc/selfie_1.jpg",
      documentFront: "/kyc/doc_front_1.jpg",
      documentBack: "/kyc/doc_back_1.jpg",
      proofOfAddress: "/kyc/address_1.jpg",
    },
    personalData: {
      fullName: "João Pedro Silva",
      cpf: "123.456.789-00",
      birthDate: "1990-05-15",
      phone: "(11) 99999-1234",
      address: "Rua das Flores, 123 - São Paulo/SP",
    },
  },
  {
    id: "2",
    userId: "user_2",
    userName: "Maria Santos",
    userEmail: "maria@email.com",
    status: "pending",
    submittedAt: "2024-11-28T09:15:00",
    documents: {
      selfie: "/kyc/selfie_2.jpg",
      documentFront: "/kyc/doc_front_2.jpg",
      documentBack: "/kyc/doc_back_2.jpg",
      proofOfAddress: null,
    },
    personalData: {
      fullName: "Maria Clara Santos",
      cpf: "987.654.321-00",
      birthDate: "1985-08-22",
      phone: "(21) 98888-5678",
      address: "Av. Brasil, 456 - Rio de Janeiro/RJ",
    },
  },
  {
    id: "3",
    userId: "user_3",
    userName: "Carlos Oliveira",
    userEmail: "carlos@email.com",
    status: "rejected",
    submittedAt: "2024-11-27T14:00:00",
    reviewedAt: "2024-11-27T16:30:00",
    rejectionReason: "Documento ilegível. Por favor, envie uma foto mais clara.",
    documents: {
      selfie: "/kyc/selfie_3.jpg",
      documentFront: "/kyc/doc_front_3.jpg",
      documentBack: "/kyc/doc_back_3.jpg",
      proofOfAddress: "/kyc/address_3.jpg",
    },
    personalData: {
      fullName: "Carlos Alberto Oliveira",
      cpf: "456.789.123-00",
      birthDate: "1978-12-01",
      phone: "(31) 97777-9012",
      address: "Rua Minas Gerais, 789 - Belo Horizonte/MG",
    },
  },
  {
    id: "4",
    userId: "user_4",
    userName: "Ana Costa",
    userEmail: "ana@email.com",
    status: "approved",
    submittedAt: "2024-11-26T11:00:00",
    reviewedAt: "2024-11-26T14:00:00",
    documents: {
      selfie: "/kyc/selfie_4.jpg",
      documentFront: "/kyc/doc_front_4.jpg",
      documentBack: "/kyc/doc_back_4.jpg",
      proofOfAddress: "/kyc/address_4.jpg",
    },
    personalData: {
      fullName: "Ana Paula Costa",
      cpf: "321.654.987-00",
      birthDate: "1992-03-10",
      phone: "(41) 96666-3456",
      address: "Rua Paraná, 321 - Curitiba/PR",
    },
  },
];

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  approved: { label: "Aprovado", variant: "default" as const, icon: ShieldCheck },
  rejected: { label: "Rejeitado", variant: "destructive" as const, icon: ShieldX },
};

export default function KycPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedKyc, setSelectedKyc] = useState<typeof mockKycRequests[0] | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

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
  const pendingCount = mockKycRequests.filter((k) => k.status === "pending").length;
  const approvedCount = mockKycRequests.filter((k) => k.status === "approved").length;
  const rejectedCount = mockKycRequests.filter((k) => k.status === "rejected").length;

  // Filter
  const filteredRequests = mockKycRequests.filter((kyc) => {
    const matchesSearch =
      kyc.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || kyc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = () => {
    // TODO: API call to approve KYC
    console.log("Approving KYC:", selectedKyc?.id);
    setReviewDialogOpen(false);
    setSelectedKyc(null);
  };

  const handleReject = () => {
    // TODO: API call to reject KYC
    console.log("Rejecting KYC:", selectedKyc?.id, "Reason:", rejectionReason);
    setReviewDialogOpen(false);
    setSelectedKyc(null);
    setRejectionReason("");
  };

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
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
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
                  <TableHead>Documentos</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((kyc) => {
                  const status = statusConfig[kyc.status as keyof typeof statusConfig];
                  const docCount = Object.values(kyc.documents).filter(Boolean).length;

                  return (
                    <TableRow key={kyc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(kyc.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{kyc.userName}</p>
                            <p className="text-sm text-muted-foreground">{kyc.userEmail}</p>
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
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{docCount}/4 docs</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(kyc.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedKyc(kyc);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Revisar
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar KYC - {selectedKyc?.userName}</DialogTitle>
            <DialogDescription>
              Verifique os documentos e dados pessoais do usuário
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Selfie */}
                  <div className="space-y-2">
                    <Label>Selfie com Documento</Label>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <div className="text-center">
                        <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Selfie</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Front */}
                  <div className="space-y-2">
                    <Label>Documento (Frente)</Label>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Doc. Frente</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Back */}
                  <div className="space-y-2">
                    <Label>Documento (Verso)</Label>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Doc. Verso</p>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Address */}
                  <div className="space-y-2">
                    <Label>Comprovante de Endereço</Label>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      {selectedKyc.documents.proofOfAddress ? (
                        <div className="text-center">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Comprovante</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500" />
                          <p className="text-sm text-yellow-600 mt-2">Não enviado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={selectedKyc.personalData.fullName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={selectedKyc.personalData.cpf} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input value={selectedKyc.personalData.birthDate} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={selectedKyc.personalData.phone} disabled />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Endereço</Label>
                    <Input value={selectedKyc.personalData.address} disabled />
                  </div>
                </div>

                {selectedKyc.status === "rejected" && selectedKyc.rejectionReason && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <Label className="text-red-600">Motivo da Rejeição:</Label>
                    <p className="text-sm text-red-600 mt-1">{selectedKyc.rejectionReason}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedKyc?.status === "pending" && (
            <>
              <div className="space-y-2">
                <Label>Motivo da Rejeição (opcional)</Label>
                <Textarea
                  placeholder="Descreva o motivo caso rejeite a solicitação..."
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
                  disabled={!rejectionReason}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </DialogFooter>
            </>
          )}

          {selectedKyc?.status !== "pending" && (
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
