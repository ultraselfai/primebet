"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Wallet,
  Link2,
  Key,
  Shield,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface GatewayData {
  configured: boolean;
  gateway: {
    id: string;
    name: string;
    type: string;
    active: boolean;
    hasPublicKey: boolean;
    hasSecretKey: boolean;
    hasWithdrawKey: boolean;
    publicKeyPreview: string | null;
  } | null;
}

export default function GatewayConfigPage() {
  const router = useRouter();

  // Form state
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [withdrawKey, setWithdrawKey] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // UI state
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWithdrawKey, setShowWithdrawKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gatewayData, setGatewayData] = useState<GatewayData | null>(null);
  const [webhookCopied, setWebhookCopied] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Webhook URLs - Sempre usar URL de produção para cadastrar no PodPay
  // O admin deve copiar estas URLs e cadastrar no painel do PodPay
  const PRODUCTION_URL = "https://primebet.space";
  const webhookTransactionUrl = `${PRODUCTION_URL}/api/webhooks/podpay/transaction`;
  const webhookTransferUrl = `${PRODUCTION_URL}/api/webhooks/podpay/transfer`;

  useEffect(() => {
    fetchGatewayConfig();
  }, []);

  const fetchGatewayConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/gateway");
      if (response.ok) {
        const data = await response.json();
        setGatewayData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configuração do gateway");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhook = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setWebhookCopied(type);
      toast.success("URL copiada para a área de transferência");
      setTimeout(() => setWebhookCopied(null), 2000);
    } catch {
      toast.error("Erro ao copiar URL");
    }
  };

  const validateForm = (): boolean => {
    if (!publicKey.trim()) {
      toast.error("Public Key é obrigatória");
      return false;
    }
    if (!secretKey.trim()) {
      toast.error("Secret Key é obrigatória");
      return false;
    }
    if (!withdrawKey.trim()) {
      toast.error("Withdraw Key é obrigatória");
      return false;
    }
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!adminPassword.trim()) {
      toast.error("Digite sua senha para confirmar");
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/admin/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.trim(),
          secretKey: secretKey.trim(),
          withdrawKey: withdrawKey.trim(),
          adminPassword: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao salvar configuração");
        return;
      }

      // Mostrar resultado do teste de conexão
      if (data.connectionTest?.success) {
        setTestResult({
          success: true,
          message: "Conexão testada com sucesso!",
        });
        toast.success("Gateway configurado e testado com sucesso!");
      } else {
        setTestResult({
          success: false,
          message: data.connectionTest?.error || "Falha no teste de conexão",
        });
        toast.warning("Gateway salvo, mas houve erro no teste de conexão");
      }

      // Limpar campos sensíveis
      setSecretKey("");
      setWithdrawKey("");
      setAdminPassword("");
      setConfirmDialogOpen(false);

      // Recarregar dados
      await fetchGatewayConfig();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/integracoes")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Gateway de Pagamentos</h1>
            </div>
            <p className="text-muted-foreground">
              Configure as credenciais do gateway PodPay para processar PIX
            </p>
          </div>
        </div>
        <Badge
          variant={gatewayData?.configured && gatewayData?.gateway?.active ? "default" : "outline"}
          className="gap-1 w-fit"
        >
          {gatewayData?.configured && gatewayData?.gateway?.active ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Configurado
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Não Configurado
            </>
          )}
        </Badge>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            testResult.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span
            className={
              testResult.success
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }
          >
            {testResult.message}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credenciais do Gateway */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Credenciais PodPay
            </CardTitle>
            <CardDescription>
              Insira as chaves de API fornecidas pelo PodPay para habilitar a integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Public Key */}
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={
                  gatewayData?.gateway?.publicKeyPreview ||
                  "pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Chave pública para identificação
              </p>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={
                    gatewayData?.gateway?.hasSecretKey
                      ? "••••••••••••••••••••••••"
                      : "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  }
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave secreta para autenticação de requisições
              </p>
            </div>

            {/* Withdraw Key */}
            <div className="space-y-2">
              <Label htmlFor="withdrawKey">Withdraw Key</Label>
              <div className="relative">
                <Input
                  id="withdrawKey"
                  type={showWithdrawKey ? "text" : "password"}
                  value={withdrawKey}
                  onChange={(e) => setWithdrawKey(e.target.value)}
                  placeholder={
                    gatewayData?.gateway?.hasWithdrawKey
                      ? "••••••••••••••••••••••••"
                      : "wk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  }
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowWithdrawKey(!showWithdrawKey)}
                >
                  {showWithdrawKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave especial para autorizar saques (transferências PIX)
              </p>
            </div>

            <Separator />

            {/* Current config status */}
            {gatewayData?.configured && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Gateway já configurado
                </p>
                <p className="text-xs text-muted-foreground">
                  Deixe os campos em branco para manter as credenciais atuais, ou preencha
                  todos para atualizar.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveClick}
              disabled={saving || (!publicKey && !secretKey && !withdrawKey)}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardFooter>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              URLs de Webhook
            </CardTitle>
            <CardDescription>
              Configure estas URLs no painel do PodPay para receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction Webhook */}
            <div className="space-y-2">
              <Label>Webhook de Depósitos (Transactions)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookTransactionUrl}
                  className="font-mono text-xs bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyWebhook(webhookTransactionUrl, "transaction")}
                >
                  {webhookCopied === "transaction" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recebe notificações de status de depósitos PIX
              </p>
            </div>

            {/* Transfer Webhook */}
            <div className="space-y-2">
              <Label>Webhook de Saques (Transfers)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookTransferUrl}
                  className="font-mono text-xs bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyWebhook(webhookTransferUrl, "transfer")}
                >
                  {webhookCopied === "transfer" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recebe notificações de status de saques/transferências
              </p>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-medium mb-1">Importante</p>
                  <p className="text-xs">
                    Cadastre estas URLs no painel administrativo do PodPay para que as
                    transações sejam atualizadas automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novos gateways */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Novos gateways em breve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Confirmar Alteração
            </DialogTitle>
            <DialogDescription>
              Para salvar as credenciais do gateway, confirme sua senha de administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Sua Senha</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSave();
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving || !adminPassword}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Salvando..." : "Confirmar e Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
