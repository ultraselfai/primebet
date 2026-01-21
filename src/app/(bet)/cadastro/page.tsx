"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/bet/auth-modal";

// Componente interno que usa searchParams
function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const referralCode = searchParams.get("ref") || "";

  // Debug log
  useEffect(() => {
    console.log("[CADASTRO PAGE] referralCode from URL:", referralCode);
  }, [referralCode]);

  // Se já está autenticado, redireciona para home
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Se está carregando, mostra loader
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00faff] border-t-transparent" />
      </div>
    );
  }

  // Mostra o modal de cadastro diretamente
  return (
    <div className="min-h-screen bg-[#0a1628]">
      <AuthModal 
        isOpen={true} 
        onClose={() => router.push("/")}
        defaultTab="cadastro"
        referralCode={referralCode}
      />
    </div>
  );
}

// Esta página mostra o modal de cadastro diretamente
export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00faff] border-t-transparent" />
      </div>
    }>
      <CadastroContent />
    </Suspense>
  );
}
