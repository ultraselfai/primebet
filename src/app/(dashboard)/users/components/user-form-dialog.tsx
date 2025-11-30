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
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { UserFormValues } from "../page"

interface UserFormDialogProps {
  onAddUser: (user: UserFormValues) => Promise<{ success: boolean; error?: string }>
}

export function UserFormDialog({ onAddUser }: UserFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("PLAYER")
  const [status, setStatus] = useState("ACTIVE")
  const [initialBalance, setInitialBalance] = useState("")

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setCpf("")
    setPassword("")
    setRole("PLAYER")
    setStatus("ACTIVE")
    setInitialBalance("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!name || !email) {
      toast.error("Nome e email são obrigatórios")
      return
    }

    setLoading(true)
    try {
      const result = await onAddUser({
        name,
        email,
        phone: phone || undefined,
        cpf: cpf || undefined,
        password: password || undefined,
        role,
        status,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
      })
      
      if (result.success) {
        toast.success("Usuário criado com sucesso!")
        resetForm()
        setOpen(false)
      } else {
        toast.error(result.error || "Erro ao criar usuário")
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo usuário. Você pode adicionar um saldo inicial.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name"
                placeholder="Nome completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                type="email"
                placeholder="email@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone"
                placeholder="(11) 99999-9999" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input 
                id="cpf"
                placeholder="000.000.000-00" 
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYER">Jogador</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance">Saldo Inicial de Jogo (R$)</Label>
            <Input 
              id="initialBalance"
              type="number" 
              min="0" 
              step="0.01"
              placeholder="0.00" 
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
