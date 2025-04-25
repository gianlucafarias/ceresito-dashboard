import { Metadata } from "next"
import { Reclamo } from "../_components/tasks-table-columns"
import { ReclamoDetalles } from "./_components/reclamo-detalles"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Detalles del Reclamo",
  description: "Detalles completos del reclamo",
}

interface ReclamoPageProps {
  params: {
    id: string
  }
}

export default async function ReclamoPage({ params }: ReclamoPageProps) {
  // Intentar obtener los datos del reclamo
  let reclamo: Reclamo | null = null
  let historialReclamos: Reclamo[] = []
  
  try {
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${params.id}`, {
      next: { revalidate: 60 } // Revalidar cada minuto
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return notFound()
      }
      throw new Error(`Error al obtener el reclamo: ${response.statusText}`)
    }
    
    reclamo = await response.json()

    // Si obtuvimos el reclamo y tiene un número de teléfono, buscar historial
    if (reclamo && reclamo.telefono) {
      try {
        const responseHistorial = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/telefono/${reclamo.telefono}`, {
          next: { revalidate: 60 } // Revalidar cada minuto también para el historial
        })

        if (responseHistorial.ok) {
          historialReclamos = await responseHistorial.json()
          // Filtrar el reclamo actual del historial si viene incluido
          historialReclamos = historialReclamos.filter(r => r.id !== reclamo?.id);
        } else {
          // Si no se encuentra historial (404) o hay otro error, simplemente no mostramos historial
          console.warn(`No se pudo obtener el historial para el teléfono ${reclamo.telefono}: ${responseHistorial.statusText}`)
        }
      } catch (errorHistorial) {
        console.error("Error al cargar el historial de reclamos:", errorHistorial)
        // Continuamos sin historial si falla esta llamada
      }
    }

  } catch (error) {
    console.error("Error al cargar el reclamo:", error)
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/15 p-4 rounded-md">
          <h1 className="text-xl font-semibold text-destructive mb-2">Error al cargar los datos</h1>
          <p>No se pudo obtener la información del reclamo. Por favor, intente nuevamente.</p>
        </div>
      </div>
    )
  }
  
  if (!reclamo) {
    return notFound()
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Detalles del Reclamo #{params.id}</h1>
      <ReclamoDetalles reclamo={reclamo} historial={historialReclamos} />
    </div>
  )
} 