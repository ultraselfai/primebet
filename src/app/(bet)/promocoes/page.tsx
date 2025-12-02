"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PromocoesBetPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-white">Promoções</h1>
      </header>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center px-6 py-20">
        <p className="text-white/70 text-lg text-center mb-8 max-w-xs">
          Em breve! Grandes promoções estão por vir.
        </p>
        
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
