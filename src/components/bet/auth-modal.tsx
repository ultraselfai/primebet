"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Eye, EyeOff, Lock, Mail, User, Loader2, Check, X as XIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { usePublicSettings } from "@/contexts/public-settings-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "cadastro";
  referralCode?: string;
}

export function AuthModal({ isOpen, onClose, defaultTab = "login", referralCode = "" }: AuthModalProps) {
  const router = useRouter();
  const { settings: publicSettings } = usePublicSettings();
  const logoUrl = publicSettings?.experience.media.logo.url || publicSettings?.branding.logoUrl || "/logo-horizontal.png";
  const [activeTab, setActiveTab] = useState<"login" | "cadastro">(defaultTab);

  // Sincronizar com defaultTab quando mudar
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Cadastro form
  const [cadastroData, setCadastroData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    acceptTerms: false,
    acceptAge: false,
  });

  // Validação de senha
  const passwordChecks = {
    minLength: cadastroData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(cadastroData.password),
    hasLowercase: /[a-z]/.test(cadastroData.password),
    hasNumber: /\d/.test(cadastroData.password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
        setIsLoading(false);
        return;
      }

      // Login bem-sucedido - força reload completo para garantir que os cookies sejam lidos
      window.location.reload();
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cadastroData.acceptTerms || !cadastroData.acceptAge || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Chamar API de cadastro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cadastroData.name,
          email: cadastroData.email,
          phone: cadastroData.phone.replace(/\D/g, ""),
          cpf: cadastroData.cpf.replace(/\D/g, ""),
          password: cadastroData.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
        setIsLoading(false);
        return;
      }

      // Cadastro bem-sucedido, fazer login automático
      const loginResult = await signIn("credentials", {
        email: cadastroData.email,
        password: cadastroData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Conta criada mas falhou o login - manda para login manual
        setActiveTab("login");
        setError("Conta criada! Faça login para continuar.");
        setIsLoading(false);
        return;
      }

      // Força reload completo para garantir que os cookies sejam lidos
      window.location.reload();
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {valid ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <XIcon className="w-3 h-3 text-white/30" />
      )}
      <span className={valid ? "text-green-500" : "text-white/40"}>{text}</span>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-auto bg-[#0d1f3c] rounded-2xl border border-white/10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header com Logo */}
        <div className="pt-8 pb-4 px-6 text-center border-b border-white/10">
          <Image
            src={logoUrl}
            alt="Logo"
            width={140}
            height={32}
            className="h-8 w-auto mx-auto mb-4"
          />
          
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab("login"); setError(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "login"
                  ? "bg-[#00faff] text-[#0a1628]"
                  : "text-white/60 hover:text-white"
              )}
            >
              Entrar
            </button>
            <button
              onClick={() => { setActiveTab("cadastro"); setError(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "cadastro"
                  ? "bg-[#00faff] text-[#0a1628]"
                  : "text-white/60 hover:text-white"
              )}
            >
              Criar Conta
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {activeTab === "login" ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white/80 text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className={cn(
                      "h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white/80 text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className={cn(
                      "h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-[#00faff] hover:text-[#00faff]/80 transition"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full h-12 text-base font-semibold",
                  "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
                  "hover:from-[#00faff]/90 hover:to-[#00a8ff]/90",
                  "text-[#0a1628]",
                  "shadow-lg shadow-[#00faff]/25"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          ) : (
            /* CADASTRO FORM */
            <form onSubmit={handleCadastro} className="space-y-3">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="cadastro-name" className="text-white/80 text-sm">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="cadastro-name"
                    type="text"
                    placeholder="João da Silva"
                    value={cadastroData.name}
                    onChange={(e) => setCadastroData({ ...cadastroData, name: e.target.value })}
                    className={cn(
                      "h-11 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="cadastro-email" className="text-white/80 text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="cadastro-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={cadastroData.email}
                    onChange={(e) => setCadastroData({ ...cadastroData, email: e.target.value })}
                    className={cn(
                      "h-11 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                </div>
              </div>

              {/* CPF e Telefone em linha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cadastro-cpf" className="text-white/80 text-sm">
                    CPF
                  </Label>
                  <Input
                    id="cadastro-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cadastroData.cpf}
                    onChange={(e) => setCadastroData({ ...cadastroData, cpf: formatCPF(e.target.value) })}
                    className={cn(
                      "h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cadastro-phone" className="text-white/80 text-sm">
                    Celular
                  </Label>
                  <Input
                    id="cadastro-phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={cadastroData.phone}
                    onChange={(e) => setCadastroData({ ...cadastroData, phone: formatPhone(e.target.value) })}
                    className={cn(
                      "h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="cadastro-password" className="text-white/80 text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="cadastro-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={cadastroData.password}
                    onChange={(e) => setCadastroData({ ...cadastroData, password: e.target.value })}
                    className={cn(
                      "h-11 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                      "focus:border-[#00faff] focus:ring-[#00faff]/20"
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {cadastroData.password && (
                  <div className="mt-2 p-2 rounded-lg bg-white/5 grid grid-cols-2 gap-1">
                    <PasswordCheck valid={passwordChecks.minLength} text="8+ caracteres" />
                    <PasswordCheck valid={passwordChecks.hasUppercase} text="Letra maiúscula" />
                    <PasswordCheck valid={passwordChecks.hasLowercase} text="Letra minúscula" />
                    <PasswordCheck valid={passwordChecks.hasNumber} text="Um número" />
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="modal-terms"
                    checked={cadastroData.acceptTerms}
                    onCheckedChange={(checked) => 
                      setCadastroData({ ...cadastroData, acceptTerms: checked as boolean })
                    }
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-[#00faff] data-[state=checked]:border-[#00faff]"
                  />
                  <Label htmlFor="modal-terms" className="text-white/60 text-xs leading-relaxed">
                    Li e aceito os{" "}
                    <span className="text-[#00faff]">Termos de Uso</span>{" "}
                    e{" "}
                    <span className="text-[#00faff]">Política de Privacidade</span>
                  </Label>
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="modal-age"
                    checked={cadastroData.acceptAge}
                    onCheckedChange={(checked) => 
                      setCadastroData({ ...cadastroData, acceptAge: checked as boolean })
                    }
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-[#00faff] data-[state=checked]:border-[#00faff]"
                  />
                  <Label htmlFor="modal-age" className="text-white/60 text-xs leading-relaxed">
                    Confirmo que tenho 18 anos ou mais
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !cadastroData.acceptTerms || !cadastroData.acceptAge || !isPasswordValid}
                className={cn(
                  "w-full h-12 text-base font-semibold mt-2",
                  "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
                  "hover:from-[#00faff]/90 hover:to-[#00a8ff]/90",
                  "text-[#0a1628]",
                  "shadow-lg shadow-[#00faff]/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
