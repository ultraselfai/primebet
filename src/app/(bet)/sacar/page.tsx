"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, AlertCircle, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

export default function SacarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, balance, balanceLoading, openAuthModal } = useBetAuth();
  
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [step, setStep] = useState<"amount" | "confirm" | "success">("amount");
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, openAuthModal, router]);

  // Saldo disponível vem do contexto
  const saldoDisponivel = balance;

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
  const isValidAmount = numericAmount >= 20 && numericAmount <= saldoDisponivel;

  const handleContinue = () => {
    if (isValidAmount && pixKey.length > 5) {
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    // TODO: Integrar com API
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Saque Solicitado!</h1>
        <p className="text-white/60 text-center mb-2">
          Sua solicitação foi enviada com sucesso.
        </p>
        <p className="text-white/40 text-sm text-center mb-8">
          O valor será creditado em até 24 horas úteis.
        </p>

        <div className="w-full max-w-sm p-4 rounded-xl bg-white/5 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white/60">Valor</span>
            <span className="text-white font-medium">R$ {amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Chave PIX</span>
            <span className="text-white font-medium text-sm">{pixKey}</span>
          </div>
        </div>

        <Link href="/carteira" className="w-full max-w-sm">
          <Button className={cn(
            "w-full h-12 font-semibold",
            "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
            "text-[#0a1628]"
          )}>
            Voltar para Carteira
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setStep("amount")} className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Confirmar Saque</h1>
          <div className="w-6" />
        </header>

        <div className="flex-1 p-6">
          <div className="text-center mb-8">
            <p className="text-white/60 text-sm mb-1">Valor do saque</p>
            <p className="text-4xl font-bold text-white">R$ {amount}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white/60 text-sm mb-1">Chave PIX de destino</p>
              <p className="text-white font-medium">{pixKey}</p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-white/70">
                Saques são processados em até 24 horas úteis após a solicitação.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "w-full h-12 font-semibold",
              "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
              "text-[#0a1628]"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Saque"
            )}
          </Button>
          <Button
            onClick={() => setStep("amount")}
            variant="ghost"
            className="w-full h-12 text-white/60 hover:text-white hover:bg-white/5"
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/carteira" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Sacar</h1>
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
            {/* Saldo Disponível */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Saldo disponível para saque</span>
              </div>
              <p className="text-2xl font-bold text-white">
                R$ {saldoDisponivel.toFixed(2).replace(".", ",")}
              </p>
            </div>

        {/* Amount Input */}
        <div className="mb-6">
          <Label className="text-white/60 text-sm mb-2 block">Valor do saque</Label>
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
          <p className="text-white/40 text-xs mt-2">Saque mínimo: R$ 20,00</p>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[20, 50, 100].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value.toFixed(2).replace(".", ","))}
              disabled={value > saldoDisponivel}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition",
                value <= saldoDisponivel
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              R$ {value}
            </button>
          ))}
          <button
            onClick={() => setAmount(saldoDisponivel.toFixed(2).replace(".", ","))}
            className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap bg-[#00faff]/20 text-[#00faff] hover:bg-[#00faff]/30 transition"
          >
            Sacar tudo
          </button>
        </div>

        {/* PIX Key */}
        <div className="mb-6">
          <Label className="text-white/60 text-sm mb-2 block">Chave PIX</Label>
          <Input
            type="text"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className={cn(
              "h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30",
              "focus:border-[#00faff] focus:ring-[#00faff]/20"
            )}
          />
        </div>

        {/* Warning */}
        {numericAmount > saldoDisponivel && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              Valor maior que o saldo disponível. O saldo investido não pode ser sacado diretamente.
            </p>
          </div>
        )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleContinue}
              disabled={!isValidAmount || pixKey.length < 5}
              className={cn(
                "w-full h-12 text-base font-semibold",
                "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
                "text-[#0a1628]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Continuar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
