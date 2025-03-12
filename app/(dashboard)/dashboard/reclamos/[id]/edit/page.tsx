import { Metadata } from "next"
import { Reclamo } from "../../_components/tasks-table-columns"
import { EditarReclamoForm } from "./_components/editar-reclamo-form"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Editar Reclamo",
  description: "Formulario para editar un reclamo",
}

interface EditarReclamoPageProps {
  params: {
    id: string
  }
}

export default async function EditarReclamoPage({ params }: EditarReclamoPageProps) {
  // Intentar obtener los datos del reclamo
  let reclamo: Reclamo | null = null
  
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
  } catch (error) {
    console.error("Error al cargar el reclamo:", error)
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/15 p-4 rounded-md">
          <h1 className="text-xl font-semibold text-destructive mb-2">Error al cargar los datos</h1>
          <p>No se pudo obtener la información del reclamo para editar. Por favor, intente nuevamente.</p>
        </div>
      </div>
    )
  }
  
  if (!reclamo) {
    return notFound()
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Reclamo #{params.id}</h1>
      <EditarReclamoForm reclamo={reclamo} />
    </div>
  )
} 