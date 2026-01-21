"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Percent,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Save,
  RefreshCw,
  UserPlus,
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
import { toast } from "sonner";

interface CommissionConfig {
  id: string;
  minDepositAmount: string;
  commissionPercent: string;
  isActive: boolean;
  updatedAt: string;
}

interface Influencer {
  id: string;
  playerId: string | null;
  name: string;
  email: string;
  referralCode: string | null;
  referralsCount: number;
  totalDeposits: string;
  commissionEarned: string;
  commissionPaid: string;
  commissionPending: string;
  createdAt: string;
}

interface Stats {
  totalInfluencers: number;
  totalReferrals: number;
  totalDeposits: string;
  totalCommissionEarned: string;
  totalCommissionPending: string;
}

export default function AssociadosAdminPage() {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [minDeposit, setMinDeposit] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar config e influencers em paralelo
      const [configRes, influencersRes] = await Promise.all([
        fetch("/api/admin/commission"),
        fetch("/api/admin/influencers"),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.success) {
          setConfig(configData.data);
          setMinDeposit(configData.data.minDepositAmount);
          setCommissionPercent(configData.data.commissionPercent);
        }
      }

      if (influencersRes.ok) {
        const influencersData = await influencersRes.json();
        if (influencersData.success) {
          setInfluencers(influencersData.data.influencers);
          setStats(influencersData.data.stats);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDepositAmount: minDeposit,
          commissionPercent: commissionPercent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        toast.success("Configuração salva com sucesso!");
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/cadastro?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associados (Influenciadores)</h1>
          <p className="text-muted-foreground">
            Gerencie os influenciadores e regras de comissão
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Configuração de Comissão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Regra de Comissionamento
          </CardTitle>
          <CardDescription>
            Configure o valor mínimo de depósitos e o percentual de comissão para os influenciadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Valor Mínimo de Depósito (R$)</label>
              <Input
                type="number"
                placeholder="100"
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O indicado precisa depositar pelo menos esse valor para gerar comissão
              </p>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Percentual de Comissão (%)</label>
              <Input
                type="number"
                placeholder="10"
                min="0"
                max="100"
                step="0.1"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Percentual sobre o total depositado pelo indicado
              </p>
            </div>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Regra
            </Button>
          </div>
          {config && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Regra atual:</strong> Depósitos acumulados de{" "}
                <span className="text-primary font-semibold">{formatCurrency(config.minDepositAmount)}</span>{" "}
                pagam <span className="text-primary font-semibold">{config.commissionPercent}%</span> de comissão
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Influenciadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Indicados</CardTitle>
              <UserPlus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Depósitos Gerados</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDeposits)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comissões Geradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissionEarned)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendente Pagamento</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalCommissionPending)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Influenciadores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Influenciadores</CardTitle>
          <CardDescription>
            Para adicionar um influenciador, vá em Usuários e altere o tipo do usuário para &quot;Influenciador&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          {influencers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum influenciador cadastrado ainda</p>
              <p className="text-sm">Vá em Usuários e altere o tipo de um usuário para Influenciador</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influenciador</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-center">Indicados</TableHead>
                    <TableHead className="text-right">Depósitos</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="w-[100px]">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {influencers.map((influencer) => (
                    <TableRow key={influencer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{influencer.name}</p>
                          <p className="text-sm text-muted-foreground">{influencer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {influencer.referralCode || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{influencer.referralsCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(influencer.totalDeposits)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(influencer.commissionEarned)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        {formatCurrency(influencer.commissionPending)}
                      </TableCell>
                      <TableCell>
                        {influencer.referralCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyReferralLink(influencer.referralCode!)}
                          >
                            {copiedCode === influencer.referralCode ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
