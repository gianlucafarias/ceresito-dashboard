"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  cantidad: {
    label: "Encuestas",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface BarriosChartProps {
  data: Array<{ nombre: string; cantidad: number }>
}

export default function BarriosChart({ data }: BarriosChartProps) {
  // Validar datos y usar valores por defecto
  const validData = data || []
  
  // Preparar datos para el gráfico - tomar top 10 barrios
  const chartData = validData.slice(0, 10).map((item, index) => {
    const nombreCompleto = item?.nombre || "Sin nombre"
    // Truncar nombres de barrios muy largos pero mantener legibilidad
    const nombreCorto = nombreCompleto.length > 12 ? `${nombreCompleto.substring(0, 9)}...` : nombreCompleto
    
    return {
      barrio: nombreCorto,
      barrioCompleto: nombreCompleto, // Para tooltip
      cantidad: item?.cantidad || 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }
  })

  if (!validData || validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participación por Barrio</CardTitle>
          <CardDescription>Encuestas recibidas por barrio</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participación por Barrio</CardTitle>
        <CardDescription>
          Top 10 barrios con mayor participación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="barrio"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="barrioCompleto" />}
            />
            <Bar dataKey="cantidad" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}