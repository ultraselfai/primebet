"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, AlertCircle, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { toast } from "sonner";

// Valores rápidos para seleção
const QUICK_VALUES = [10, 20, 40, 50, 60, 100, 200];

// Limite máximo por saque definido pelo gateway PodPay
const PODPAY_MAX_WITHDRAWAL = 2500;

// Tipos de chave PIX
const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

export default function SacarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, balance, balanceLoading, openAuthModal } = useBetAuth();
  
  // Estados do formulário
  const [amount, setAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [step, setStep] = useState<1 | 2 | "success">(1);
  const [isLoading, setIsLoading] = useState(false);
  const [wasAutoApproved, setWasAutoApproved] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Configurações do sistema
  const [minWithdrawal, setMinWithdrawal] = useState(20); // Default, será sobrescrito pela API
  const [maxWithdrawal, setMaxWithdrawal] = useState(50000);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Buscar configurações do sistema
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/public");
        if (response.ok) {
          const data = await response.json();
          if (data.financial) {
            setMinWithdrawal(data.financial.minWithdrawal || 20);
            setMaxWithdrawal(data.financial.maxWithdrawal || 50000);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

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

  const formatCurrencyDisplay = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  const handleQuickAmount = (value: number) => {
    if (value <= saldoDisponivel) {
      setAmount(formatCurrencyDisplay(value));
    }
  };

  const numericAmount = parseFloat(amount.replace(/\./g, "").replace(",", ".")) || 0;

  // Validação para avançar do Step 1
  const validateStep1 = (): boolean => {
    if (!amount || numericAmount === 0) {
      toast.error("Digite um valor para sacar");
      return false;
    }
    
    if (numericAmount < minWithdrawal) {
      toast.error(`O valor mínimo para saque é R$ ${formatCurrencyDisplay(minWithdrawal)}`);
      return false;
    }
    
    // Limite máximo do gateway PodPay (R$ 2.500 por saque)
    if (numericAmount > PODPAY_MAX_WITHDRAWAL) {
      toast.error(`Erro: Saque máximo permitido R$ ${formatCurrencyDisplay(PODPAY_MAX_WITHDRAWAL)}`, {
        description: "O limite máximo por saque é de R$ 2.500,00. Para valores maiores, realize múltiplos saques.",
        duration: 5000,
      });
      return false;
    }
    
    if (numericAmount > maxWithdrawal) {
      toast.error(`O valor máximo para saque é R$ ${formatCurrencyDisplay(maxWithdrawal)}`);
      return false;
    }
    
    if (numericAmount > saldoDisponivel) {
      toast.error("Saldo insuficiente para este saque");
      return false;
    }
    
    return true;
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Validação para confirmar saque
  const validateStep2 = (): boolean => {
    if (!pixKeyType) {
      toast.error("Selecione o tipo de chave PIX");
      return false;
    }
    
    if (!pixKey || pixKey.length < 5) {
      toast.error("Digite uma chave PIX válida");
      return false;
    }
    
    return true;
  };

  const handleConfirmWithdrawal = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/withdrawals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          pixKeyType,
          pixKey,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setWasAutoApproved(result.data?.autoApproved || false);
        setSuccessMessage(result.data?.message || "");
        setStep("success");
      } else {
        toast.error(result.error || "Erro ao solicitar saque");
      }
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      toast.error("Erro ao processar sua solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // TELA DE SUCESSO
  // ============================================
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-6">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          wasAutoApproved ? "bg-green-500/20" : "bg-yellow-500/20"
        )}>
          {wasAutoApproved ? (
            <Check className="w-10 h-10 text-green-500" />
          ) : (
            <Clock className="w-10 h-10 text-yellow-500" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {wasAutoApproved ? "Saque Aprovado!" : "Saque Solicitado!"}
        </h1>
        <p className="text-white/60 text-center mb-2">
          {successMessage || (wasAutoApproved 
            ? "Seu saque foi aprovado automaticamente e está sendo processado." 
            : "Sua solicitação foi enviada para aprovação.")}
        </p>
        <p className="text-white/40 text-sm text-center mb-8">
          {wasAutoApproved 
            ? "O valor será creditado em alguns minutos." 
            : "O valor será creditado após aprovação (até 24 horas úteis)."}
        </p>

        <div className="w-full max-w-sm p-4 rounded-xl bg-white/5 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white/60">Valor</span>
            <span className="text-white font-medium">R$ {amount}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-white/60">Tipo de Chave</span>
            <span className="text-white font-medium">
              {PIX_KEY_TYPES.find(t => t.value === pixKeyType)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Chave PIX</span>
            <span className="text-white font-medium text-sm truncate max-w-[180px]">{pixKey}</span>
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

  // ============================================
  // STEP 2 - DADOS PIX
  // ============================================
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setStep(1)} className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Dados do Saque</h1>
          <div className="w-6" />
        </header>

        {/* Conteúdo */}
        <div className="flex-1 p-6">
          {/* Valor do saque */}
          <div className="text-center mb-8">
            <p className="text-white/60 text-sm mb-1">Valor do saque</p>
            <p className="text-4xl font-bold text-white">R$ {amount}</p>
          </div>

          {/* Tipo de chave PIX */}
          <div className="mb-4">
            <Label className="text-white/60 text-sm mb-2 block">Tipo de Chave PIX</Label>
            <Select value={pixKeyType} onValueChange={setPixKeyType}>
              <SelectTrigger className={cn(
                "h-12 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}>
                <SelectValue placeholder="Selecione o tipo de chave" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-white/10">
                {PIX_KEY_TYPES.map((type) => (
                  <SelectItem 
                    key={type.value} 
                    value={type.value}
                    className="text-white hover:bg-white/10 focus:bg-white/10"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chave PIX */}
          <div className="mb-6">
            <Label className="text-white/60 text-sm mb-2 block">Chave PIX</Label>
            <Input
              type="text"
              placeholder={
                pixKeyType === "cpf" ? "000.000.000-00" :
                pixKeyType === "email" ? "seu@email.com" :
                pixKeyType === "phone" ? "(00) 00000-0000" :
                "Cole sua chave aleatória"
              }
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className={cn(
                "h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
            />
          </div>

          {/* Aviso CPF */}
          <p className="text-white/40 text-xs text-center mb-6">
            *Só é permitido realizar saques para uma conta PIX vinculada ao mesmo CPF do seu cadastro.
          </p>

          {/* Botão Realizar Saque - INLINE no conteúdo */}
          <Button
            onClick={handleConfirmWithdrawal}
            disabled={isLoading || !pixKeyType || pixKey.length < 5}
            className={cn(
              "w-full h-12 text-base font-semibold mb-6",
              "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
              "text-[#0a1628]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Realizar Saque"
            )}
          </Button>

          {/* Info de processamento */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <Clock className="w-5 h-5 text-[#00faff] flex-shrink-0" />
            <p className="text-sm text-white/70">
              Saques podem levar até 30 minutos para serem processados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 1 - SELEÇÃO DE VALOR
  // ============================================
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
      {(authLoading || balanceLoading || settingsLoading) ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
        </div>
      ) : (
        <>
          {/* Conteúdo */}
          <div className="flex-1 p-6">
            {/* Saldo Disponível */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Saldo disponível para saque</span>
              </div>
              <p className="text-2xl font-bold text-white">
                R$ {formatCurrencyDisplay(saldoDisponivel)}
              </p>
            </div>

            {/* Tags de valores rápidos */}
            <div className="mb-4">
              <Label className="text-white/60 text-sm mb-3 block">Escolha um valor</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_VALUES.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    disabled={value > saldoDisponivel}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium text-sm transition",
                      numericAmount === value
                        ? "bg-[#00faff] text-[#0a1628]"
                        : value <= saldoDisponivel
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                    )}
                  >
                    R$ {value}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(formatCurrencyDisplay(saldoDisponivel))}
                  disabled={saldoDisponivel < minWithdrawal}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition",
                    saldoDisponivel >= minWithdrawal
                      ? "bg-[#00faff]/20 text-[#00faff] hover:bg-[#00faff]/30"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  )}
                >
                  Sacar tudo
                </button>
              </div>
            </div>

            {/* Campo de valor manual */}
            <div className="mb-4">
              <Label className="text-white/60 text-sm mb-2 block">Ou digite o valor</Label>
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
            </div>

            {/* Saque mínimo - texto dinâmico */}
            <p className="text-white/40 text-xs mb-6">
              *Saque mínimo: R$ {formatCurrencyDisplay(minWithdrawal)}
            </p>

            {/* Botão Continuar - INLINE no conteúdo */}
            <Button
              onClick={handleContinueToStep2}
              disabled={numericAmount < minWithdrawal || numericAmount > saldoDisponivel || numericAmount === 0}
              className={cn(
                "w-full h-12 text-base font-semibold mb-6",
                "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
                "text-[#0a1628]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Continuar
            </Button>

            {/* Warning saldo insuficiente */}
            {numericAmount > saldoDisponivel && numericAmount > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  Saldo insuficiente. Você tem R$ {formatCurrencyDisplay(saldoDisponivel)} disponível para saque.
                </p>
              </div>
            )}

            {/* Warning valor abaixo do mínimo */}
            {numericAmount > 0 && numericAmount < minWithdrawal && numericAmount <= saldoDisponivel && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">
                  O valor mínimo para saque é R$ {formatCurrencyDisplay(minWithdrawal)}.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
