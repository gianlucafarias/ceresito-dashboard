import { Suspense } from "react"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import EncuestasStats from "./_components/encuestas-stats"
import EncuestasTable from "./_components/encuestas-table"
import { getEstadisticasEncuestas } from "./_lib/queries"

// Forzar renderizado dinámico - sin caché de página
export const dynamic = 'force-dynamic'

interface EncuestasPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function EncuestasPage({ searchParams }: EncuestasPageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-start justify-between">
        <Heading 
          title="Encuestas Vecinales" 
          description="Visualiza y administra las respuestas de las encuestas vecinales" 
        />
      </div>
      <Separator />
      
      <div className="space-y-4">
        {/* Sección de estadísticas */}
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <EncuestasStatsWrapper />
        </Suspense>

        <Separator />

        {/* Tabla de encuestas */}
        <Suspense fallback={<TableLoadingSkeleton />}>
          <EncuestasTable searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function EncuestasStatsWrapper() {
  try {
    const stats = await getEstadisticasEncuestas()
    return <EncuestasStats stats={stats} />
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-destructive">Error al cargar las estadísticas</p>
      </div>
    )
  }
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}