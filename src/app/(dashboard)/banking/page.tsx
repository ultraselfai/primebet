"use client";

import React from "react";
import { Construction, ArrowLeft, Wrench, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function BankingMaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="max-w-lg w-full border-dashed border-2 border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="flex flex-col items-center text-center py-12 px-6">
          {/* Ícone animado */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-yellow-500/10 p-6 rounded-full border border-yellow-500/30">
              <Construction className="h-16 w-16 text-yellow-500" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Módulo em Manutenção
          </h1>
          
          {/* Subtítulo */}
          <p className="text-muted-foreground mb-6 max-w-sm">
            O módulo Banking está temporariamente indisponível enquanto realizamos melhorias e atualizações.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Melhorias em andamento</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Retorno em breve</span>
            </div>
          </div>

          {/* Botão de voltar */}
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Nota de rodapé */}
      <p className="text-xs text-muted-foreground mt-6 text-center max-w-md">
        Enquanto isso, você pode gerenciar depósitos e saques através das páginas de Aprovações e Financeiro.
      </p>
    </div>
  );
}
