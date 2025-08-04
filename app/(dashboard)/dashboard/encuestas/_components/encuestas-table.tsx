import React, { Suspense } from "react"
import { EncuestaVecinal } from "@/types"
import { getEncuestasSchema } from "../_lib/validations"
import { getEncuestas } from "../_lib/queries"
import EncuestasTableClient from "./encuestas-table-client"

interface EncuestasTableProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function EncuestasTable({ searchParams }: EncuestasTableProps) {
  // Parsear parámetros de búsqueda
  const search = getEncuestasSchema.parse({
    page: searchParams?.page ?? "1",
    per_page: searchParams?.per_page ?? "10",
    sort: searchParams?.sort,
    barrio: searchParams?.barrio,
    estado: searchParams?.estado,
    desde: searchParams?.desde,
    hasta: searchParams?.hasta,
    search: searchParams?.search,
  })

  // Obtener datos de manera asíncrona
  const encuestasPromise = getEncuestas(search)

  return (
    <Suspense fallback={<TableLoadingSkeleton />}>
      <EncuestasTableContent 
        encuestasPromise={encuestasPromise}
        search={search}
      />
    </Suspense>
  )
}

interface EncuestasTableContentProps {
  encuestasPromise: Promise<{ data: EncuestaVecinal[]; pageCount: number; total: number }>
  search: any
}

async function EncuestasTableContent({ encuestasPromise, search }: EncuestasTableContentProps) {
  try {
    const { data, pageCount } = await encuestasPromise

    return (
      <EncuestasTableClient
        initialData={data}
        pageCount={pageCount}
        search={search}
      />
    )
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-destructive">Error al cargar las encuestas</p>
      </div>
    )
  }
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
      ))}
    </div>
  )
}