"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TermosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await fetch("/api/support/terms");
      const data = await res.json();
      
      if (data.success) {
        setContent(data.content || getDefaultTerms());
      } else {
        setContent(getDefaultTerms());
      }
    } catch (error) {
      setContent(getDefaultTerms());
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
        <h1 className="text-lg font-semibold text-white">Termos de Uso</h1>
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

function getDefaultTerms() {
  return `
    <h2>Termos de Uso</h2>
    <p><strong>Última atualização:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
    
    <h3>1. Aceitação dos Termos</h3>
    <p>Ao acessar e usar este serviço, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nosso serviço.</p>
    
    <h3>2. Elegibilidade</h3>
    <p>Você deve ter pelo menos 18 anos de idade para usar nosso serviço. Ao usar este serviço, você declara e garante que tem pelo menos 18 anos de idade e possui capacidade legal para celebrar este acordo.</p>
    
    <h3>3. Conta do Usuário</h3>
    <p>Para acessar determinadas funcionalidades, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
    
    <h3>4. Uso Responsável</h3>
    <p>Você concorda em usar nosso serviço de forma responsável e apenas para fins legais. É proibido:</p>
    <ul>
      <li>Violar qualquer lei ou regulamento aplicável</li>
      <li>Fraudar ou tentar fraudar o sistema</li>
      <li>Usar múltiplas contas</li>
      <li>Compartilhar sua conta com terceiros</li>
    </ul>
    
    <h3>5. Depósitos e Saques</h3>
    <p>Todas as transações financeiras estão sujeitas às nossas políticas de pagamento. Reservamo-nos o direito de solicitar documentação adicional para verificação de identidade.</p>
    
    <h3>6. Limitação de Responsabilidade</h3>
    <p>Nosso serviço é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros.</p>
    
    <h3>7. Alterações nos Termos</h3>
    <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação.</p>
    
    <h3>8. Contato</h3>
    <p>Para questões sobre estes Termos de Uso, entre em contato através de nossos canais de suporte.</p>
  `;
}
