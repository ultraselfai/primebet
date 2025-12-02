"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface CasinoNavBarProps {
  items: MenuItem[];
}

export function CasinoNavBar({ items }: CasinoNavBarProps) {
  const [width, setWidth] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const middleIndex = Math.floor(items.length / 2);
  const fabItem = items[middleIndex];
  const leftItems = items.slice(0, middleIndex);
  const rightItems = items.slice(middleIndex + 1);

  const height = 60;
  const curveStart = 65;
  const curveDepth = 35;
  const tension = 35;
  const center = width / 2;

  const path = `
    M0,0 
    L${center - curveStart},0 
    C${center - tension},0 ${center - tension},${curveDepth} ${center},${curveDepth}
    C${center + tension},${curveDepth} ${center + tension},0 ${center + curveStart},0
    L${width},0 
    L${width},${height} 
    L0,${height} 
    Z
  `;

  if (width === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 filter drop-shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
      
      {/* 1. O BOTÃO FLUTUANTE (FAB) - CARTEIRA */}
      {fabItem && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
          <Link 
            href={fabItem.href}
            onClick={fabItem.onClick}
            className="w-14 h-14 rounded-full flex items-center justify-center 
                       bg-[#0f172a] border-4 border-[#00E0FF] text-white 
                       shadow-[0_0_15px_#00E0FF] transition-transform hover:scale-105 active:scale-95"
          >
            <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
              {fabItem.icon}
            </span>
          </Link>
        </div>
      )}

      {/* 2. O DESENHO DA BARRA (SVG) */}
      <div className="relative w-full h-[60px]">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          className="absolute top-0 left-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <path d={path} fill="#0f172a" fillOpacity="0.95" />
        </svg>

        {/* 3. CONTEÚDO DOS ÍCONES (LAYOUT) */}
        <div className="relative w-full h-full flex justify-between items-center px-4">
          
          {/* GRUPO ESQUERDA */}
          <div className="flex-1 flex justify-end items-center gap-6 pr-6">
            {leftItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link 
                  key={item.id} 
                  href={item.href} 
                  onClick={item.onClick}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "transition-all duration-300",
                    isActive ? "text-[#00E0FF] drop-shadow-[0_0_8px_#00E0FF]" : "text-gray-400 group-hover:text-white"
                  )}>
                    {item.icon}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-[#00E0FF]" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* ESPAÇO MORTO DO CENTRO */}
          <div className="w-[70px] shrink-0" />

          {/* GRUPO DIREITA */}
          <div className="flex-1 flex justify-start items-center gap-6 pl-6">
            {rightItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                 <Link 
                   key={item.id} 
                   href={item.href} 
                   onClick={item.onClick}
                   className="flex flex-col items-center gap-1 group"
                 >
                  <div className={cn(
                    "transition-all duration-300",
                    isActive ? "text-[#00E0FF] drop-shadow-[0_0_8px_#00E0FF]" : "text-gray-400 group-hover:text-white"
                  )}>
                    {item.icon}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-[#00E0FF]" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
