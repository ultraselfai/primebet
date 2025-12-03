"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, Lock } from "lucide-react";

interface PasswordConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  actionLabel?: string;
  variant?: "default" | "danger";
}

export function PasswordConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar ação",
  description = "Por segurança, digite sua senha para continuar.",
  actionLabel = "Confirmar",
  variant = "default",
}: PasswordConfirmationModalProps) {
  const [password, setPassword] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Digite sua senha");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Verificar senha na API
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Senha incorreta");
        setIsVerifying(false);
        return;
      }

      // Senha correta, executar ação
      await onConfirm();
      
      // Limpar estado e fechar modal
      setPassword("");
      setError(null);
      onOpenChange(false);
    } catch (err) {
      console.error("Erro ao verificar senha:", err);
      setError("Erro ao verificar senha. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(null);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isVerifying) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {variant === "danger" ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : (
              <Lock className="h-5 w-5 text-primary" />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isVerifying}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isVerifying}
          >
            Cancelar
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
