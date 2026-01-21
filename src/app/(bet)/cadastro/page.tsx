"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Esta página redireciona para home com parâmetro de modal
export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "authenticated") {
      router.replace("/");
    } else {
      // Preservar código de indicação na URL
      const ref = searchParams.get("ref");
      const refParam = ref ? `&ref=${ref}` : "";
      router.replace(`/?auth=cadastro${refParam}`);
    }
  }, [status, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00faff] border-t-transparent" />
    </div>
  );
}
