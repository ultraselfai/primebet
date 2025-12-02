"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  ExternalLink,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
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
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Simulação de configuração FBSPAY
const fbspayConfig = {
  isConnected: true,
  apiUrl: "https://api.dinpayz.com.br",
  clientId: "pb_****_****_1234",
  environment: "production",
  webhookUrl: "https://primebet.com/api/webhooks/fbspay",
  lastSync: "2024-11-28T14:30:00",
};

// Mock balance data
const mockBankingData = {
  balance: 125430.50,
  pendingIn: 3250.00,
  pendingOut: 8500.00,
  todayIn: 45230.00,
  todayOut: 12500.00,
};

export default function BankingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleOpenBanking = () => {
    setShowIframe(true);
    setIframeLoaded(false);
    // Simular carregamento do iframe
    setTimeout(() => setIframeLoaded(true), 2000);
  };

  if (!fbspayConfig.isConnected) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking (FBSPAY)</h1>
          <p className="text-muted-foreground">
            Acesse o painel bancário integrado
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>FBSPAY não configurado</AlertTitle>
          <AlertDescription>
            Configure a integração com o FBSPAY na página de Integrações para acessar o módulo Banking.
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Landmark className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Módulo Banking</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              O módulo Banking permite gerenciar sua conta bancária diretamente do painel administrativo.
              Configure o FBSPAY para desbloquear esta funcionalidade.
            </p>
            <Button asChild>
              <a href="/integracoes">
                <Settings className="h-4 w-4 mr-2" />
                Ir para Integrações
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking (FBSPAY)</h1>
          <p className="text-muted-foreground">
            Gerencie sua conta bancária integrada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Conectado
          </Badge>
          <Badge variant="outline">{fbspayConfig.environment}</Badge>
        </div>
      </div>

      {/* Connection Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Ambiente Seguro</AlertTitle>
        <AlertDescription>
          Conexão criptografada com {fbspayConfig.apiUrl}. 
          Última sincronização: {formatDateTime(fbspayConfig.lastSync)}
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(mockBankingData.balance)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entradas Pendentes</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(mockBankingData.pendingIn)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saídas Pendentes</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(mockBankingData.pendingOut)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recebido Hoje</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(mockBankingData.todayIn)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enviado Hoje</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(mockBankingData.todayOut)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banking Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Painel Bancário FBSPAY</CardTitle>
              <CardDescription>
                Acesse o painel completo para gerenciar transações, conciliação e transferências
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {showIframe && (
                <Button variant="outline" onClick={() => setShowIframe(false)}>
                  Minimizar
                </Button>
              )}
              <Button variant="outline" asChild>
                <a href="https://dashboard.dinpayz.com.br" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!showIframe ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg">
              <Landmark className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Painel FBSPAY</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Clique no botão abaixo para carregar o painel bancário integrado.
                Você poderá ver transações, fazer transferências e gerenciar sua conta.
              </p>
              <Button onClick={handleOpenBanking} size="lg">
                <Lock className="h-4 w-4 mr-2" />
                Acessar Ambiente Seguro
              </Button>
            </div>
          ) : (
            <div className="relative">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 rounded-lg z-10">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Redirecionando para ambiente seguro...
                  </p>
                </div>
              )}
              {/* Iframe placeholder - em produção seria o iframe real */}
              <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center border">
                {iframeLoaded && (
                  <div className="text-center">
                    <Landmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Painel FBSPAY</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Em produção, o painel da Dinpayz será carregado aqui via iframe seguro.
                    </p>
                    <div className="mt-6 p-4 bg-background rounded-lg border max-w-md mx-auto">
                      <p className="text-xs text-muted-foreground mb-2">URL do Iframe:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {fbspayConfig.apiUrl}/dashboard/embed?token=***
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conciliação</CardTitle>
            <CardDescription>
              Verifique transações pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Pendências
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transferência</CardTitle>
            <CardDescription>
              Envie PIX para contas externas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Nova Transferência
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extrato</CardTitle>
            <CardDescription>
              Baixe relatórios da conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerar Extrato
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
