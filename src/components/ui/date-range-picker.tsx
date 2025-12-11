"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PeriodType = "today" | "week" | "month" | "custom"

interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onChange?: (range: DateRange | undefined, periodType: PeriodType) => void
  minDate?: Date
  disabled?: boolean
}

const presets = [
  { label: "Hoje", value: "today" as PeriodType },
  { label: "Esta semana", value: "week" as PeriodType },
  { label: "Este mês", value: "month" as PeriodType },
  { label: "Personalizado", value: "custom" as PeriodType },
]

export function DateRangePicker({
  className,
  value,
  onChange,
  minDate,
  disabled = false,
}: DateRangePickerProps) {
  const [periodType, setPeriodType] = React.useState<PeriodType>("month")
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [open, setOpen] = React.useState(false)

  // Calcular range baseado no período
  const calculateRange = React.useCallback((period: PeriodType): DateRange => {
    const now = new Date()
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) }
      case "week":
        return { from: startOfWeek(now, { locale: ptBR }), to: endOfWeek(now, { locale: ptBR }) }
      case "month":
        return { from: startOfMonth(now), to: now }
      case "custom":
      default:
        return date || { from: subDays(now, 30), to: now }
    }
  }, [date])

  // Inicializar com o mês atual
  React.useEffect(() => {
    if (!value) {
      const initialRange = calculateRange("month")
      setDate(initialRange)
      onChange?.(initialRange, "month")
    }
  }, [])

  const handlePresetChange = (newPeriod: PeriodType) => {
    setPeriodType(newPeriod)
    
    if (newPeriod !== "custom") {
      const newRange = calculateRange(newPeriod)
      setDate(newRange)
      onChange?.(newRange, newPeriod)
    }
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to) {
      setPeriodType("custom")
      onChange?.(range, "custom")
    }
  }

  const displayText = React.useMemo(() => {
    if (!date?.from) return "Selecione um período"
    
    if (periodType === "today") return "Hoje"
    if (periodType === "week") return "Esta semana"
    if (periodType === "month" && !date?.to) return "Este mês"
    
    if (date.to) {
      if (date.from.toDateString() === date.to.toDateString()) {
        return format(date.from, "dd 'de' MMMM", { locale: ptBR })
      }
      return `${format(date.from, "dd/MM")} - ${format(date.to, "dd/MM/yyyy", { locale: ptBR })}`
    }
    
    return format(date.from, "dd 'de' MMMM, yyyy", { locale: ptBR })
  }, [date, periodType])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={periodType}
        onValueChange={(v) => handlePresetChange(v as PeriodType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
            disabled={minDate ? { before: minDate } : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
