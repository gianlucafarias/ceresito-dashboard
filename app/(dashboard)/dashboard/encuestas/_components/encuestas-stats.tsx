"use client"

import { Card, CardContent } from "@/components/ui/card"
import EncuestasStatsCards from "./encuestas-stats-cards"
import ObrasUrgentesChart from "./obras-urgentes-chart"
import ServiciosChart from "./servicios-chart"
import BarriosChart from "./barrios-chart"

interface EncuestasStatsProps {
  stats: {
    totalEncuestas: number
    totalBarrios: number
    encuestasPorBarrio: Array<{ nombre: string; cantidad: number }>
    obrasUrgentesTop: Array<{ nombre: string; cantidad: number }>
    serviciosMejorarTop: Array<{ nombre: string; cantidad: number }>
    participacionContacto: {
      quieren: number
      noQuieren: number
    }
    ultimasEncuestas: Array<{
      id: number
      barrio: string
      fechaCreacion: string
    }>
  }
}

export default function EncuestasStats({ stats }: EncuestasStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas generales */}
      <EncuestasStatsCards stats={stats} />

      {/* Gráficos en una sola fila con mejor distribución */}
      <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
        <ObrasUrgentesChart data={stats.obrasUrgentesTop} />
        <BarriosChart data={stats.encuestasPorBarrio} />
        <ServiciosChart data={stats.serviciosMejorarTop} />
      </div>
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}