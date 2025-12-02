"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PrivacidadePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await fetch("/api/support/privacy");
      const data = await res.json();
      
      if (data.success) {
        setContent(data.content || getDefaultPrivacy());
      } else {
        setContent(getDefaultPrivacy());
      }
    } catch (error) {
      setContent(getDefaultPrivacy());
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
        <h1 className="text-lg font-semibold text-white">Política de Privacidade</h1>
      </header>

      <div className="p-4">
        <div 
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

function getDefaultPrivacy() {
  return `
    <h2>Política de Privacidade</h2>
    <p><strong>Última atualização:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
    
    <h3>1. Informações que Coletamos</h3>
    <p>Coletamos informações que você nos fornece diretamente, incluindo:</p>
    <ul>
      <li>Nome completo</li>
      <li>Endereço de e-mail</li>
      <li>Número de telefone</li>
      <li>CPF</li>
      <li>Documentos de identificação (para verificação)</li>
    </ul>
    
    <h3>2. Como Usamos suas Informações</h3>
    <p>Utilizamos as informações coletadas para:</p>
    <ul>
      <li>Criar e gerenciar sua conta</li>
      <li>Processar transações financeiras</li>
      <li>Verificar sua identidade</li>
      <li>Enviar comunicações sobre sua conta</li>
      <li>Cumprir obrigações legais e regulatórias</li>
    </ul>
    
    <h3>3. Compartilhamento de Informações</h3>
    <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:</p>
    <ul>
      <li>Provedores de serviço que nos auxiliam nas operações</li>
      <li>Autoridades regulatórias quando exigido por lei</li>
      <li>Parceiros de pagamento para processar transações</li>
    </ul>
    
    <h3>4. Segurança dos Dados</h3>
    <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.</p>
    
    <h3>5. Seus Direitos</h3>
    <p>De acordo com a LGPD, você tem direito a:</p>
    <ul>
      <li>Acessar seus dados pessoais</li>
      <li>Corrigir dados incompletos ou inexatos</li>
      <li>Solicitar a exclusão de seus dados</li>
      <li>Revogar seu consentimento</li>
    </ul>
    
    <h3>6. Cookies</h3>
    <p>Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o tráfego e personalizar o conteúdo.</p>
    
    <h3>7. Retenção de Dados</h3>
    <p>Mantemos suas informações pelo tempo necessário para cumprir as finalidades para as quais foram coletadas, incluindo obrigações legais.</p>
    
    <h3>8. Alterações nesta Política</h3>
    <p>Podemos atualizar esta política periodicamente. Notificaremos você sobre alterações significativas por e-mail ou através de aviso em nosso site.</p>
    
    <h3>9. Contato</h3>
    <p>Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato através de nossos canais de suporte.</p>
  `;
}
