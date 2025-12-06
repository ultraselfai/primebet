"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicSettings } from "@/contexts/public-settings-context";

export default function AjudaPage() {
  const { settings, loading } = usePublicSettings();
  
  const helpCenter = settings?.experience?.identity?.helpCenter;
  const theme = settings?.experience?.theme;
  const primaryColor = theme?.primaryColor ?? "#00faff";
  
  // Verificar quais canais estão disponíveis
  const hasWhatsapp = Boolean(helpCenter?.whatsappLink);
  const hasTelegram = Boolean(helpCenter?.telegramLink);
  const hasEmail = Boolean(helpCenter?.emailSupport);
  const hasAnyChannel = hasWhatsapp || hasTelegram || hasEmail;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
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
        <h1 className="text-lg font-semibold text-white">Central de Ajuda</h1>
      </header>

      <div className="p-4">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Contatar Suporte</h2>
          <p className="text-white/60">
            Escolha um canal para falar com nossa equipe
          </p>
        </div>

        {/* Cards de Suporte */}
        <div className="flex flex-col gap-4">
          {/* WhatsApp */}
          {hasWhatsapp && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
              {helpCenter?.whatsappImageUrl ? (
                <div className="w-16 h-16 mb-4 overflow-hidden">
                  <img 
                    src={helpCenter.whatsappImageUrl} 
                    alt="WhatsApp" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-500" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              )}
              <h3 className="text-white font-medium mb-4">WhatsApp</h3>
              <a
                href={helpCenter!.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full py-3 rounded-xl font-medium text-sm text-center transition-all",
                  "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                Suporte via WhatsApp
              </a>
            </div>
          )}

          {/* Telegram */}
          {hasTelegram && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
              {helpCenter?.telegramImageUrl ? (
                <div className="w-16 h-16 mb-4 overflow-hidden">
                  <img 
                    src={helpCenter.telegramImageUrl} 
                    alt="Telegram" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              )}
              <h3 className="text-white font-medium mb-4">Telegram</h3>
              <a
                href={helpCenter!.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full py-3 rounded-xl font-medium text-sm text-center transition-all",
                  "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                Suporte via Telegram
              </a>
            </div>
          )}

          {/* Email */}
          {hasEmail && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-white font-medium mb-4">Email</h3>
              <a
                href={`mailto:${helpCenter!.emailSupport}`}
                className={cn(
                  "w-full py-3 rounded-xl font-medium text-sm text-center transition-all",
                  "bg-orange-500 hover:bg-orange-600 text-white"
                )}
              >
                Suporte via Email
              </a>
            </div>
          )}
        </div>

        {/* Mensagem se nenhum canal disponível */}
        {!hasAnyChannel && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-white/60 text-lg font-medium mb-2">Suporte indisponível</h3>
            <p className="text-white/40 text-sm">
              Os canais de suporte estão sendo configurados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
