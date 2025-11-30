"use client"

import { useEffect, useState } from "react"
import { StatCards } from "./components/stat-cards"
import { DataTable } from "./components/data-table"
import { Loader2 } from "lucide-react"

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  role: "PLAYER" | "ADMIN" | "SUPER_ADMIN"
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED"
  kycStatus: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED"
  balanceGame: string
  balanceInvest: string
  balanceYields: string
  createdAt: string
  updatedAt: string
}

export interface UserFormValues {
  name: string
  email: string
  phone?: string
  cpf?: string
  password?: string
  role: string
  status: string
  initialBalance?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async (userData: UserFormValues) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUsers(prev => [data.data, ...prev])
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      return { success: false, error: 'Erro ao criar usuário' }
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUsers(prev => prev.filter(user => user.id !== id))
      }
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
    }
  }

  const handleEditUser = async (user: User) => {
    // Abrir modal de edição (controlado pelo DataTable)
    console.log("Edit user:", user)
  }

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
  }

  const handleAddBalance = async (userId: string, amount: number, type: 'game' | 'invest') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Atualizar usuário na lista
        setUsers(prev => prev.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              balanceGame: data.data.balanceGame,
              balanceInvest: data.data.balanceInvest,
              balanceYields: data.data.balanceYields,
            }
          }
          return user
        }))
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Erro ao adicionar saldo:', err)
      return { success: false, error: 'Erro ao adicionar saldo' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards users={users} />
      </div>
      
      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable 
          users={users}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          onAddUser={handleAddUser}
          onAddBalance={handleAddBalance}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </div>
  )
}
