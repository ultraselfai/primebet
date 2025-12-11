"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "Gráfico financeiro interativo"

interface ChartDataItem {
  date: string;
  receita: number;
  premios: number;
  saldo: number;
}

const chartConfig = {
  receita: {
    label: "Receita",
    color: "hsl(142, 76%, 36%)", // verde
  },
  premios: {
    label: "Prêmios Pagos",
    color: "hsl(45, 93%, 47%)", // amarelo/dourado
  },
  saldo: {
    label: "Saldo Líquido",
    color: "hsl(217, 91%, 60%)", // azul
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<ChartDataItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7
        const response = await fetch(`/api/dashboard/chart?days=${days}`)
        const data = await response.json()
        
        if (data.success) {
          setChartData(data.data)
        }
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange])

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$${(value / 1000).toFixed(1)}k`
    }
    return `R$${value.toFixed(0)}`
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Desempenho Financeiro</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Receita, prêmios pagos e saldo líquido
          </span>
          <span className="@[540px]/card:hidden">Visão financeira</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecione o período"
            >
              <SelectValue placeholder="Últimos 30 dias" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-receita)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-receita)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillPremios" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-premios)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-premios)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-saldo)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-saldo)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatCurrency}
                width={60}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })
                    }}
                    formatter={(value, name) => {
                      const formattedValue = new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value as number)
                      return [formattedValue, chartConfig[name as keyof typeof chartConfig]?.label || name]
                    }}
                    indicator="dot"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="receita"
                type="monotone"
                fill="url(#fillReceita)"
                stroke="var(--color-receita)"
                strokeWidth={2}
              />
              <Area
                dataKey="premios"
                type="monotone"
                fill="url(#fillPremios)"
                stroke="var(--color-premios)"
                strokeWidth={2}
              />
              <Area
                dataKey="saldo"
                type="monotone"
                fill="url(#fillSaldo)"
                stroke="var(--color-saldo)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
