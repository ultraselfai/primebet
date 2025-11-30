"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Esta página redireciona para home com parâmetro de modal
export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "authenticated") {
      router.replace("/");
    } else {
      // Redirecionar para home com parâmetro para abrir modal
      router.replace("/?auth=login");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00faff] border-t-transparent" />
    </div>
  );
}
