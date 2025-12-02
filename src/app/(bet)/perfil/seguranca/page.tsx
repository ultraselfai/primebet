"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

export default function SegurancaPage() {
  const router = useRouter();
  const { showToast } = useBetAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Validação de senha
  const passwordChecks = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
    passwordsMatch: formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      showToast("Por favor, preencha todos os requisitos", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Senha alterada com sucesso!", "success");
        router.push("/perfil");
      } else {
        showToast(data.error || "Erro ao alterar senha", "error");
      }
    } catch (error) {
      showToast("Erro ao alterar senha", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {valid ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <X className="w-3 h-3 text-white/30" />
      )}
      <span className={valid ? "text-green-500" : "text-white/40"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/perfil" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Alterar Senha</h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Senha Atual */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-white/80">Senha atual</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={cn(
                "h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Nova Senha */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-white/80">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={cn(
                "h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Requisitos de senha */}
          {formData.newPassword && (
            <div className="mt-2 p-3 rounded-lg bg-white/5 grid grid-cols-2 gap-2">
              <PasswordCheck valid={passwordChecks.minLength} text="8+ caracteres" />
              <PasswordCheck valid={passwordChecks.hasUppercase} text="Letra maiúscula" />
              <PasswordCheck valid={passwordChecks.hasLowercase} text="Letra minúscula" />
              <PasswordCheck valid={passwordChecks.hasNumber} text="Um número" />
            </div>
          )}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/80">Confirmar nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={cn(
                "h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {formData.confirmPassword && (
            <div className="mt-2">
              <PasswordCheck valid={passwordChecks.passwordsMatch} text="Senhas coincidem" />
            </div>
          )}
        </div>

        {/* Botão Salvar */}
        <Button
          type="submit"
          disabled={isLoading || !isPasswordValid}
          className={cn(
            "w-full h-12 mt-6",
            "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
            "hover:from-[#00faff]/90 hover:to-[#00a8ff]/90",
            "text-[#0a1628] font-semibold",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Alterando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Alterar Senha
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
