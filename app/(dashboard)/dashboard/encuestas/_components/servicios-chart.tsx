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
  servicio: {
    label: "Servicio",
  },
  cantidad: {
    label: "Cantidad",
  },
} satisfies ChartConfig

interface ServiciosChartProps {
  data: Array<{ nombre: string; cantidad: number }>
}

export default function ServiciosChart({ data }: ServiciosChartProps) {
  // Validar datos y usar valores por defecto
  const validData = data || []
  
  // Abreviaciones para servicios más comunes
  const abreviaciones = {
    "Mantenimiento de las calles": "Mant. Calles",
    "Mantenimiento de los espacios verdes": "Mant. Espacios", 
    "Limpieza / recolección de residuos": "Limpieza/Residuos",
    "Arbolado / poda": "Arbolado/Poda",
    "Alumbrado público": "Alumbrado",
    "Seguridad": "Seguridad"
  }

  // Preparar datos para el gráfico - manejo defensivo para campos "Otro" y personalizados
  const chartData = validData.slice(0, 6).map((item, index) => {
    const nombreCompleto = item?.nombre || "Sin nombre"
    
    // Manejo especial para campos "Otro" o personalizados que pueden venir del backend
    let nombreCorto = nombreCompleto
    
    // Si es un campo conocido, usar abreviación
    if (abreviaciones[nombreCompleto as keyof typeof abreviaciones]) {
      nombreCorto = abreviaciones[nombreCompleto as keyof typeof abreviaciones]
    }
    // Si contiene "Otro" o es muy largo, truncar inteligentemente  
    else if (nombreCompleto.toLowerCase().includes('otro') || nombreCompleto.length > 15) {
      nombreCorto = nombreCompleto.length > 12 ? `${nombreCompleto.substring(0, 9)}...` : nombreCompleto
    }
    
    return {
      servicio: nombreCorto,
      servicioCompleto: nombreCompleto, // Para tooltip
      cantidad: item?.cantidad || 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }
  })

  const total = chartData.reduce((sum, item) => sum + item.cantidad, 0)

  if (!validData || validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servicios a Mejorar</CardTitle>
          <CardDescription>Servicios que más necesitan mejora</CardDescription>
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
        <CardTitle>Servicios a Mejorar</CardTitle>
        <CardDescription>
          Servicios más solicitados por los vecinos
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
              content={<ChartTooltipContent hideLabel nameKey="servicioCompleto" />}
            />
            <Pie
              data={chartData}
              dataKey="cantidad"
              nameKey="servicio"
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