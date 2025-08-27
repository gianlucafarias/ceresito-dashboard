"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Users, TrendingUp, Info } from "lucide-react"
import { useBarrioFilter } from "./barrio-filter-context"

interface FilterInfoBannerProps {
  stats: {
    totalEncuestas: number
    encuestasPorBarrio: Array<{ nombre: string; cantidad: number }>
  }
}

export default function FilterInfoBanner({ stats }: FilterInfoBannerProps) {
  const { selectedBarrio, isFiltered } = useBarrioFilter()

  if (!isFiltered) {
    return null
  }

  // Encontrar estadísticas del barrio seleccionado
  const barrioStats = stats.encuestasPorBarrio.find(
    barrio => barrio.nombre === selectedBarrio
  )

  if (!barrioStats) {
    return null
  }

  const porcentajeDelTotal = stats.totalEncuestas > 0 
    ? Math.round((barrioStats.cantidad / stats.totalEncuestas) * 100)
    : 0

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-900 dark:text-green-100">
                {selectedBarrio}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  {barrioStats.cantidad} encuestas
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  {porcentajeDelTotal}% del total
                </span>
              </div>
            </div>
          </div>
          
          <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
            Filtro activo
          </Badge>
        </div>
        
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-600 dark:text-green-400">
              <p className="mb-1">
                <strong>Estadísticas filtradas:</strong> Los gráficos, tablas y métricas ahora muestran solo datos del barrio {selectedBarrio}.
              </p>
              <p>
                <strong>Datos en tiempo real:</strong> La información se actualiza automáticamente desde la API del backend.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
