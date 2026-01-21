"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface ImpersonatedUser {
  id: string;
  name: string | null;
  email: string;
  playerId?: string | null;
  avatarUrl?: string | null;
}

interface BetAuthContextType {
  // Auth Modal
  isAuthModalOpen: boolean;
  authModalTab: "login" | "cadastro";
  authReferralCode: string;
  openAuthModal: (tab?: "login" | "cadastro") => void;
  closeAuthModal: () => void;
  
  // Toast
  showToast: (message: string, type?: Toast["type"]) => void;
  
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    playerId?: string | null;
    avatarUrl?: string | null;
  } | null;
  
  // Saldo
  balance: number;
  balanceLoading: boolean;
  refreshBalance: (forceRefresh?: boolean) => Promise<void>;
  
  // Impersonation
  isImpersonating: boolean;
}

const BetAuthContext = createContext<BetAuthContextType | undefined>(undefined);

// Cache de saldo em memória para evitar chamadas repetidas
const balanceCache = {
  value: 0,
  timestamp: 0,
  ttl: 10000, // 10 segundos de cache
};

export function BetAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "cadastro">("login");
  const [authReferralCode, setAuthReferralCode] = useState<string>("");
  
  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Balance State
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  
  // Impersonation State - inicializa sincronamente para evitar delays
  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return document.cookie.includes("impersonating_user=");
  });
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  
  // Ref para evitar múltiplas chamadas simultâneas
  const fetchingBalance = useRef(false);
  const initialLoadDone = useRef(false);

  // Verificar impersonação - executa IMEDIATAMENTE sem delays
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkImpersonation = () => {
      const hasImpersonation = document.cookie.includes("impersonating_user=");
      
      if (hasImpersonation) {
        try {
          const allCookies = document.cookie.split(";");
          const impersonatingCookie = allCookies.find(c => c.trim().startsWith("impersonating_user="));
          if (impersonatingCookie) {
            const cookieValue = impersonatingCookie.split("=").slice(1).join("=");
            const decoded = decodeURIComponent(cookieValue);
            const userData = JSON.parse(decoded);
            setImpersonatedUser(userData);
            setIsImpersonating(true);
          }
        } catch {
          setImpersonatedUser(null);
          setIsImpersonating(false);
        }
      } else {
        setImpersonatedUser(null);
        setIsImpersonating(false);
      }
    };
    
    // Executar imediatamente
    checkImpersonation();
    
    // Re-verificar no focus (com debounce)
    let focusTimeout: NodeJS.Timeout;
    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(checkImpersonation, 100);
    };
    
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearTimeout(focusTimeout);
    };
  }, []);

  // Determinar autenticação - mais rápido
  const isAuthenticated = status === "authenticated" || isImpersonating;
  const isLoading = status === "loading";

  // Determinar usuário atual
  const currentUser = isImpersonating && impersonatedUser
    ? impersonatedUser
    : session?.user
      ? {
          id: (session.user as { id?: string }).id || "",
          name: session.user.name || null,
          email: session.user.email || "",
          playerId: (session.user as { playerId?: string | null }).playerId || null,
          avatarUrl: (session.user as { avatarUrl?: string | null }).avatarUrl || null,
        }
      : null;

  // Função para buscar saldo - OTIMIZADA com cache e deduplicação
  const refreshBalance = useCallback(async (forceRefresh = false) => {
    const shouldFetchBalance = status === "authenticated" || isImpersonating;
    
    if (!shouldFetchBalance) {
      setBalance(0);
      return;
    }
    
    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && balanceCache.timestamp > 0 && (now - balanceCache.timestamp) < balanceCache.ttl) {
      setBalance(balanceCache.value);
      return;
    }
    
    // Evitar chamadas duplicadas
    if (fetchingBalance.current) return;
    fetchingBalance.current = true;
    
    // Só mostrar loading na primeira vez
    if (!initialLoadDone.current) {
      setBalanceLoading(true);
    }
    
    try {
      const res = await fetch("/api/wallet/game", {
        // Cache no browser por 5 segundos
        cache: "no-store",
        headers: {
          "Cache-Control": "max-age=5",
        },
      });
      const data = await res.json();
      
      if (data.success) {
        const newBalance = data.data.balance;
        balanceCache.value = newBalance;
        balanceCache.timestamp = now;
        setBalance(newBalance);
      }
    } catch {
      // Silenciar erros para não poluir console
    } finally {
      setBalanceLoading(false);
      fetchingBalance.current = false;
      initialLoadDone.current = true;
    }
  }, [status, isImpersonating]);

  // Carregar saldo - IMEDIATAMENTE quando autenticado
  useEffect(() => {
    if (status === "loading") return;
    
    const shouldLoad = status === "authenticated" || isImpersonating;
    
    if (shouldLoad) {
      refreshBalance();
    } else {
      setBalance(0);
      balanceCache.timestamp = 0;
    }
  }, [status, isImpersonating, refreshBalance]);

  // Verificar primeira visita - SEM DELAY para usuário autenticado
  useEffect(() => {
    if (status === "loading") return;
    if (typeof window === "undefined") return;
    if (isImpersonating) return;
    
    // Verificar query params
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get("auth");
    const refParam = urlParams.get("ref");
    
    // Aceitar "register" como alias de "cadastro" para compatibilidade
    if (authParam === "login" || authParam === "cadastro" || authParam === "register") {
      const tab = authParam === "register" ? "cadastro" : authParam;
      setAuthModalTab(tab);
      if (refParam) {
        setAuthReferralCode(refParam);
      }
      setIsAuthModalOpen(true);
      window.history.replaceState({}, "", "/");
      return;
    }
    
    // Verificar primeira visita - apenas para não autenticados
    if (status === "unauthenticated") {
      const hasVisited = localStorage.getItem("primebet_visited");
      if (!hasVisited) {
        // Delay mínimo para não bloquear render
        requestAnimationFrame(() => {
          setIsAuthModalOpen(true);
          localStorage.setItem("primebet_visited", "true");
        });
      }
    }
  }, [status, isImpersonating]);

  const openAuthModal = useCallback((tab: "login" | "cadastro" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthReferralCode(""); // Limpar código ao fechar
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value: BetAuthContextType = {
    isAuthModalOpen,
    authModalTab,
    authReferralCode,
    openAuthModal,
    closeAuthModal,
    showToast,
    isAuthenticated,
    isLoading,
    user: currentUser,
    balance,
    balanceLoading,
    refreshBalance: () => refreshBalance(true), // Force refresh quando chamado manualmente
    isImpersonating,
  };

  return (
    <BetAuthContext.Provider value={value}>
      {children}
      
      {/* Toast Container - Renderização condicional */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm
                animate-in fade-in slide-in-from-top-2 duration-300
                ${toast.type === "error" ? "bg-red-500/90 text-white" : ""}
                ${toast.type === "success" ? "bg-green-500/90 text-white" : ""}
                ${toast.type === "warning" ? "bg-yellow-500/90 text-black" : ""}
                ${toast.type === "info" ? "bg-[#0d1f3c]/95 text-white border border-[#00faff]/30" : ""}
              `}
            >
              <p className="text-sm font-medium text-center">{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </BetAuthContext.Provider>
  );
}

export function useBetAuth() {
  const context = useContext(BetAuthContext);
  if (context === undefined) {
    throw new Error("useBetAuth must be used within a BetAuthProvider");
  }
  return context;
}
