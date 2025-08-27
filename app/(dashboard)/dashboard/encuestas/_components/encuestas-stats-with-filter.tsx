"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import EncuestasStatsCards from "./encuestas-stats-cards"
import ObrasUrgentesChart from "./obras-urgentes-chart"
import ServiciosChart from "./servicios-chart"
import BarriosChart from "./barrios-chart"
import ComentariosOtrosCard from "./comentarios-otros-card"
import EncuestaDetailDialog from "./encuesta-detail-dialog"
import FilterInfoBanner from "./filter-info-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { getEncuestaById } from "../_lib/actions"
import { useBarrioFilter } from "./barrio-filter-context"
import { useBarrioFilterLogic } from "./use-barrio-filter"
import type { EncuestaVecinal, ComentarioOtro } from "@/types"

interface EncuestasStatsWithFilterProps {
  initialStats: {
    totalEncuestas: number
    totalBarrios: number
    encuestasPorBarrio: Array<{ nombre: string; cantidad: number }>
    obrasUrgentesTop: Array<{ nombre: string; cantidad: number }>
    serviciosMejorarTop: Array<{ nombre: string; cantidad: number }>
    participacionContacto: {
      quieren: number
      noQuieren: number
    }
    otrosComentarios: {
      obrasUrgentesOtro: ComentarioOtro[]
      serviciosMejorarOtro: ComentarioOtro[]
      espaciosYPropuestas: {
        espacioMejorar: ComentarioOtro[]
        propuestas: ComentarioOtro[]
      }
    }
    ultimasEncuestas: Array<{
      id: number
      barrio: string
      fechaCreacion: string
    }>
  }
}

export default function EncuestasStatsWithFilter({ initialStats }: EncuestasStatsWithFilterProps) {
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEncuesta, setSelectedEncuesta] = useState<EncuestaVecinal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  const { selectedBarrio, isFiltered, setSelectedBarrio } = useBarrioFilter()
  const { getFilterParams, shouldFilterData } = useBarrioFilterLogic()

  // Función para recargar datos filtrados (se implementará cuando el backend esté listo)
  const reloadFilteredData = async () => {
    if (!shouldFilterData()) {
      return // No hacer nada si no hay filtro
    }

    setIsLoading(true)
    try {
      const filterParams = getFilterParams()
      
      // TODO: Implementar llamada a la API con filtros
      // const response = await fetch(`/api/encuestaobras/estadisticas?${new URLSearchParams(filterParams)}`)
      // const newStats = await response.json()
      // setStats(newStats.data)
      
      toast.success("Datos filtrados cargados", {
        description: `Mostrando estadísticas del barrio ${selectedBarrio}`,
      })
    } catch (error) {
      toast.error("Error al cargar datos filtrados", {
        description: "No se pudieron cargar las estadísticas del barrio seleccionado",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Recargar datos cuando cambie el filtro
  useEffect(() => {
    if (shouldFilterData()) {
      reloadFilteredData()
    }
  }, [selectedBarrio])

  const handleComentarioClick = async (encuestaId: number) => {
    try {
      const result = await getEncuestaById(encuestaId)
      
      if (result.error) {
        toast.error("Error al cargar encuesta", {
          description: result.error,
        })
        return
      }

      if (result.data) {
        setSelectedEncuesta(result.data)
        setDetailDialogOpen(true)
      }
    } catch (error) {
      toast.error("Error al cargar encuesta", {
        description: "Ocurrió un error inesperado.",
      })
    }
  }

  const handleClearFilter = () => {
    setSelectedBarrio("todos")
    setStats(initialStats) // Restaurar estadísticas globales
    toast.success("Filtro limpiado", {
      description: "Mostrando todas las estadísticas",
    })
  }

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
    <>
      {/* Indicador de filtro activo */}
      {isFiltered && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Filtrado por barrio:
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {selectedBarrio}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reloadFilteredData}
                disabled={isLoading}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Actualizar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="space-y-6">
        {/* Tarjetas de estadísticas generales */}
        <EncuestasStatsCards stats={stats} />

        {/* Obras Urgentes + Comentarios Otros */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ObrasUrgentesChart data={stats.obrasUrgentesTop} />
          <ComentariosOtrosCard
            title="Otras Obras Mencionadas"
            comentarios={stats.otrosComentarios?.obrasUrgentesOtro || []}
            onComentarioClick={handleComentarioClick}
          />
        </div>

        {/* Servicios a Mejorar + Comentarios Otros */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ServiciosChart data={stats.serviciosMejorarTop} />
          <ComentariosOtrosCard
            title="Otros Servicios Mencionados"
            comentarios={stats.otrosComentarios?.serviciosMejorarOtro || []}
            onComentarioClick={handleComentarioClick}
          />
        </div>

        {/* Barrios + Espacios y Propuestas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BarriosChart data={stats.encuestasPorBarrio} />
          <div className="grid gap-4 grid-rows-2">
            <ComentariosOtrosCard
              title="Espacios a Mejorar"
              comentarios={stats.otrosComentarios?.espaciosYPropuestas?.espacioMejorar || []}
              onComentarioClick={handleComentarioClick}
              compact
            />
            <ComentariosOtrosCard
              title="Propuestas Adicionales"
              comentarios={stats.otrosComentarios?.espaciosYPropuestas?.propuestas || []}
              onComentarioClick={handleComentarioClick}
              compact
            />
          </div>
        </div>
      </div>

      {/* Dialog para mostrar detalles de encuesta */}
      <EncuestaDetailDialog
        encuesta={selectedEncuesta}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  )
}

