"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import type { User } from "../page"

interface AddBalanceDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBalance: (userId: string, amount: number, type: 'game' | 'invest') => Promise<{ success: boolean; message?: string; error?: string }>
}

export function AddBalanceDialog({ user, open, onOpenChange, onAddBalance }: AddBalanceDialogProps) {
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<'game' | 'invest'>('game')
  const [loading, setLoading] = useState(false)

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Digite um valor válido")
      return
    }

    setLoading(true)
    try {
      const result = await onAddBalance(user.id, numAmount, type)
      
      if (result.success) {
        toast.success(result.message || "Saldo adicionado com sucesso!")
        setAmount("")
        setType('game')
        onOpenChange(false)
      } else {
        toast.error(result.error || "Erro ao adicionar saldo")
      }
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error)
      toast.error("Erro ao adicionar saldo")
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [50, 100, 200, 500, 1000]

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-green-600" />
            Adicionar Saldo
          </DialogTitle>
          <DialogDescription>
            Adicionar saldo para <strong>{user.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Saldos atuais */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Saldo Jogo</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(user.balanceGame)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo Investido</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(user.balanceInvest)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance-type">Tipo de Saldo</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'game' | 'invest')}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game">Saldo de Jogo</SelectItem>
                <SelectItem value="invest">Saldo de Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Valores rápidos */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setAmount(value.toString())}
              >
                R$ {value}
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount}
              className="cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Adicionar Saldo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
