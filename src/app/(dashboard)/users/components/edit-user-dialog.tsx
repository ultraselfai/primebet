"use client"

import { useState, useEffect } from "react"
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
import { Loader2, User as UserIcon, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import type { User } from "../page"

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: (user: User) => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  
  // Dados do usuário
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  
  // Nova senha
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Preencher dados quando o usuário mudar
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setCpf(user.cpf || "")
      setRole(user.role || "PLAYER")
      setStatus(user.status || "ACTIVE")
      setNewPassword("")
      setConfirmPassword("")
    }
  }, [user])

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          cpf: cpf || null,
          role,
          status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Dados atualizados com sucesso!")
        onUserUpdated(data.data)
      } else {
        toast.error(data.error || "Erro ao atualizar dados")
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      toast.error("Erro ao atualizar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Senha alterada com sucesso!")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Erro ao alterar senha")
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error("Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Gerenciar dados de <strong>{user.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Saldo Jogo</p>
            <p className="font-semibold text-green-600">{formatCurrency(user.balanceGame)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Saldo Investido</p>
            <p className="font-semibold text-blue-600">{formatCurrency(user.balanceInvest)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Rendimentos</p>
            <p className="font-semibold text-purple-600">{formatCurrency(user.balanceYields)}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="size-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="size-4" />
              Senha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input 
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input 
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input 
                  id="edit-cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAYER">Jogador</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>ID: <code className="bg-muted px-1 rounded">{user.id}</code></p>
              <p>Criado em: {new Date(user.createdAt).toLocaleString('pt-BR')}</p>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Ao alterar a senha, o usuário precisará usar a nova senha para acessar a conta.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input 
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input 
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
