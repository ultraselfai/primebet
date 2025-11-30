"use client";

import React, { useState, useEffect } from "react";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  ExternalLink,
  AlertTriangle,
  Gamepad2,
  Wallet,
  Database,
  MessageSquare,
  Eye,
  EyeOff,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface GameProviderStatus {
  success: boolean;
  agentName?: string;
  spinCredits?: number;
  error?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error" | "loading";
  lastSync: string | null;
  stats: Record<string, number> | null;
  errorMessage?: string;
}

export default function IntegracoesPage() {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configIntegration, setConfigIntegration] = useState<string | null>(null);
  
  // Game Provider state
  const [gameProviderStatus, setGameProviderStatus] = useState<GameProviderStatus | null>(null);
  const [gameProviderLoading, setGameProviderLoading] = useState(true);
  const [providerUrl, setProviderUrl] = useState("https://api.ultraself.space/api/v1");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerApiSecret, setProviderApiSecret] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Fetch Game Provider status on mount
  useEffect(() => {
    fetchGameProviderStatus();
  }, []);

  const fetchGameProviderStatus = async () => {
    setGameProviderLoading(true);
    try {
      const response = await fetch("/api/provider/test");
      const data = await response.json();
      setGameProviderStatus(data);
    } catch {
      setGameProviderStatus({ success: false, error: "Erro ao conectar" });
    } finally {
      setGameProviderLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    if (id === "game-provider") {
      await fetchGameProviderStatus();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    setSyncingId(null);
  };

  const openConfigModal = (integrationId: string) => {
    setConfigIntegration(integrationId);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    // Aqui salvaria no banco de dados
    // Por enquanto só fecha o modal
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavingConfig(false);
    setConfigModalOpen(false);
    // Re-testar conexão
    if (configIntegration === "game-provider") {
      await fetchGameProviderStatus();
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Build integrations array with real Game Provider status
  const integrations: Integration[] = [
    {
      id: "game-provider",
      name: "Game Provider (Ultraself)",
      description: "Provedor de jogos - Slots Fortune Tiger, Ox, Rabbit e mais",
      category: "Jogos",
      icon: <Gamepad2 className="w-6 h-6" />,
      status: gameProviderLoading 
        ? "loading" 
        : gameProviderStatus?.success 
          ? "connected" 
          : "error",
      lastSync: new Date().toISOString(),
      stats: gameProviderStatus?.success 
        ? {
            spinCredits: gameProviderStatus.spinCredits || 0,
            jogos: 5,
            ativos: gameProviderStatus.spinCredits && gameProviderStatus.spinCredits > 0 ? 5 : 0,
          }
        : null,
      errorMessage: gameProviderStatus?.error,
    },
    {
      id: "fbspay",
      name: "FBSPAY Banking",
      description: "Gateway de pagamentos PIX - Depósitos e Saques",
      category: "Pagamentos",
      icon: <Wallet className="w-6 h-6" />,
      status: "disconnected",
      lastSync: null,
      stats: null,
    },
    {
      id: "sms",
      name: "SMS Gateway",
      description: "Envio de SMS para verificação e notificações",
      category: "Comunicação",
      icon: <MessageSquare className="w-6 h-6" />,
      status: "disconnected",
      lastSync: null,
      stats: null,
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Monitoramento e métricas de performance",
      category: "Dados",
      icon: <Database className="w-6 h-6" />,
      status: "disconnected",
      lastSync: null,
      stats: null,
    },
  ];

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    connected: { label: "Conectado", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
    disconnected: { label: "Desconectado", variant: "outline", icon: <XCircle className="w-4 h-4" /> },
    error: { label: "Erro", variant: "destructive", icon: <AlertTriangle className="w-4 h-4" /> },
    loading: { label: "Verificando...", variant: "secondary", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  };

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Gerencie as integrações com serviços externos
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {connectedCount} de {integrations.length} conectadas
        </Badge>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration) => {
          const status = statusConfig[integration.status];
          const isSyncing = syncingId === integration.id;

          return (
            <Card key={integration.id} className="relative overflow-hidden">
              {/* Status indicator bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  integration.status === "connected"
                    ? "bg-green-500"
                    : integration.status === "error"
                    ? "bg-red-500"
                    : integration.status === "loading"
                    ? "bg-yellow-500"
                    : "bg-muted"
                }`}
              />

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        integration.status === "connected"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : integration.status === "error"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : integration.status === "loading"
                          ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {integration.category}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={status.variant} className="gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {integration.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error message */}
                {integration.status === "error" && integration.errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {integration.errorMessage}
                    </p>
                  </div>
                )}

                {/* Stats */}
                {integration.status === "connected" && integration.stats && (
                  <div className="grid grid-cols-3 gap-2">
                    {integration.id === "game-provider" && (
                      <>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold text-green-600">
                            {integration.stats.spinCredits?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Créditos</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{integration.stats.jogos}</p>
                          <p className="text-xs text-muted-foreground">Jogos</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{integration.stats.ativos}</p>
                          <p className="text-xs text-muted-foreground">Ativos</p>
                        </div>
                      </>
                    )}
                    {integration.id === "fbspay" && integration.stats && (
                      <>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{integration.stats.depositsToday}</p>
                          <p className="text-xs text-muted-foreground">Depósitos</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{integration.stats.withdrawalsToday}</p>
                          <p className="text-xs text-muted-foreground">Saques</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(integration.stats.volumeToday || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Volume</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Connected info for Game Provider */}
                {integration.id === "game-provider" && integration.status === "connected" && gameProviderStatus?.agentName && (
                  <p className="text-xs text-muted-foreground">
                    Agente: <span className="font-medium">{gameProviderStatus.agentName}</span>
                  </p>
                )}

                {/* Last sync */}
                {integration.lastSync && integration.status === "connected" && (
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: {formatDate(integration.lastSync)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {integration.status === "connected" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncing}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        {isSyncing ? "Sincronizando..." : "Sincronizar"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConfigModal(integration.id)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </>
                  )}
                  {integration.status === "disconnected" && (
                    <Button size="sm" onClick={() => openConfigModal(integration.id)}>
                      <Plug className="w-4 h-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                  {integration.status === "error" && (
                    <>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                        Reconectar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConfigModal(integration.id)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </>
                  )}
                  {integration.status === "loading" && (
                    <Button variant="outline" size="sm" disabled>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Integration */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Plug className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">Adicionar Nova Integração</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Configure integrações com outros serviços
          </p>
          <Button variant="outline">
            Ver Integrações Disponíveis
          </Button>
        </CardContent>
      </Card>

      {/* Configuration Modal - Game Provider */}
      <Dialog open={configModalOpen && configIntegration === "game-provider"} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Configurar Game Provider
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais de conexão com o provedor de jogos Ultraself
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status */}
            {gameProviderStatus?.success && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado como <span className="font-medium">{gameProviderStatus.agentName}</span>
                </div>
              </div>
            )}

            {/* API URL */}
            <div className="space-y-2">
              <Label htmlFor="modal-provider-url">URL da API</Label>
              <Input
                id="modal-provider-url"
                type="text"
                value={providerUrl}
                onChange={(e) => setProviderUrl(e.target.value)}
                placeholder="https://api.ultraself.space/api/v1"
                className="font-mono text-sm"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="modal-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="modal-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  placeholder="ag_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave pública fornecida pelo Game Provider
              </p>
            </div>

            {/* API Secret */}
            <div className="space-y-2">
              <Label htmlFor="modal-api-secret">API Secret</Label>
              <div className="relative">
                <Input
                  id="modal-api-secret"
                  type={showApiSecret ? "text" : "password"}
                  value={providerApiSecret}
                  onChange={(e) => setProviderApiSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave secreta para autenticação. <span className="text-amber-600 dark:text-amber-400">Nunca compartilhe!</span>
              </p>
            </div>

            <Separator />

            {/* Current credentials info */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                As credenciais atuais estão configuradas no arquivo <code className="bg-muted px-1 rounded">.env</code> do servidor.
                Para alterar permanentemente, edite as variáveis:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 font-mono">
                <li>GAME_PROVIDER_URL</li>
                <li>GAME_PROVIDER_API_KEY</li>
                <li>GAME_PROVIDER_SECRET</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {savingConfig ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placeholder modal for other integrations */}
      <Dialog open={configModalOpen && configIntegration !== "game-provider"} onOpenChange={setConfigModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Integração</DialogTitle>
            <DialogDescription>
              Esta integração ainda não está disponível.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Em breve você poderá configurar esta integração.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
