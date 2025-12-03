"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  iconLarge?: React.ReactNode;
  activeIconLarge?: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface CasinoNavBarProps {
  items: MenuItem[];
  labelColor?: string;
  activeLabelColor?: string;
}

export function CasinoNavBar({ items, labelColor = "#9ca3af", activeLabelColor = "#00E0FF" }: CasinoNavBarProps) {
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
  const curveStart = 38;    // Reduzido de 65 para 50 - curva começa mais perto do centro
  const curveDepth = 38;    // Reduzido de 35 para 32 - curva menos profunda
  const tension = 35;       // Reduzido de 35 para 28 - curva mais fechada/apertada
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
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50 transition-transform duration-150 ease-out active:scale-110">
          {/* Anel neon ao redor do botão */}
          <div className="absolute inset-0 rounded-full border shadow-[0_0_8px_var(--ring-color),0_0_12px_var(--ring-color-50)] pointer-events-none" style={{ borderColor: activeLabelColor, "--ring-color": activeLabelColor, "--ring-color-50": `${activeLabelColor}50` } as React.CSSProperties} />
          <Link 
            href={fabItem.href}
            onClick={fabItem.onClick}
            className="relative w-14 h-14 rounded-full flex items-center justify-center 
                       bg-gradient-to-b from-[#0a1628] to-[#050d18] text-white"
          >
            <span className="text-white">
              {fabItem.activeIconLarge || fabItem.iconLarge || fabItem.activeIcon || fabItem.icon}
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
          <defs>
            <linearGradient id="navBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0246FF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#0235cc" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#0246FF" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="navBarOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Main bar - cor sólida azul */}
          <path d={path} fill="url(#navBarGradient)" />
          {/* Overlay escuro sutil para dar profundidade */}
          <path d={path} fill="url(#navBarOverlay)" />
          {/* Glow nas pontas */}
          <ellipse cx={width * 0.05} cy="30" rx="60" ry="35" fill="#00d4ff" fillOpacity="0.15" />
          <ellipse cx={width * 0.95} cy="30" rx="60" ry="35" fill="#00d4ff" fillOpacity="0.15" />
          {/* Top edge highlight */}
          <path d={`M0,0 L${center - curveStart},0`} stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1" fill="none" />
          <path d={`M${center + curveStart},0 L${width},0`} stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1" fill="none" />
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
                  <div 
                    className={cn(
                      "transition-all duration-300",
                      !isActive && "text-gray-400 group-hover:text-white"
                    )}
                    style={isActive ? { color: activeLabelColor, filter: `drop-shadow(0 0 8px ${activeLabelColor})` } : undefined}
                  >
                    {isActive ? (item.activeIcon || item.icon) : item.icon}
                  </div>
                  <span 
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? activeLabelColor : labelColor }}
                  >
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
                  <div 
                    className={cn(
                      "transition-all duration-300",
                      !isActive && "text-gray-400 group-hover:text-white"
                    )}
                    style={isActive ? { color: activeLabelColor, filter: `drop-shadow(0 0 8px ${activeLabelColor})` } : undefined}
                  >
                    {isActive ? (item.activeIcon || item.icon) : item.icon}
                  </div>
                  <span 
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? activeLabelColor : labelColor }}
                  >
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
