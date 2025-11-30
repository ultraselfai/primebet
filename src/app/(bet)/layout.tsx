"use client";

import { BetLayout } from "@/components/bet";
import { BetAuthProvider } from "@/contexts/bet-auth-context";

export default function BetRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BetAuthProvider>
      <BetLayout>{children}</BetLayout>
    </BetAuthProvider>
  );
}
