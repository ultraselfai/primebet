"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Shield,
  Bell,
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  LogOut,
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
import { PasswordConfirmationModal } from "@/components/ui/password-confirmation-modal";
import { usePasswordConfirmation } from "@/hooks/use-password-confirmation";
import { toast } from "sonner";
import { logoutAndRedirect } from "@/utils/logout-client";

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
  },
  // Financeiro
  financial: {
    depositFee: 0,
    withdrawalFee: 0,
    minWithdrawal: 20,
    maxWithdrawal: 50000,
    minDeposit: 10,
    maxDeposit: 100000,
    chargeTransactionFee: false,
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
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isOpen, options, openConfirmation, closeConfirmation, confirm } = usePasswordConfirmation();

  // Estados para alteração de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

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
            financial: { ...prev.financial, ...data.financial },
            investments: { ...prev.investments, ...data.investments },
            security: { ...prev.security, ...data.security },
            notifications: { ...prev.notifications, ...data.notifications },
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
    openConfirmation(
      async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
          });
          
          if (res.ok) {
            setHasChanges(false);
            toast.success("Configurações salvas com sucesso!");
          } else {
            toast.error("Erro ao salvar configurações");
          }
        } catch (error) {
          console.error("Erro ao salvar:", error);
          toast.error("Erro ao salvar configurações");
        } finally {
          setSaving(false);
        }
      },
      {
        title: "Salvar configurações",
        description: "Confirme sua senha para salvar as alterações nas configurações do sistema.",
        actionLabel: "Salvar",
      }
    );
  };

  const handleChangePassword = async () => {
    // Validações
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("A nova senha deve ser diferente da atual");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Senha alterada com sucesso! Você será redirecionado para o login.");
        
        // Limpar formulário
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Aguardar 2 segundos e fazer logout
        setTimeout(() => {
          logoutAndRedirect("/admin/login");
        }, 2000);
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-fit">
          <TabsTrigger value="general" className="gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
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
          </div>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial" className="space-y-4 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Alterações nas configurações financeiras entram em vigor imediatamente para novas transações.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Configurações de Gateway */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Configurações do Gateway</CardTitle>
                <CardDescription>
                  Defina como as taxas de transação serão tratadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Cobrar Taxa de Transação do Usuário</Label>
                    <p className="text-sm text-muted-foreground">
                      Se ativado, a taxa do gateway será descontada do valor do depósito/saque do usuário.
                      <br />
                      <span className="text-yellow-600 dark:text-yellow-500">
                        Recomendado: Desativado (a plataforma absorve a taxa)
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={settings.financial.chargeTransactionFee}
                    onCheckedChange={(checked) =>
                      updateSetting("financial", "chargeTransactionFee", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Depósitos</CardTitle>
                <CardDescription>
                  Configurações de valores para depósitos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxa de Depósito (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings.financial.depositFee}
                    onChange={(e) =>
                      updateSetting("financial", "depositFee", parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">Taxa adicional cobrada sobre depósitos (0 = sem taxa)</p>
                </div>
                <div className="space-y-2">
                  <Label>Depósito Mínimo (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.financial.minDeposit}
                    onChange={(e) =>
                      updateSetting("financial", "minDeposit", parseFloat(e.target.value) || 10)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depósito Máximo (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.financial.maxDeposit}
                    onChange={(e) =>
                      updateSetting("financial", "maxDeposit", parseFloat(e.target.value) || 100000)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saques</CardTitle>
                <CardDescription>
                  Configurações de valores para saques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxa de Saque (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings.financial.withdrawalFee}
                    onChange={(e) =>
                      updateSetting("financial", "withdrawalFee", parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">Taxa adicional cobrada sobre saques (0 = sem taxa)</p>
                </div>
                <div className="space-y-2">
                  <Label>Saque Mínimo (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.financial.minWithdrawal}
                    onChange={(e) =>
                      updateSetting("financial", "minWithdrawal", parseFloat(e.target.value) || 20)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saque Máximo (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.financial.maxWithdrawal}
                    onChange={(e) =>
                      updateSetting("financial", "maxWithdrawal", parseFloat(e.target.value) || 50000)
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

          {/* Card de Alteração de Senha */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                Alterar Senha do Administrador
              </CardTitle>
              <CardDescription>
                Altere sua senha de acesso ao painel. Após a alteração, você será desconectado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Digite sua senha atual"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Digite a nova senha"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {passwordForm.newPassword && passwordForm.confirmPassword && 
                passwordForm.newPassword !== passwordForm.confirmPassword && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    As senhas não coincidem
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  variant="default"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Alterar Senha e Sair
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
      </Tabs>

      {/* Modal de confirmação de senha */}
      <PasswordConfirmationModal
        open={isOpen}
        onOpenChange={closeConfirmation}
        onConfirm={confirm}
        {...options}
      />
    </div>
  );
}
