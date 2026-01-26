"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, X, RefreshCw, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import EncuestasStatsCards from "./encuestas-stats-cards"
import ComentariosOtrosCard from "./comentarios-otros-card"
import EncuestaDetailDialog from "./encuesta-detail-dialog"
import FilterInfoBanner from "./filter-info-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { getEncuestaById } from "../_lib/actions"
import { toast } from "sonner"
import { useBarrioFilter } from "./barrio-filter-context"
import { useBarrioFilterLogic } from "./use-barrio-filter"
import type { EncuestaVecinal, ComentarioOtro } from "@/types"
import { exportEncuestasFiltradasPDF } from "@/lib/export-encuesta-pdf"

const LazyObrasUrgentesChart = dynamic(
  () => import("./obras-urgentes-chart"),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

const LazyServiciosChart = dynamic(
  () => import("./servicios-chart"),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

const LazyBarriosChart = dynamic(
  () => import("./barrios-chart"),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

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

export default function EncuestasStats({ stats: initialStats }: EncuestasStatsProps) {
  const [stats, setStats] = useState(initialStats)
  const [selectedEncuesta, setSelectedEncuesta] = useState<EncuestaVecinal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  const { selectedBarrio, isFiltered, setSelectedBarrio } = useBarrioFilter()
  const { reloadFilteredData, clearFilter, isLoading: isFilterLoading } = useBarrioFilterLogic()

  // Usar el estado de carga del hook
  const isLoading = isFilterLoading

  // Recargar datos cuando cambie el filtro
  useEffect(() => {
    const handleFilterChange = async () => {
      if (isFiltered) {
        try {
          const newStats = await reloadFilteredData()
          
          if (newStats) {
            // Mantener los datos de todos los barrios para el gráfico de barrios
            const statsWithAllBarrios = {
              ...newStats,
              encuestasPorBarrio: initialStats.encuestasPorBarrio // Siempre mostrar todos los barrios
            }
            setStats(statsWithAllBarrios)
          } else {
            console.error("❌ No se pudieron cargar las estadísticas filtradas")
            toast.error("Error al cargar datos filtrados", {
              description: "No se pudieron obtener las estadísticas del barrio seleccionado"
            })
          }
        } catch (error) {
          console.error("❌ Error al cargar datos filtrados:", error)
          toast.error("Error al cargar datos filtrados", {
            description: "Ocurrió un error inesperado al cargar las estadísticas del barrio"
          })
        }
      } else {
        // Si se volvió a "todos", restaurar estadísticas iniciales
        setStats(initialStats)
      }
    }

    handleFilterChange()
  }, [selectedBarrio, isFiltered, reloadFilteredData, initialStats])

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

  const handleClearFilter = async () => {
    const newStats = await clearFilter()
    if (newStats) {
      setStats(newStats)
    }
  }

  const handleRefreshFilteredData = async () => {
    if (isFiltered) {
      const newStats = await reloadFilteredData()
      if (newStats) {
        setStats(newStats)
      }
    }
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
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:border-blue-600 dark:text-blue-200">
                {selectedBarrio}
              </Badge>
              {isLoading && (
                <div className="flex items-center space-x-2 ml-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs text-blue-600">Cargando...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshFilteredData}
                disabled={isLoading}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isFilterLoading ? 'animate-spin' : ''}`} />
                {isFilterLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                disabled={isLoading}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtro
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    // Obtener encuestas del barrio (hasta 1000)
                    const url = `https://api.ceres.gob.ar/api/api/encuestaobras/todas?page=1&per_page=1000&barrio=${encodeURIComponent(selectedBarrio)}`
                    const resp = await fetch(url, { cache: 'no-store' })
                    if (!resp.ok) throw new Error('No se pudieron obtener encuestas del barrio')
                    const data = await resp.json()
                    const encuestas: EncuestaVecinal[] = data?.data?.encuestas || []

                    if (!encuestas.length) {
                      toast.info('No hay encuestas para exportar')
                      return
                    }

                    exportEncuestasFiltradasPDF({
                      barrio: selectedBarrio,
                      stats: {
                        totalEncuestas: (stats as any)?.totalEncuestas || encuestas.length,
                        obrasUrgentesTop: stats.obrasUrgentesTop || [],
                        serviciosMejorarTop: stats.serviciosMejorarTop || [],
                        participacionContacto: (stats as any)?.participacionContacto,
                        otrosComentarios: (stats as any)?.otrosComentarios
                      },
                      encuestas
                    })
                  } catch (e: any) {
                    console.error(e)
                    toast.error('Error al exportar PDF', { description: e?.message || 'Intenta nuevamente.' })
                  }
                }}
                className="h-8 px-2"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

   

      <div className="space-y-6">
        {/* Tarjetas de estadísticas generales */}
        <EncuestasStatsCards stats={stats} />

        {/* Indicador de carga para gráficos */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-blue-600">Cargando gráficos del barrio {selectedBarrio}...</span>
            </div>
          </div>
        )}

        {/* Obras Urgentes + Comentarios Otros - Solo mostrar cuando no esté cargando */}
        {!isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <LazyObrasUrgentesChart data={stats.obrasUrgentesTop} />
            <ComentariosOtrosCard
              title="Otras Obras Mencionadas"
              comentarios={stats.otrosComentarios?.obrasUrgentesOtro || []}
              onComentarioClick={handleComentarioClick}
            />
          </div>
        )}

        {/* Servicios a Mejorar + Comentarios Otros - Solo mostrar cuando no esté cargando */}
        {!isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <LazyServiciosChart data={stats.serviciosMejorarTop} />
            <ComentariosOtrosCard
              title="Otros Servicios Mencionados"
              comentarios={stats.otrosComentarios?.serviciosMejorarOtro || []}
              onComentarioClick={handleComentarioClick}
            />
          </div>
        )}

        {/* Barrios + Espacios y Propuestas - Solo mostrar cuando no esté cargando */}
        {!isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <LazyBarriosChart data={stats.encuestasPorBarrio} />
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
        )}
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
