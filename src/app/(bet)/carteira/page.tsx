"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, TrendingUp, 
  History, Wallet, PiggyBank, ChevronRight, RefreshCw,
  Info, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBetAuth } from "@/contexts/bet-auth-context";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

export default function CarteiraPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, balance, refreshBalance, openAuthModal } = useBetAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Dados da carteira - saldo de investimento virá de outra API futuramente
  const [walletInvest] = useState({
    saldoInvestido: 0, // TODO: Integrar com API de investimento
    rendimentoMensal: 0,
    taxaRendimento: 3,
    totalRendido: 0,
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, openAuthModal, router]);

  // Carregar transações
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // TODO: Integrar com API de transações
        // const res = await fetch("/api/wallet/transactions");
        // const data = await res.json();
        // if (data.success) setTransactions(data.transactions);
        setTransactions([]); // Vazio até ter API
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTransactions();
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getTransactionInfo = (type: string) => {
    const info: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      deposit: { label: "Depósito", icon: <ArrowDownLeft className="w-4 h-4" />, color: "text-green-500" },
      withdrawal: { label: "Saque", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-red-500" },
      yield: { label: "Rendimento", icon: <TrendingUp className="w-4 h-4" />, color: "text-[#00faff]" },
      bet_win: { label: "Ganho", icon: <TrendingUp className="w-4 h-4" />, color: "text-green-500" },
      bet_loss: { label: "Aposta", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-red-500" },
      transfer_to_invest: { label: "Investido", icon: <PiggyBank className="w-4 h-4" />, color: "text-purple-500" },
    };
    return info[type] || { label: type, icon: <History className="w-4 h-4" />, color: "text-white" };
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] pb-20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
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

      {/* Saldo Principal */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-[#00faff]/20 to-[#00a8ff]/10 rounded-2xl p-5 border border-[#00faff]/30">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Saldo Disponível</span>
          </div>
          <p className="text-3xl font-bold text-white mb-4">
            {formatCurrency(balance)}
          </p>
          
          <div className="flex gap-3">
            <Link href="/depositar" className="flex-1">
              <Button className={cn(
                "w-full h-11 font-semibold",
                "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
                "text-[#0a1628]"
              )}>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Depositar
              </Button>
            </Link>
            <Link href="/sacar" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full h-11 font-semibold border-[#00faff]/50 text-[#00faff] bg-[#00faff]/10 hover:bg-[#00faff]/20 hover:text-[#00faff]"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Sacar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Saldo Investido */}
      <div className="px-4 mb-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/60">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm">Saldo Investido</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-white/40" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1a2a40] border-white/10 text-white max-w-xs">
                    <p className="text-sm">
                      Seu saldo investido rende automaticamente {walletInvest.taxaRendimento}% ao mês. 
                      Os rendimentos são creditados diariamente.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-[#00faff]/20 text-[#00faff]">
              {walletInvest.taxaRendimento}% ao mês
            </span>
          </div>
          
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(walletInvest.saldoInvestido)}
          </p>
          
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-white/50">Rendimento este mês</span>
            <span className="text-[#00faff] font-medium">
              +{formatCurrency(walletInvest.rendimentoMensal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-white/50 text-xs">Total rendido</p>
              <p className="text-white font-medium">{formatCurrency(walletInvest.totalRendido)}</p>
            </div>
            <Link href="/investir">
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Investir mais
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Transferir entre saldos */}
      <div className="px-4 mb-6">
        <Link href="/transferir">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Transferir Saldo</p>
                <p className="text-white/50 text-sm">Entre jogo e investimento</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </Link>
      </div>

      {/* Histórico */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Histórico</h2>
          {transactions.length > 0 && (
            <Link href="/extrato" className="text-[#00faff] text-sm hover:underline">
              Ver tudo
            </Link>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 text-center">
            <History className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Nenhuma transação ainda</p>
            <p className="text-white/30 text-xs mt-1">Faça um depósito para começar!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const info = getTransactionInfo(tx.type);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      tx.amount > 0 ? "bg-green-500/20" : "bg-white/10"
                    )}>
                      <span className={info.color}>{info.icon}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{info.label}</p>
                      <p className="text-white/40 text-xs">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-semibold",
                    tx.amount > 0 ? "text-green-500" : "text-white/70"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
