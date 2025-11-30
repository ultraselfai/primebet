"use client";

import Link from "next/link";
import { RadioTower, ArrowLeft } from "lucide-react";

export default function AoVivoPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5">
      <div className="relative mb-6 flex w-full max-w-sm justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lobby
        </Link>
      </div>

      <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-white/10 bg-white/5 px-6 py-10 text-center shadow-[0_25px_55px_rgba(3,7,18,0.65)] backdrop-blur-[22px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(147,94,255,0.35)_0%,_rgba(4,10,24,0.05)_60%)]" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c084fc] to-[#7c3aed] text-[#0b0616] shadow-[0_10px_35px_rgba(106,45,255,0.45)]">
            <RadioTower className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="text-[0.8rem] uppercase tracking-[0.3em] text-white/40">
              Jogos Ao Vivo
            </p>
            <h1 className="text-3xl font-semibold text-white">Em breve</h1>
            <p className="text-sm text-white/70">
              Estamos integrando mesas exclusivas com dealers reais, streaming em 4K
              e suporte a apostas colaborativas. Em breve você poderá testar tudo
              direto do lobby.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/20"
          >
            Voltar para jogos
          </Link>
        </div>
      </div>
    </div>
  );
}
