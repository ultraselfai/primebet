"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowDownLeft, ArrowUpRight, RefreshCw, Loader2, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

// Tabela de níveis de resgate
const rescueLevels = [
  { level: 1, minLoss: 10, rate: 10 },
  { level: 2, minLoss: 1000, rate: 11 },
  { level: 3, minLoss: 5000, rate: 12 },
  { level: 4, minLoss: 10000, rate: 13 },
  { level: 5, minLoss: 50000, rate: 15 },
  { level: 6, minLoss: 100000, rate: 25 },
  { level: 7, minLoss: 500000, rate: 50 },
];

export default function CarteiraPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, balance, refreshBalance, openAuthModal } = useBetAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dados de resgate - zerados até integrar com API
  const [rescueData] = useState({
    currentLoss: 0,
    expectedRescueFunds: 0,
    pastLoss: 0,
    availableRescueFunds: 0,
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, openAuthModal, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatMinLoss = (value: number) => {
    if (value >= 1000) {
      return `R$ ≥${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    return `R$ ≥${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#000018] flex items-center justify-center relative overflow-hidden">
        {/* Blur effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#0246FF]/20 rounded-full blur-[150px]" />
        <Loader2 className="w-8 h-8 animate-spin text-[#0246FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000018] pb-24 relative overflow-hidden">
      {/* Background blur effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0246FF]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-[300px] h-[300px] bg-[#0246FF]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[200px] h-[200px] bg-[#00a8ff]/10 rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/5">
          <Link href="/" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Carteira</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white/70 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </header>

        {/* Saldo Principal Card */}
        <div className="px-4 pt-4 relative z-30">
          <div 
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0246FF 0%, #0033CC 50%, #001a80 100%)",
              boxShadow: "0 8px 32px rgba(2, 70, 255, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Saldo Disponível</span>
              </div>
              <p className="text-4xl font-bold text-white mb-5 tracking-tight">
                {formatCurrency(balance)}
              </p>
              
              {/* Botões Depositar e Sacar */}
              <div className="flex gap-3">
                <Link href="/depositar" className="flex-1">
                  <Button 
                    className="w-full h-12 font-bold text-base border-0"
                    style={{
                      background: "linear-gradient(135deg, #00faff 0%, #00a8ff 100%)",
                      color: "#000018",
                    }}
                  >
                    <ArrowDownLeft className="w-5 h-5 mr-2" />
                    Depositar
                  </Button>
                </Link>
                <Link href="/sacar" className="flex-1">
                  <Button 
                    className="w-full h-12 font-bold text-base border-0"
                    style={{
                      background: "linear-gradient(135deg, #1AF281 0%, #0fd06a 50%, #0ab85c 100%)",
                      color: "#000018",
                      boxShadow: "0 4px 16px rgba(26, 242, 129, 0.3)",
                    }}
                  >
                    <ArrowUpRight className="w-5 h-5 mr-2" />
                    Sacar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Resgatar */}
        <div className="px-4">
          {/* Banner Resgatar - Sobe para ficar atrás do card de saldo */}
          <div className="relative w-full h-[480px] -mt-32 -mb-40 z-0">
            <Image
              src="/resgatar.png"
              alt="Fundos de Resgate"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>

          {/* Card Perda Atual - Sobe para sobrepor o banner */}
          <div className="relative z-20 rounded-xl p-4 mb-3 bg-[#1a1520] border border-[#3d2a1a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#c97b35]/30 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-[#c97b35]" />
                </div>
                <span className="text-white font-medium">Perda Atual</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/30 mx-2">|</span>
                <span className="text-white font-semibold">R$ {rescueData.currentLoss}</span>
              </div>
            </div>
            
            <div className="pl-1">
              <p className="text-white/50 text-sm">Fundos de Resgate Previstos</p>
              <p className="text-white font-bold text-lg">R$ {rescueData.expectedRescueFunds}</p>
            </div>
          </div>

          {/* Card Perda Passada - Fundo sólido escuro */}
          <div className="rounded-xl p-4 mb-6 bg-[#18161c] border border-[#2a2530]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#8a7a60]/30 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-[#a89070]" />
                </div>
                <span className="text-white/90 font-medium">Perda Passada</span>
              </div>
              <span className="text-white font-semibold">R$ {rescueData.pastLoss}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm mb-1">Fundos de Resgate Disponíveis</p>
                <p className="text-white font-bold text-lg">R$ {rescueData.availableRescueFunds}</p>
              </div>
              <Button 
                disabled={rescueData.availableRescueFunds <= 0}
                className="bg-[#2a2530] hover:bg-[#3a3540] text-white/60 border border-[#3a3540] disabled:opacity-40"
              >
                Receber
              </Button>
            </div>
          </div>

          {/* Tabela de Fundos de Resgate */}
          <div className="rounded-xl overflow-hidden mb-6">
            {/* Header da tabela - laranja */}
            <div 
              className="flex items-center gap-3 p-4"
              style={{
                background: "linear-gradient(135deg, #c97b35 0%, #a86520 100%)",
              }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-bold text-base">Tabela de Fundos de Resgate</h3>
            </div>

            {/* Cabeçalho colunas */}
            <div className="grid grid-cols-3 text-center py-3 bg-[#1a1520] border-b border-[#2a2530]">
              <span className="text-white/70 text-sm font-medium">Nível</span>
              <span className="text-white/70 text-sm font-medium">Perda no Jogo</span>
              <span className="text-white/70 text-sm font-medium">Taxa de Resgate</span>
            </div>

            {/* Linhas da tabela */}
            <div className="bg-[#12101a]">
              {rescueLevels.map((level, index) => (
                <div 
                  key={level.level}
                  className={cn(
                    "grid grid-cols-3 text-center py-3 border-b border-[#1a1820]",
                    index % 2 === 0 ? "bg-[#15131d]" : "bg-[#12101a]"
                  )}
                >
                  <span className="text-white/60 text-sm">{level.level}</span>
                  <span className="text-white/60 text-sm">{formatMinLoss(level.minLoss)}</span>
                  <span className="text-white/60 text-sm">{level.rate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Descrição da Atividade */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="px-4 text-white/60 text-sm font-medium">Descrição da Atividade</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="space-y-3 text-white/50 text-sm leading-relaxed">
              <p>
                <span className="text-white/70 font-medium">1.</span> Perda no Jogo = Perda na Conta - Montante Dado.
              </p>
              <p>
                <span className="text-white/70 font-medium">2.</span> Os Fundos de Resgate são calculados diariamente de acordo com a tabela e podem ser solicitados no dia seguinte.
              </p>
              <p>
                <span className="text-white/70 font-medium">3.</span> Se um usuário não solicitar os Fundos de Resgate hoje, será considerado como tendo desistido.
              </p>
              <p>
                <span className="text-white/70 font-medium">4.</span> O objetivo de estabelecer os Fundos de Resgate é ajudar os usuários a se recuperarem no jogo, portanto, é necessário um volume de negócios de 1x.
              </p>
              <p>
                <span className="text-white/70 font-medium">5.</span> Horário brasileiro 00:00 é o horário de liquidação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
