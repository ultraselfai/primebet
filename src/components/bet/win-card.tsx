"use client";

import Image from "next/image";

interface WinCardProps {
  thumbnail: string;
  gameName: string;
  playerId: string;
  amount: number;
}

export function WinCard({
  thumbnail,
  gameName,
  playerId,
  amount,
}: WinCardProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex-shrink-0 flex flex-col items-center">
      {/* Card com capa + ID */}
      <div className="w-[100px] rounded-xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 border border-white/10">
        {/* Capa do jogo - quadrada */}
        <div className="relative w-[100px] h-[100px]">
          <Image
            src={thumbnail}
            alt={gameName}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
        
        {/* Rodapé com ID */}
        <div className="py-1.5 px-1 text-center bg-black/30">
          <p className="text-white/90 text-[10px] font-medium">
            ID: {playerId}
          </p>
        </div>
      </div>
      
      {/* Valor do prêmio - fora do card */}
      <p className="text-[#4ade80] text-sm font-bold mt-1">
        {formattedAmount}
      </p>
    </div>
  );
}
