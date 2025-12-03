"use client";

import * as React from "react";

interface UsePasswordConfirmationOptions {
  title?: string;
  description?: string;
  actionLabel?: string;
  variant?: "default" | "danger";
}

interface UsePasswordConfirmationReturn {
  isOpen: boolean;
  options: UsePasswordConfirmationOptions;
  openConfirmation: (
    onConfirm: () => void | Promise<void>,
    options?: UsePasswordConfirmationOptions
  ) => void;
  closeConfirmation: () => void;
  confirm: () => void | Promise<void>;
}

/**
 * Hook para gerenciar confirmação de senha em ações críticas
 * 
 * @example
 * const { isOpen, options, openConfirmation, closeConfirmation, confirm } = usePasswordConfirmation();
 * 
 * // Para solicitar confirmação antes de deletar
 * const handleDelete = () => {
 *   openConfirmation(
 *     async () => {
 *       await deleteUser(userId);
 *       toast.success("Usuário excluído!");
 *     },
 *     {
 *       title: "Excluir usuário",
 *       description: "Esta ação é irreversível. Digite sua senha para confirmar.",
 *       actionLabel: "Excluir",
 *       variant: "danger",
 *     }
 *   );
 * };
 * 
 * // No JSX:
 * <PasswordConfirmationModal
 *   open={isOpen}
 *   onOpenChange={closeConfirmation}
 *   onConfirm={confirm}
 *   {...options}
 * />
 */
export function usePasswordConfirmation(): UsePasswordConfirmationReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<UsePasswordConfirmationOptions>({});
  const onConfirmRef = React.useRef<(() => void | Promise<void>) | null>(null);

  const openConfirmation = React.useCallback(
    (
      onConfirm: () => void | Promise<void>,
      newOptions?: UsePasswordConfirmationOptions
    ) => {
      onConfirmRef.current = onConfirm;
      setOptions(newOptions || {});
      setIsOpen(true);
    },
    []
  );

  const closeConfirmation = React.useCallback(() => {
    setIsOpen(false);
    onConfirmRef.current = null;
  }, []);

  const confirm = React.useCallback(async () => {
    if (onConfirmRef.current) {
      await onConfirmRef.current();
    }
  }, []);

  return {
    isOpen,
    options,
    openConfirmation,
    closeConfirmation,
    confirm,
  };
}
