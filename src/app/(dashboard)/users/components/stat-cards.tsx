import { Card, CardContent } from "@/components/ui/card"
import { Users, Wallet, UserCheck, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import type { User } from "../page"

interface StatCardsProps {
  users: User[]
}

export function StatCards({ users }: StatCardsProps) {
  // Calcular estatísticas
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length
  const _blockedUsers = users.filter(u => u.status === 'BLOCKED' || u.status === 'SUSPENDED').length // Reservado para uso futuro
  
  const totalBalanceGame = users.reduce((sum, u) => sum + parseFloat(u.balanceGame || '0'), 0)
  const totalBalanceInvest = users.reduce((sum, u) => sum + parseFloat(u.balanceInvest || '0'), 0)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const performanceMetrics = [
    {
      title: 'Total de Usuários',
      current: totalUsers.toString(),
      description: 'Cadastrados na plataforma',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Usuários Ativos',
      current: activeUsers.toString(),
      description: `${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% do total`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: 'Saldo Total em Jogo',
      current: formatCurrency(totalBalanceGame),
      description: 'Distribuído entre usuários',
      icon: Wallet,
      color: 'text-emerald-600',
    },
    {
      title: 'Saldo Total Investido',
      current: formatCurrency(totalBalanceInvest),
      description: 'Capital sob gestão',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {performanceMetrics.map((metric, index) => (
        <Card key={index} className='border'>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <metric.icon className={cn('size-6', metric.color)} />
              <Badge variant='outline' className='border-primary/20 bg-primary/5 text-primary'>
                Atualizado
              </Badge>
            </div>

            <div className='space-y-2'>
              <p className='text-muted-foreground text-sm font-medium'>{metric.title}</p>
              <div className='text-2xl font-bold'>{metric.current}</div>
              <div className='text-muted-foreground text-sm'>
                {metric.description}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
