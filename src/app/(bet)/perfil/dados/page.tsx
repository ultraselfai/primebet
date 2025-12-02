"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

export default function DadosPessoaisPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, showToast } = useBetAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Carregar dados do usuário
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      
      if (data.success) {
        setUserData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: formatPhone(data.user.phone || ""),
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Dados atualizados com sucesso!", "success");
        router.push("/perfil");
      } else {
        showToast(data.error || "Erro ao atualizar dados", "error");
      }
    } catch (error) {
      showToast("Erro ao atualizar dados", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/perfil" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Dados Pessoais</h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/80">Nome completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="name"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className={cn(
                "h-12 pl-11 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
              placeholder="Seu nome completo"
            />
          </div>
        </div>

        {/* Email - Somente leitura */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="email"
              value={userData.email}
              disabled
              className={cn(
                "h-12 pl-11 bg-white/5 border-white/10 text-white/50",
                "cursor-not-allowed"
              )}
            />
          </div>
          <p className="text-white/40 text-xs">O e-mail não pode ser alterado</p>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white/80">Celular</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="phone"
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: formatPhone(e.target.value) })}
              className={cn(
                "h-12 pl-11 bg-white/5 border-white/10 text-white",
                "focus:border-[#00faff] focus:ring-[#00faff]/20"
              )}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <Button
          type="submit"
          disabled={isSaving}
          className={cn(
            "w-full h-12 mt-6",
            "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
            "hover:from-[#00faff]/90 hover:to-[#00a8ff]/90",
            "text-[#0a1628] font-semibold"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
