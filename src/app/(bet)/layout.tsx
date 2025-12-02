"use client";

import { useEffect } from "react";
import { BetLayout } from "@/components/bet";
import { BetAuthProvider } from "@/contexts/bet-auth-context";

export default function BetRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Registrar Service Worker para Push Notifications
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registrado:", registration.scope);
        })
        .catch((error) => {
          console.error("Erro ao registrar SW:", error);
        });
    }
  }, []);

  return (
    <BetAuthProvider>
      <BetLayout>{children}</BetLayout>
    </BetAuthProvider>
  );
}
