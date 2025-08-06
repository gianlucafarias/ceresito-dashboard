"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import EncuestasStatsCards from "./encuestas-stats-cards"
import ObrasUrgentesChart from "./obras-urgentes-chart"
import ServiciosChart from "./servicios-chart"
import BarriosChart from "./barrios-chart"
import ComentariosOtrosCard from "./comentarios-otros-card"
import EncuestaDetailDialog from "./encuesta-detail-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getEncuestaById } from "../_lib/actions"
import { toast } from "sonner"
import type { EncuestaVecinal, ComentarioOtro } from "@/types"

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

export default function EncuestasStats({ stats }: EncuestasStatsProps) {
  const [selectedEncuesta, setSelectedEncuesta] = useState<EncuestaVecinal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleComentarioClick = async (encuestaId: number) => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
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