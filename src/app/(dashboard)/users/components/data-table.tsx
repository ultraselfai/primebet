"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Search,
  Wallet,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserFormDialog } from "./user-form-dialog"
import { AddBalanceDialog } from "./add-balance-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import type { User, UserFormValues } from "../page"

interface DataTableProps {
  users: User[]
  onDeleteUser: (id: string) => void
  onEditUser: (user: User) => void
  onAddUser: (userData: UserFormValues) => Promise<{ success: boolean; error?: string }>
  onAddBalance: (userId: string, amount: number, type: 'game' | 'invest') => Promise<{ success: boolean; message?: string; error?: string }>
  onUserUpdated: (user: User) => void
}

export function DataTable({ users, onDeleteUser, onEditUser, onAddUser, onAddBalance, onUserUpdated }: DataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)

  // Função para impersonar usuário (entrar como ele na bet)
  const handleImpersonate = async (user: User) => {
    setImpersonatingUserId(user.id)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/impersonate`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Entrando como ${user.name}...`)
        // Redirecionar para a home da bet em uma nova aba
        window.open('/', '_blank')
      } else {
        toast.error(data.error || "Erro ao entrar como usuário")
      }
    } catch (error) {
      console.error('Erro ao impersonar:', error)
      toast.error("Erro ao entrar como usuário")
    } finally {
      setImpersonatingUserId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      case "BLOCKED":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
      case "SUSPENDED":
        return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Ativo"
      case "BLOCKED": return "Bloqueado"
      case "SUSPENDED": return "Suspenso"
      default: return status
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20"
      case "ADMIN":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
      case "PLAYER":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin"
      case "ADMIN": return "Admin"
      case "PLAYER": return "Jogador"
      default: return role
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const getAvatar = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const exactFilter = (row: Row<User>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Usuário",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {getAvatar(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "playerId",
      header: "ID Jogador",
      cell: ({ row }) => {
        const playerId = row.getValue("playerId") as string | null
        return (
          <span className="font-mono text-sm text-muted-foreground">
            {playerId || "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant="secondary" className={getRoleColor(role)}>
            {getRoleLabel(role)}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      accessorKey: "balanceGame",
      header: "Saldo Jogo",
      cell: ({ row }) => {
        const balance = row.getValue("balanceGame") as string
        return (
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      accessorKey: "balanceInvest",
      header: "Saldo Investido",
      cell: ({ row }) => {
        const balance = row.getValue("balanceInvest") as string
        return (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original
        const isImpersonating = impersonatingUserId === user.id
        return (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 cursor-pointer"
              onClick={() => setSelectedUserForBalance(user)}
              title="Adicionar Saldo"
            >
              <Wallet className="size-4 text-green-600" />
              <span className="sr-only">Adicionar saldo</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleImpersonate(user)}
              disabled={isImpersonating}
              title="Entrar como este usuário"
            >
              {isImpersonating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4 text-blue-600" />
              )}
              <span className="sr-only">Entrar como usuário</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setSelectedUserForEdit(user)}
              title="Editar usuário"
            >
              <Pencil className="size-4 text-orange-600" />
              <span className="sr-only">Editar usuário</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">Mais ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedUserForEdit(user)}
                >
                  <Pencil className="mr-2 size-4" />
                  Editar Dados
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedUserForBalance(user)}
                >
                  <Wallet className="mr-2 size-4" />
                  Adicionar Saldo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleImpersonate(user)}
                >
                  <Eye className="mr-2 size-4" />
                  Entrar como Usuário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onDeleteUser(user.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Excluir Usuário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const roleFilter = table.getColumn("role")?.getFilterValue() as string
  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="cursor-pointer">
            <Download className="mr-2 size-4" />
            Exportar
          </Button>
          <UserFormDialog onAddUser={onAddUser} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="role-filter" className="text-sm font-medium">
            Função
          </Label>
          <Select
            value={roleFilter || ""}
            onValueChange={(value) =>
              table.getColumn("role")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="role-filter">
              <SelectValue placeholder="Selecionar Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Funções</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="PLAYER">Jogador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={statusFilter || ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="Selecionar Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="BLOCKED">Bloqueado</SelectItem>
              <SelectItem value="SUSPENDED">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            Colunas
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer w-full">
                Colunas <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Mostrar
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="w-20 cursor-pointer" id="page-size">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="hidden sm:flex items-center space-x-2">
            <p className="text-sm font-medium">Página</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog para adicionar saldo */}
      <AddBalanceDialog
        user={selectedUserForBalance}
        open={!!selectedUserForBalance}
        onOpenChange={(open: boolean) => !open && setSelectedUserForBalance(null)}
        onAddBalance={onAddBalance}
      />

      {/* Dialog para editar usuário */}
      <EditUserDialog
        user={selectedUserForEdit}
        open={!!selectedUserForEdit}
        onOpenChange={(open: boolean) => !open && setSelectedUserForEdit(null)}
        onUserUpdated={(updatedUser) => {
          onUserUpdated(updatedUser)
          setSelectedUserForEdit(null)
        }}
      />
    </div>
  )
}
