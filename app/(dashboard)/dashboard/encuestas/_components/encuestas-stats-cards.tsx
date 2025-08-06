"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Users, Building, UserCheck } from "lucide-react"

interface EncuestasStatsCardsProps {
  stats: {
    totalEncuestas: number
    totalBarrios: number
    encuestasPorBarrio: Array<{ nombre: string; cantidad: number }>
    participacionContacto: {
      quieren: number
      noQuieren: number
    }
  }
}

export default function EncuestasStatsCards({ stats }: EncuestasStatsCardsProps) {
  // Valores por defecto para evitar errores si los datos no están disponibles
  const totalEncuestas = stats?.totalEncuestas || 0
  const totalBarrios = stats?.totalBarrios || 0
  const encuestasPorBarrio = stats?.encuestasPorBarrio || []
  const participacionContacto = stats?.participacionContacto || { quieren: 0, noQuieren: 0 }

  const porcentajeContacto = totalEncuestas > 0 
    ? Math.round((participacionContacto.quieren / totalEncuestas) * 100)
    : 0

  const barrioMasActivo = encuestasPorBarrio.length > 0 
    ? encuestasPorBarrio.reduce((max, barrio) => 
        barrio.cantidad > max.cantidad ? barrio : max, encuestasPorBarrio[0]
      )
    : null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Encuestas
          </CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEncuestas}</div>
          <p className="text-xs text-muted-foreground">
            Respuestas recibidas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Barrios Participantes
          </CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBarrios}</div>
          <p className="text-xs text-muted-foreground">
            {barrioMasActivo ? `${barrioMasActivo.nombre} (${barrioMasActivo.cantidad})` : "Sin datos"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Dejaron Contacto
          </CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{participacionContacto.quieren}</div>
          <p className="text-xs text-muted-foreground">
            {porcentajeContacto}% del total
          </p>
        </CardContent>
      </Card>

      
     
    </div>
  )
}