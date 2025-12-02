"use client";

import React from "react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PromocoesAdminPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="max-w-lg w-full border-dashed border-2 border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex flex-col items-center text-center py-12 px-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-amber-500/10 p-6 rounded-full border border-amber-500/30">
              <Construction className="h-16 w-16 text-amber-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Promoções
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
