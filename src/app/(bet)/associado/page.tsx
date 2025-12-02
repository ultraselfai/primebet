"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AssociadoBetPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-white">Associado</h1>
      </header>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-8 max-w-xs">
          <p className="text-white text-xl font-bold mb-2">Em breve!</p>
          <p className="text-white/60 text-base">Grandes recompensas para associados estão por vir.</p>
        </div>
        
        <Image
          src="/no-data.png"
          alt="Em breve"
          width={180}
          height={180}
          className="opacity-80"
        />
      </div>
    </div>
  );
}
