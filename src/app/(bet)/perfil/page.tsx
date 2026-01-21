"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Mail, Phone, Shield, Bell, LogOut, 
  ChevronRight, Settings, HelpCircle, FileText,
  Verified,
  Edit2,
  Loader2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";
import { logoutAndRedirect } from "@/utils/logout-client";

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  isKycVerified: boolean;
  createdAt: string;
  role: string;
}

// Formatar telefone para exibição
function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export default function PerfilPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, openAuthModal } = useBetAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleLogout = useCallback(async () => {
    await logoutAndRedirect("/?auth=login")
  }, []);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal("login");
      router.push("/");
    }
  }, [isLoading, isAuthenticated, openAuthModal, router]);

  // Buscar dados do perfil atualizados
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setProfile({
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
              cpf: data.user.cpf,
              isKycVerified: data.user.kycStatus === "APPROVED",
              createdAt: data.user.createdAt,
              role: data.user.role,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, isLoading]);

  // Loading state
  if (isLoading || !user || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
      </div>
    );
  }

  // Dados do usuário combinando contexto + API
  const userData = {
    name: profile?.name || user.name || "Usuário",
    email: profile?.email || user.email || "",
    phone: formatPhone(profile?.phone || null),
    cpf: profile?.cpf ? `***.***.***-${profile.cpf.slice(-2)}` : null,
    avatar: user.avatarUrl || null,
    verified: profile?.isKycVerified || false,
    createdAt: profile?.createdAt || new Date().toISOString(),
  };

  const menuItems = [
    {
      icon: <User className="w-5 h-5" />,
      label: "Dados Pessoais",
      href: "/perfil/dados",
      badge: null,
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Segurança",
      href: "/perfil/seguranca",
      badge: null,
    },
    {
      icon: <Verified className="w-5 h-5" />,
      label: "Verificação de Conta",
      href: "/perfil/verificacao",
      badge: userData.verified ? "Verificado" : "Pendente",
      badgeColor: userData.verified ? "text-green-500 bg-green-500/20" : "text-yellow-500 bg-yellow-500/20",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Histórico de Apostas",
      href: "/perfil/historico",
      badge: null,
    },
  ];

  const supportItems = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Central de Ajuda",
      href: "/ajuda",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Termos de Uso",
      href: "/termos",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Política de Privacidade",
      href: "/privacidade",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Meu Perfil</h1>
        <Link href="/perfil/configuracoes" className="text-white/70 hover:text-white transition">
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      {/* Profile Card */}
      <div className="p-4">
        <div className="relative rounded-2xl overflow-hidden border border-[#00faff]/20">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/teste.jpg')" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/60 via-transparent to-[#00faff]/10" />
          {/* Glow Effect on Border */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#00faff]/30" />
          
          {/* Content */}
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-[#00faff] shadow-lg shadow-[#00faff]/20">
                  <AvatarImage src={userData.avatar || undefined} />
                  <AvatarFallback className="bg-[#00faff]/20 text-[#00faff] text-xl font-bold">
                    {userData.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white drop-shadow-sm">{userData.name}</h2>
                  {userData.verified && (
                    <Verified className="w-5 h-5 text-[#00faff]" />
                  )}
                </div>
                <p className="text-white/70 text-sm">{userData.email}</p>
                {user.playerId && (
                  <p className="text-[#00faff] font-mono text-sm mt-1 drop-shadow-sm">
                    ID: {user.playerId}
                  </p>
                )}
                <p className="text-white/50 text-xs mt-1">
                  Membro desde {new Date(userData.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            
            <Link href="/perfil/dados">
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4 w-full border-[#00faff]/50 text-[#00faff] bg-[#00faff]/10 hover:bg-[#00faff]/20 hover:text-[#00faff] backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </Link>

            {/* Botão de Link de Convite - só aparece para INFLUENCER */}
            {profile?.role === "INFLUENCER" && (
              <Link href="/associado">
                <Button 
                  size="sm"
                  className="mt-2 w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white border-0"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Link de Convite
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-xs">E-mail</span>
            </div>
            <p className="text-white text-sm truncate">{userData.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Phone className="w-4 h-4" />
              <span className="text-xs">Telefone</span>
            </div>
            <p className={cn(
              "text-sm",
              userData.phone ? "text-white" : "text-white/40"
            )}>
              {userData.phone || "(Não cadastrado)"}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mb-4">
        <h3 className="text-white/40 text-xs font-medium uppercase mb-2 px-1">Conta</h3>
        <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
          {menuItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/60">{item.icon}</span>
                <span className="text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-white/40" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 mb-4">
        <h3 className="text-white/40 text-xs font-medium uppercase mb-2 px-1">Preferências</h3>
        <div className="bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-white/60">
                <Bell className="w-5 h-5" />
              </span>
              <p className="text-white">Notificações Push</p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              className="data-[state=checked]:bg-[#00faff]"
            />
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="px-4 mb-4">
        <h3 className="text-white/40 text-xs font-medium uppercase mb-2 px-1">Suporte</h3>
        <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
          {supportItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/60">{item.icon}</span>
                <span className="text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <Button 
          variant="ghost" 
          className="w-full h-12 text-red-500 hover:text-red-400 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>

      {/* Version */}
      <p className="text-center text-white/30 text-xs mt-6">
        PrimeBet v1.0.0
      </p>
    </div>
  );
}
