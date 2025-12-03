import { TrendingDown, TrendingUp, Wallet, Users, PiggyBank, ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="size-4" />
            Saldo Total
            <Badge variant="outline" className="ml-1">
              <TrendingUp />
              0%
            </Badge>
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            R$ 0,00
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Aguardando dados <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Soma de todos os saldos de jogadores
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="size-4" />
            Usuários Ativos
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Novos usuários hoje: 0 <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Jogaram nas últimas 24 horas
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <PiggyBank className="size-4" />
            Total Investido
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            R$ 0,00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rendimentos: R$ 0,00 <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Distribuição mensal
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <ArrowUpDown className="size-4" />
            GGR (Receita Bruta)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            R$ 0,00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Apostas - Prêmios pagos <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Margem: 0% do volume</div>
        </CardFooter>
      </Card>
    </div>
  )
}
