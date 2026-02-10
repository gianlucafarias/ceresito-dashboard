"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format, subMonths, subYears } from "date-fns"
import { es } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
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
import { Skeleton } from "@/components/ui/skeleton"

interface DailyMessageData {
  date: string
  count: number
  sentMessages: number
  receivedMessages: number
}

type InteractionsApiItem = {
  date?: string
  group?: string
  count?: string | number
  sentMessages?: string | number
  receivedMessages?: string | number
}

const chartConfig = {
  sentMessages: {
    label: "Mensajes enviados",
    color: "#009C69",
  },
  receivedMessages: {
    label: "Mensajes recibidos",
    color: "#0EA5E9",
  },
} satisfies ChartConfig

const getFormattedDate = (date: Date): string => {
  return format(date, "yyyy-MM-dd")
}

const toSafeNumber = (value: string | number | undefined): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return parsed
}

const getSafeDateKey = (item: InteractionsApiItem): string => {
  return item.date || item.group || ""
}

export function MessagesPerDayChart() {
  const [chartData, setChartData] = React.useState<DailyMessageData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [timeRange, setTimeRange] = React.useState<string>("90d")

  const timeRangeDescription: { [key: string]: string } = {
    "90d": "Ultimos 3 meses",
    "180d": "Ultimos 6 meses",
    "365d": "Ultimo ano",
  }

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const endDate = new Date()
        let startDate: Date
        switch (timeRange) {
          case "180d":
            startDate = subMonths(endDate, 6)
            break
          case "365d":
            startDate = subYears(endDate, 1)
            break
          case "90d":
          default:
            startDate = subMonths(endDate, 3)
            break
        }

        const startDateString = getFormattedDate(startDate)
        const endDateString = getFormattedDate(endDate)
        const groupBy = "day"

        const apiUrl = `/api/core/interactions/last-week/count/${startDateString}/${endDateString}/${groupBy}`

        const response = await fetch(apiUrl, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Error al obtener los datos: ${response.statusText}`)
        }
        const data: InteractionsApiItem[] = await response.json()

        const processedData = data
          .map((item) => {
            const date = getSafeDateKey(item)
            const count = toSafeNumber(item.count)
            const sentMessages =
              item.sentMessages !== undefined ? toSafeNumber(item.sentMessages) : count
            const receivedMessages =
              item.receivedMessages !== undefined
                ? toSafeNumber(item.receivedMessages)
                : Math.max(0, count - sentMessages)

            return {
              date,
              count,
              sentMessages,
              receivedMessages,
            }
          })
          .filter((item) => item.date)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setChartData(processedData)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Ocurrio un error desconocido")
        }
        console.error("Error fetching daily messages:", err)
        setChartData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Mensajes por Dia</CardTitle>
          <CardDescription>
            {timeRangeDescription[timeRange] || "Seleccione un periodo"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[180px] ml-auto"
            aria-label="Seleccionar rango de tiempo"
          >
            <SelectValue placeholder="Seleccionar rango" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">Ultimos 3 meses</SelectItem>
            <SelectItem value="180d">Ultimos 6 meses</SelectItem>
            <SelectItem value="365d">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : error ? (
          <div className="flex h-[250px] w-full items-center justify-center text-destructive">
            Error al cargar datos: {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
            No hay datos disponibles para el periodo seleccionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={10}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value)
                    return format(date, "d MMM", { locale: es })
                  } catch {
                    return value
                  }
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => {
                      try {
                        const date = new Date(value)
                        return format(date, "PPP", { locale: es })
                      } catch {
                        return value
                      }
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="receivedMessages"
                stackId="messages"
                fill="var(--color-receivedMessages)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="sentMessages"
                stackId="messages"
                fill="var(--color-sentMessages)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
