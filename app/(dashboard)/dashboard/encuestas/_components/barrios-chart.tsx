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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBarrioFilter } from "./barrio-filter-context"

const chartConfig = {
  cantidad: {
    label: "Encuestas",
    color: "hsl(var(--chart-3))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig

interface BarriosChartProps {
  data: Array<{ nombre: string; cantidad: number }>
}

export default function BarriosChart({ data }: BarriosChartProps) {
  const { isFiltered, selectedBarrio } = useBarrioFilter()
  
  // Validar datos y usar valores por defecto
  const validData = data || []
  
  // Preparar datos para el gráfico - mostrar todos los barrios
  const chartData = validData.map((item, index) => {
    const nombreCompleto = item?.nombre || "Sin nombre"
    
    return {
      barrio: nombreCompleto,
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
        <CardContent className="flex items-center justify-center h-58">
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
          {isFiltered ? 
            `Todos los barrios participantes (filtro activo: ${selectedBarrio})` : 
            "Todos los barrios participantes"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-136 w-full">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              height={Math.max(500, chartData.length * 100)}
              barCategoryGap={10}
              margin={{
                right: 80,
                left: 15,
                top: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="barrio"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide
              />
              <XAxis dataKey="cantidad" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="cantidad"
                radius={10}
                barSize={90}
              >
                <LabelList
                  dataKey="barrio"
                  position="insideLeft"
                  offset={20}
                  className="fill-background font-medium"
                  fontSize={12}
                />
                <LabelList
                  dataKey="cantidad"
                  position="right"
                  offset={20}
                  className="fill-foreground font-medium"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}