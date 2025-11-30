"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, QrCode, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_VALUES = [20, 50, 100, 200, 500, 1000];

export default function DepositarPage() {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "pix">("amount");
  const [copied, setCopied] = useState(false);

  // Mock PIX data - virá da API FBSPAY
  const pixData = {
    code: "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX_CODE_HERE",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
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

  const handlePresetClick = (value: number) => {
    setAmount(value.toFixed(2).replace(".", ","));
  };

  const handleContinue = () => {
    if (parseFloat(amount.replace(",", ".")) >= 10) {
      setStep("pix");
    }
  };

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(pixData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const numericAmount = parseFloat(amount.replace(".", "").replace(",", ".")) || 0;

  if (step === "pix") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setStep("amount")} className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Pagar com PIX</h1>
          <div className="w-6" />
        </header>

        <div className="flex-1 p-6 flex flex-col items-center">
          {/* Valor */}
          <div className="text-center mb-6">
            <p className="text-white/60 text-sm">Valor do depósito</p>
            <p className="text-3xl font-bold text-white">R$ {amount}</p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-2xl mb-6">
            <QrCode className="w-48 h-48 text-[#0a1628]" />
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 text-yellow-500 mb-6">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Expira em 30:00 minutos</span>
          </div>

          {/* PIX Code */}
          <div className="w-full space-y-3">
            <Label className="text-white/60 text-sm">Código PIX Copia e Cola</Label>
            <div className="relative">
              <Input
                value={pixData.code}
                readOnly
                className="h-12 pr-12 bg-white/5 border-white/10 text-white text-sm font-mono"
              />
              <button
                onClick={handleCopyPix}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 rounded-xl bg-[#00faff]/10 border border-[#00faff]/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#00faff] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">Como pagar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Cole o código ou escaneie o QR</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Info */}
          <p className="mt-4 text-center text-white/40 text-xs">
            O crédito é automático após confirmação do pagamento
          </p>
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
        <h1 className="text-lg font-semibold text-white">Depositar</h1>
        <div className="w-6" />
      </header>

      <div className="flex-1 p-6">
        {/* Amount Input */}
        <div className="mb-6">
          <Label className="text-white/60 text-sm mb-2 block">Valor do depósito</Label>
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
          <p className="text-white/40 text-xs mt-2">Depósito mínimo: R$ 10,00</p>
        </div>

        {/* Preset Values */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {PRESET_VALUES.map((value) => (
            <button
              key={value}
              onClick={() => handlePresetClick(value)}
              className={cn(
                "h-12 rounded-xl font-semibold transition",
                numericAmount === value
                  ? "bg-[#00faff] text-[#0a1628]"
                  : "bg-white/5 text-white hover:bg-white/10"
              )}
            >
              R$ {value}
            </button>
          ))}
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <Label className="text-white/60 text-sm mb-3 block">Método de pagamento</Label>
          <div className="p-4 rounded-xl bg-[#00faff]/10 border-2 border-[#00faff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00faff]/20 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 512 512">
                <path fill="#00faff" d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C344.9 374.9 344.9 384.2 339.5 389.6C334.1 395 324.8 395 319.4 389.6L262.5 332.7V448C262.5 455.2 256.7 461 249.5 461C242.3 461 236.5 455.2 236.5 448V332.7L179.6 389.6C174.2 395 164.9 395 159.5 389.6C154.1 384.2 154.1 374.9 159.5 369.5L236.5 292.5C241.9 287.1 251.2 287.1 256.6 292.5H242.4zM252 0C158.4 0 82.49 75.91 82.49 169.5V208H64C28.65 208 0 236.7 0 272V432C0 467.3 28.65 496 64 496H440C475.3 496 504 467.3 504 432V272C504 236.7 475.3 208 440 208H421.5V169.5C421.5 75.91 345.6 0 252 0zM134.5 169.5C134.5 104.6 186.9 52.13 251.9 52.13C316.9 52.13 369.3 104.6 369.3 169.5V208H134.5V169.5zM440 464H64C46.33 464 32 449.7 32 432V272C32 254.3 46.33 240 64 240H440C457.7 240 472 254.3 472 272V432C472 449.7 457.7 464 440 464z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">PIX</p>
              <p className="text-white/50 text-sm">Aprovação instantânea</p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-[#00faff] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00faff]" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Button
          onClick={handleContinue}
          disabled={numericAmount < 10}
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
    </div>
  );
}
