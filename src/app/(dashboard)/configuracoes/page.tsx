"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Settings,
  Save,
  Shield,
  Bell,
  Wallet,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Database,
  Server,
  Key,
  Mail,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Mock settings
const initialSettings = {
  // Geral
  general: {
    siteName: "PrimeBet",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    language: "pt-BR",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    requireKYC: false,
    minAge: 18,
    gameColumns: 3 as 1 | 2 | 3 | 4,
  },
  branding: {
    logoUrl: "/logo-horizontal.png",
    mobileBannerUrl: "",
  },
  // Financeiro - Taxas
  fees: {
    depositFee: 0,
    withdrawalFee: 2.5,
    minWithdrawal: 20,
    maxWithdrawal: 50000,
    minDeposit: 10,
    maxDeposit: 100000,
    pixFee: 0,
    transferFee: 0,
  },
  // Investimentos
  investments: {
    enabled: true,
    yieldRate: 1.0,
    yieldFrequency: "monthly",
    minInvestment: 100,
    maxInvestment: 1000000,
    lockPeriod: 30,
    autoReinvest: false,
    compoundYield: true,
  },
  // Segurança
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    ipWhitelist: false,
    requireStrongPassword: true,
    passwordMinLength: 8,
  },
  // Notificações
  notifications: {
    emailNotifications: true,
    depositConfirmation: true,
    withdrawalConfirmation: true,
    yieldNotification: true,
    marketingEmails: false,
    adminAlerts: true,
    lowBalanceAlert: 1000,
  },
  // Sistema
  system: {
    databaseUrl: "postgresql://***@db.primebet.com:5432/primebet",
    redisUrl: "redis://***@redis.primebet.com:6379",
    apiRateLimit: 100,
    cacheEnabled: true,
    logLevel: "info",
    debugMode: false,
  },
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar configurações da API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          // Mesclar com valores padrão para garantir que todos os campos existam
          setSettings(prev => ({
            ...prev,
            general: { ...prev.general, ...data.general },
            branding: { ...prev.branding, ...data.branding },
            fees: { ...prev.fees, ...data.fees },
            investments: { ...prev.investments, ...data.investments },
            security: { ...prev.security, ...data.security },
            notifications: { ...prev.notifications, ...data.notifications },
            system: { ...prev.system, ...data.system },
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = <
    K extends keyof typeof settings,
    NK extends keyof (typeof settings)[K]
  >(
    category: K,
    key: NK,
    value: unknown
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setHasChanges(false);
      } else {
        console.error("Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBrandingUpload = async (
    file: File | null,
    field: "logoUrl" | "mobileBannerUrl"
  ) => {
    if (!file) return;
    setUploadError(null);
    const isLogo = field === "logoUrl";
    isLogo ? setUploadingLogo(true) : setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", isLogo ? "branding/logo" : "branding/banner");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha no upload");
      }

      updateSetting("branding", field, data.url);
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      isLogo ? setUploadingLogo(false) : setUploadingBanner(false);
    }
  };

  const resetBrandingField = (field: "logoUrl" | "mobileBannerUrl") => {
    const fallback = field === "logoUrl" ? "/logo-horizontal.png" : "";
    updateSetting("branding", field, fallback);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-500 border-orange-500">
              Alterações não salvas
            </Badge>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="general" className="gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Taxas</span>
          </TabsTrigger>
          <TabsTrigger value="investments" className="gap-1">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Investimentos</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações Básicas</CardTitle>
                <CardDescription>
                  Configurações gerais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Plataforma</Label>
                  <Input
                    value={settings.general.siteName}
                    onChange={(e) =>
                      updateSetting("general", "siteName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) =>
                      updateSetting("general", "timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Bahia">Bahia (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) =>
                      updateSetting("general", "currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar (US$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idade Mínima</Label>
                  <Input
                    type="number"
                    value={settings.general.minAge}
                    onChange={(e) =>
                      updateSetting("general", "minAge", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colunas de Jogos na Home</Label>
                  <Select
                    value={String(settings.general.gameColumns)}
                    onValueChange={(value) =>
                      updateSetting("general", "gameColumns", parseInt(value) as 1 | 2 | 3 | 4)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Coluna</SelectItem>
                      <SelectItem value="2">2 Colunas</SelectItem>
                      <SelectItem value="3">3 Colunas</SelectItem>
                      <SelectItem value="4">4 Colunas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Quantidade de jogos por linha na home da bet
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Controle de Acesso</CardTitle>
                <CardDescription>
                  Configurações de registro e verificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Novos Registros</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários podem criar contas
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.allowRegistration}
                    onCheckedChange={(checked) =>
                      updateSetting("general", "allowRegistration", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verificação de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir confirmação por email
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      updateSetting("general", "requireEmailVerification", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>KYC Obrigatório</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir verificação de documentos
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.requireKYC}
                    onCheckedChange={(checked) =>
                      updateSetting("general", "requireKYC", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-orange-600">Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear acesso ao site
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting("general", "maintenanceMode", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Identidade Visual</CardTitle>
                <CardDescription>
                  Faça o upload do logo e do banner mobile para o lobby
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertTitle>Falha no upload</AlertTitle>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label>Logo principal</Label>
                    <p className="text-sm text-muted-foreground">
                      Use PNG/SVG com fundo transparente. Tamanho sugerido 400x120px.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-40 overflow-hidden rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 flex items-center justify-center">
                        {settings.branding.logoUrl ? (
                          <Image
                            src={settings.branding.logoUrl}
                            alt="Logo atual"
                            fill
                            className="object-contain p-2"
                            sizes="160px"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-xs text-muted-foreground">
                            <ImageIcon className="h-5 w-5 mb-1" />
                            Sem logo
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={logoInputRef}
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            handleBrandingUpload(event.target.files?.[0] || null, "logoUrl");
                            event.target.value = "";
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploadingLogo ? "Enviando..." : "Enviar novo"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!settings.branding.logoUrl}
                          onClick={() => resetBrandingField("logoUrl")}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Banner mobile (320x131)</Label>
                    <p className="text-sm text-muted-foreground">
                      Recomendado enviar 1080x450px para melhor nitidez. Será adaptado para 320x131.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-full max-w-xs aspect-[320/131] overflow-hidden rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 flex items-center justify-center">
                        {settings.branding.mobileBannerUrl ? (
                          <Image
                            src={settings.branding.mobileBannerUrl}
                            alt="Banner mobile"
                            fill
                            className="object-cover"
                            sizes="260px"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-xs text-muted-foreground px-4 text-center">
                            <ImageIcon className="h-5 w-5 mb-1" />
                            Nenhum banner cadastrado
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={bannerInputRef}
                          id="banner-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            handleBrandingUpload(event.target.files?.[0] || null, "mobileBannerUrl");
                            event.target.value = "";
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={uploadingBanner}
                          onClick={() => bannerInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploadingBanner ? "Enviando..." : "Enviar banner"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!settings.branding.mobileBannerUrl}
                          onClick={() => resetBrandingField("mobileBannerUrl")}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fees Settings */}
        <TabsContent value="fees" className="space-y-4 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Alterações nas taxas entram em vigor imediatamente para novas transações.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxas de Depósito</CardTitle>
                <CardDescription>
                  Configurações para depósitos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxa de Depósito (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.fees.depositFee}
                    onChange={(e) =>
                      updateSetting("fees", "depositFee", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depósito Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.fees.minDeposit}
                    onChange={(e) =>
                      updateSetting("fees", "minDeposit", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depósito Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.fees.maxDeposit}
                    onChange={(e) =>
                      updateSetting("fees", "maxDeposit", parseFloat(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxas de Saque</CardTitle>
                <CardDescription>
                  Configurações para saques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxa de Saque (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.fees.withdrawalFee}
                    onChange={(e) =>
                      updateSetting("fees", "withdrawalFee", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saque Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.fees.minWithdrawal}
                    onChange={(e) =>
                      updateSetting("fees", "minWithdrawal", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saque Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.fees.maxWithdrawal}
                    onChange={(e) =>
                      updateSetting("fees", "maxWithdrawal", parseFloat(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Investments Settings */}
        <TabsContent value="investments" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações de Rendimento</CardTitle>
                <CardDescription>
                  Define como os investimentos rendem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Módulo Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar investimentos
                    </p>
                  </div>
                  <Switch
                    checked={settings.investments.enabled}
                    onCheckedChange={(checked) =>
                      updateSetting("investments", "enabled", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Taxa de Rendimento Mensal (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.investments.yieldRate}
                    onChange={(e) =>
                      updateSetting("investments", "yieldRate", parseFloat(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Rendimento ao mês aplicado sobre o saldo investido
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Frequência de Pagamento</Label>
                  <Select
                    value={settings.investments.yieldFrequency}
                    onValueChange={(value) =>
                      updateSetting("investments", "yieldFrequency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período de Lock (dias)</Label>
                  <Input
                    type="number"
                    value={settings.investments.lockPeriod}
                    onChange={(e) =>
                      updateSetting("investments", "lockPeriod", parseInt(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo mínimo que o valor deve ficar investido
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Limites de Investimento</CardTitle>
                <CardDescription>
                  Define valores mínimos e máximos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Investimento Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.investments.minInvestment}
                    onChange={(e) =>
                      updateSetting("investments", "minInvestment", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Investimento Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.investments.maxInvestment}
                    onChange={(e) =>
                      updateSetting("investments", "maxInvestment", parseFloat(e.target.value))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Reinvestir</Label>
                    <p className="text-sm text-muted-foreground">
                      Reinvestir rendimentos automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.investments.autoReinvest}
                    onCheckedChange={(checked) =>
                      updateSetting("investments", "autoReinvest", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Juros Compostos</Label>
                    <p className="text-sm text-muted-foreground">
                      Calcular juros sobre juros
                    </p>
                  </div>
                  <Switch
                    checked={settings.investments.compoundYield}
                    onCheckedChange={(checked) =>
                      updateSetting("investments", "compoundYield", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Alterações nas configurações de segurança podem afetar o acesso de administradores.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autenticação</CardTitle>
                <CardDescription>
                  Configurações de login e sessão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação em Duas Etapas (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para admins
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "twoFactorEnabled", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Timeout de Sessão (minutos)</Label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSetting("security", "sessionTimeout", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Tentativas de Login</Label>
                  <Input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração do Bloqueio (minutos)</Label>
                  <Input
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) =>
                      updateSetting("security", "lockoutDuration", parseInt(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Políticas de Senha</CardTitle>
                <CardDescription>
                  Requisitos de segurança para senhas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exigir Senha Forte</Label>
                    <p className="text-sm text-muted-foreground">
                      Letras, números e símbolos
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.requireStrongPassword}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "requireStrongPassword", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Tamanho Mínimo da Senha</Label>
                  <Input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSetting("security", "passwordMinLength", parseInt(e.target.value))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Whitelist de IPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Restringir acesso por IP
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.ipWhitelist}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "ipWhitelist", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notificações por Email</CardTitle>
                <CardDescription>
                  Configure emails automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Emails Ativados</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações por email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "emailNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmação de Depósito</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando depositado
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.depositConfirmation}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "depositConfirmation", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmação de Saque</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando sacado
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.withdrawalConfirmation}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "withdrawalConfirmation", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rendimento Creditado</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar rendimentos
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.yieldNotification}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "yieldNotification", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertas do Admin</CardTitle>
                <CardDescription>
                  Notificações para administradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas críticos
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.adminAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "adminAlerts", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Alerta de Saldo Baixo (R$)</Label>
                  <Input
                    type="number"
                    value={settings.notifications.lowBalanceAlert}
                    onChange={(e) =>
                      updateSetting("notifications", "lowBalanceAlert", parseFloat(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alertar quando o saldo da conta principal estiver abaixo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configurações Avançadas</AlertTitle>
            <AlertDescription>
              Estas configurações são técnicas e podem afetar o funcionamento do sistema.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conexões</CardTitle>
                <CardDescription>
                  URLs de banco de dados e cache
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database URL
                  </Label>
                  <Input
                    value={settings.system.databaseUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Conectado</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Redis URL
                  </Label>
                  <Input
                    value={settings.system.redisUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Conectado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance</CardTitle>
                <CardDescription>
                  Configurações de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rate Limit da API (req/min)</Label>
                  <Input
                    type="number"
                    value={settings.system.apiRateLimit}
                    onChange={(e) =>
                      updateSetting("system", "apiRateLimit", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Melhorar performance
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.cacheEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("system", "cacheEnabled", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Nível de Log</Label>
                  <Select
                    value={settings.system.logLevel}
                    onValueChange={(value) =>
                      updateSetting("system", "logLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-orange-600">Modo Debug</Label>
                    <p className="text-sm text-muted-foreground">
                      Logs detalhados (performance reduzida)
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) =>
                      updateSetting("system", "debugMode", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
