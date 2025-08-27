import React, { Suspense } from "react"
import { EncuestaVecinal } from "@/types"
import { getEncuestasSchema } from "../_lib/validations"
import { getEncuestas } from "../_lib/queries"
import EncuestasTableClient from "./encuestas-table-client"

interface EncuestasTableProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function EncuestasTable({ searchParams }: EncuestasTableProps) {
  return (
    <Suspense fallback={<TableLoadingSkeleton />}>
      <EncuestasTableContent searchParams={searchParams} />
    </Suspense>
  )
}

interface EncuestasTableContentProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

async function EncuestasTableContent({ searchParams }: EncuestasTableContentProps) {
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
    <EncuestasTableClient
      encuestasPromise={encuestasPromise}
      search={search}
    />
  )
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