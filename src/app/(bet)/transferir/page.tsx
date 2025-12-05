"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Wallet, PiggyBank, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { usePublicSettings } from "@/contexts/public-settings-context";

type TransferDirection = "jogo-para-investimento" | "investimento-para-jogo";

export default function TransferirPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, balance, balanceLoading, openAuthModal } = useBetAuth();
  const { settings } = usePublicSettings();
  
  // Verificar se investimentos está habilitado
  const enableInvestments = settings?.experience?.features?.enableInvestments ?? true;
  
  const [direction, setDirection] = useState<TransferDirection>("jogo-para-investimento");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, openAuthModal, router]);
  
  // Redirecionar se investimentos estiver desabilitado
  useEffect(() => {
    if (!enableInvestments) {
      router.push("/carteira");
    }
  }, [enableInvestments, router]);

  // Dados da carteira - saldo de jogo vem do contexto, investimento virá de outra API
  const wallet = {
    saldoJogo: balance,
    saldoInvestido: 0, // TODO: Integrar com API de investimento
    taxaRendimento: 3,
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  const numericAmount = parseFloat(amount.replace(".", "").replace(",", ".")) || 0;
  
  const maxAmount = direction === "jogo-para-investimento" 
    ? wallet.saldoJogo 
    : wallet.saldoInvestido;
  
  const isValidAmount = numericAmount >= 10 && numericAmount <= maxAmount;

  const handleTransfer = async () => {
    if (!isValidAmount) return;
    
    setIsLoading(true);
    // TODO: Integrar com API
    setTimeout(() => {
      setIsLoading(false);
      // Redirecionar após sucesso
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/carteira" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Transferir Saldo</h1>
        <div className="w-6" />
      </header>

      {/* Loading state */}
      {(authLoading || balanceLoading) ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
        </div>
      ) : (
        <>
          <div className="flex-1 p-6">
        {/* Direction Toggle */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* From */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                direction === "jogo-para-investimento" 
                  ? "bg-[#00faff]/20" 
                  : "bg-purple-500/20"
              )}>
                {direction === "jogo-para-investimento" ? (
                  <Wallet className="w-6 h-6 text-[#00faff]" />
                ) : (
                  <PiggyBank className="w-6 h-6 text-purple-400" />
                )}
              </div>
              <p className="text-white/60 text-xs mb-1">De</p>
              <p className="text-white font-medium text-sm">
                {direction === "jogo-para-investimento" ? "Saldo Jogo" : "Investido"}
              </p>
              <p className="text-white/40 text-xs">
                R$ {direction === "jogo-para-investimento" 
                  ? wallet.saldoJogo.toFixed(2).replace(".", ",")
                  : wallet.saldoInvestido.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Arrow / Switch Button */}
            <button
              onClick={() => setDirection(
                direction === "jogo-para-investimento" 
                  ? "investimento-para-jogo" 
                  : "jogo-para-investimento"
              )}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>

            {/* To */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                direction === "jogo-para-investimento" 
                  ? "bg-purple-500/20" 
                  : "bg-[#00faff]/20"
              )}>
                {direction === "jogo-para-investimento" ? (
                  <PiggyBank className="w-6 h-6 text-purple-400" />
                ) : (
                  <Wallet className="w-6 h-6 text-[#00faff]" />
                )}
              </div>
              <p className="text-white/60 text-xs mb-1">Para</p>
              <p className="text-white font-medium text-sm">
                {direction === "jogo-para-investimento" ? "Investido" : "Saldo Jogo"}
              </p>
              <p className="text-white/40 text-xs">
                R$ {direction === "jogo-para-investimento" 
                  ? wallet.saldoInvestido.toFixed(2).replace(".", ",")
                  : wallet.saldoJogo.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {direction === "jogo-para-investimento" && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6">
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1a2a40] border-white/10 text-white max-w-xs">
                    <p className="text-sm">
                      Seu saldo investido rende {wallet.taxaRendimento}% ao mês automaticamente!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">Investir seu saldo!</p>
                <p>
                  O saldo investido rende <span className="text-purple-400 font-medium">{wallet.taxaRendimento}% ao mês</span> automaticamente.
                  Os rendimentos são creditados diariamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {direction === "investimento-para-jogo" && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">Atenção</p>
                <p>
                  Ao transferir do investimento para o saldo de jogo, 
                  o valor deixa de render automaticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-6">
          <Label className="text-white/60 text-sm mb-2 block">Valor da transferência</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">
              R$
            </span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={amount}
              onChange={handleAmountChange}
              className={cn(
                "h-16 pl-12 text-2xl font-bold text-center",
                "bg-white/5 border-white/10 text-white placeholder:text-white/30",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
            />
          </div>
          <p className="text-white/40 text-xs mt-2">
            Mínimo: R$ 10,00 • Máximo: R$ {maxAmount.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[10, 50, 100, 200].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value.toFixed(2).replace(".", ","))}
              disabled={value > maxAmount}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition flex-1",
                value <= maxAmount
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              R$ {value}
            </button>
          ))}
          <button
            onClick={() => setAmount(maxAmount.toFixed(2).replace(".", ","))}
            className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition flex-1"
          >
            Tudo
          </button>
        </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleTransfer}
              disabled={!isValidAmount || isLoading}
              className={cn(
                "w-full h-12 text-base font-semibold",
                "bg-gradient-to-r from-purple-500 to-purple-600",
                "hover:from-purple-600 hover:to-purple-700",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Transferindo...
                </>
              ) : (
                "Confirmar Transferência"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
