"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useBetAuth } from "@/contexts/bet-auth-context";

interface ReferralData {
  isInfluencer: boolean;
  referralCode: string | null;
  referralLink: string | null;
  stats: {
    totalReferrals: number;
    totalDeposits: string;
    commissionEarned: string;
    commissionPaid: string;
    commissionPending: string;
  };
  referrals: Array<{
    id: string;
    name: string;
    joinedAt: string;
  }>;
}

export default function AssociadoBetPage() {
  const { user, isAuthenticated } = useBetAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/player/referral");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    if (data?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Venha jogar comigo!",
          text: "Cadastre-se usando meu link e ganhe bônus!",
          url: data.referralLink,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a1628] pb-24">
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <Link href="/" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Programa de Afiliados</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <Lock className="w-16 h-16 text-white/30 mb-4" />
          <p className="text-white text-xl font-bold mb-2">Faça login para acessar</p>
          <p className="text-white/60 mb-6">Você precisa estar logado para ver seu programa de afiliados</p>
          <Link href="/login">
            <Button className="bg-purple-600 hover:bg-purple-700">Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Não é influencer
  if (!data?.isInfluencer) {
    return (
      <div className="min-h-screen bg-[#0a1628] pb-24">
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <Link href="/" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Programa de Afiliados</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <Users className="w-16 h-16 text-purple-500/50 mb-4" />
          <p className="text-white text-xl font-bold mb-2">Programa exclusivo</p>
          <p className="text-white/60 max-w-xs">
            O programa de afiliados é exclusivo para influenciadores parceiros. 
            Entre em contato conosco para se tornar um parceiro!
          </p>
        </div>
      </div>
    );
  }

  // É influencer - mostrar dashboard
  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-white">Meu Programa de Afiliados</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Link de Indicação */}
        <Card className="bg-gradient-to-r from-purple-600 to-purple-800 border-0">
          <CardContent className="p-4">
            <p className="text-white/80 text-sm mb-2">Seu link de indicação</p>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-3 mb-3">
              <code className="text-white text-sm flex-1 truncate">
                {data.referralLink}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyLink}
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                onClick={shareLink}
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#1a2744] border-white/10">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{data.stats.totalReferrals}</p>
              <p className="text-white/60 text-xs">Indicados</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2744] border-white/10">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.totalDeposits)}</p>
              <p className="text-white/60 text-xs">Depósitos Gerados</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2744] border-white/10">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.commissionEarned)}</p>
              <p className="text-white/60 text-xs">Comissão Total</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2744] border-white/10">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(data.stats.commissionPending)}</p>
              <p className="text-white/60 text-xs">A Receber</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Indicados */}
        <Card className="bg-[#1a2744] border-white/10">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3">Últimos Indicados</h3>
            {data.referrals.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-4">
                Nenhum indicado ainda. Compartilhe seu link!
              </p>
            ) : (
              <div className="space-y-2">
                {data.referrals.slice(0, 10).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                  >
                    <span className="text-white text-sm">{referral.name}</span>
                    <span className="text-white/50 text-xs">{formatDate(referral.joinedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-[#1a2744] border-white/10">
          <CardContent className="p-4">
            <p className="text-white/60 text-xs text-center">
              As comissões são calculadas automaticamente com base nos depósitos dos seus indicados.
              O pagamento é realizado manualmente pela equipe.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
