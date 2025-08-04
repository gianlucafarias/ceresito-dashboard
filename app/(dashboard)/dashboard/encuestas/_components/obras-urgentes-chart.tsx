"use client"

import { Pie, PieChart, Cell, Sector } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    label: "Cantidad",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface ObrasUrgentesChartProps {
  data: Array<{ nombre: string; cantidad: number }>
}

export default function ObrasUrgentesChart({ data }: ObrasUrgentesChartProps) {
  // Validar datos y usar valores por defecto
  const validData = data || []
  
  // Abreviaciones para obras
  const abreviaciones = {
    "Pavimentación de calles": "Pavimentación",
    "Veredas y rampas accesibles": "Veredas/Rampas", 
    "Mantenimiento de las calles": "Mant. Calles",
    "Limpieza": "Limpieza",
    "Plazas y espacios verdes": "Espacios Verdes",
    "Cordón cuneta": "Cordón Cuneta",
    "Cloacas": "Cloacas",
    "Desagües pluviales": "Desagües"
  }

  // Preparar datos para el gráfico - tomar top 6 para evitar saturación en el pie chart
  const chartData = validData.slice(0, 6).map((item, index) => {
    const nombreCompleto = item?.nombre || "Sin nombre"
    const nombreCorto = abreviaciones[nombreCompleto as keyof typeof abreviaciones] || 
                       (nombreCompleto.length > 15 ? `${nombreCompleto.substring(0, 12)}...` : nombreCompleto)
    
    return {
      obra: nombreCorto,
      obraCompleta: nombreCompleto, // Para el tooltip
      cantidad: item?.cantidad || 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }
  })

  const total = chartData.reduce((sum, item) => sum + item.cantidad, 0)

  if (!validData || validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Obras Urgentes</CardTitle>
          <CardDescription>Obras más solicitadas por los vecinos</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Obras Urgentes</CardTitle>
        <CardDescription>
          Obras más solicitadas por los vecinos
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="obraCompleta" />}
            />
            <Pie
              data={chartData}
              dataKey="cantidad"
              nameKey="obra"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={0}
              activeShape={({ outerRadius = 0, ...props }: any) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total: {total} votos
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Distribución de preferencias
        </div>
      </CardFooter>
    </Card>
  )
}