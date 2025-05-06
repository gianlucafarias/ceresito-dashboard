"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, Clock, MapPin, Phone, User, AlertTriangle, 
  FileText, Send, Download, Calendar, MessageSquare, Users, Trash
} from "lucide-react"
import { Reclamo } from "../../_components/tasks-table-columns"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateReclamoEstado } from "../../_lib/actions"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link";

// Datos de ejemplo para las cuadrillas (en producción vendrían del backend)
const CUADRILLAS_EJEMPLO = [
  { id: 1, nombre: "Cuadrilla Norte", disponible: true },
  { id: 2, nombre: "Cuadrilla Sur", disponible: true },
  { id: 3, nombre: "Cuadrilla Este", disponible: false },
  { id: 4, nombre: "Cuadrilla Oeste", disponible: true },
]

// Datos de ejemplo para el historial (en producción vendrían del backend)
const HISTORIAL_EJEMPLO = [
  { 
    id: 1, 
    fecha: new Date(2023, 5, 15, 10, 30), 
    usuario: "Admin", 
    accion: "Reclamo creado", 
    estadoAnterior: null, 
    estadoNuevo: "PENDIENTE" 
  },
  { 
    id: 2, 
    fecha: new Date(2023, 5, 16, 9, 15), 
    usuario: "Juan Operario", 
    accion: "Cambio de estado", 
    estadoAnterior: "PENDIENTE", 
    estadoNuevo: "ASIGNADO" 
  },
  { 
    id: 3, 
    fecha: new Date(2023, 5, 18, 14, 45), 
    usuario: "María Supervisora", 
    accion: "Cambio de estado", 
    estadoAnterior: "ASIGNADO", 
    estadoNuevo: "EN_PROCESO" 
  },
]

// Datos de ejemplo para comentarios (en producción vendrían del backend)
const COMENTARIOS_EJEMPLO = [
  {
    id: 1,
    texto: "Se asignó cuadrilla para atender el reclamo mañana por la mañana.",
    fecha: new Date(2023, 5, 16, 9, 20),
    usuario: "Juan Operario",
  },
  {
    id: 2,
    texto: "La cuadrilla visitó el lugar pero necesita equipamiento adicional. Programado para mañana.",
    fecha: new Date(2023, 5, 18, 14, 50),
    usuario: "María Supervisora",
  }
]

const estadosOptions = [
  { value: "PENDIENTE", label: "Pendiente", icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  { value: "ASIGNADO", label: "Asignado", icon: <AlertTriangle className="h-4 w-4 text-blue-500" /> },
  { value: "EN_PROCESO", label: "En Proceso", icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
  { value: "COMPLETADO", label: "Completado", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
]

const prioridadesColors = {
  "ALTA": "bg-red-100 text-red-800",
  "MEDIA": "bg-yellow-100 text-yellow-800",
  "BAJA": "bg-blue-100 text-blue-800",
}

interface ReclamoDetallesProps {
  reclamo: Reclamo
  historial?: Reclamo[];
}

export function ReclamoDetalles({ reclamo, historial }: ReclamoDetallesProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [estadoActual, setEstadoActual] = useState(reclamo.estado || "PENDIENTE")
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState<string>(reclamo.cuadrillaid?.toString() || "")
  const [comentarioNuevo, setComentarioNuevo] = useState("")
  const [notificarUsuario, setNotificarUsuario] = useState(true)
  const [isSubmittingComentario, setIsSubmittingComentario] = useState(false)
  
  // Ya no se usa la ref para la generación directa de PDF
  // const componentRef = useRef<HTMLDivElement>(null)
  
  // Formatear la fecha para mostrar
  const fechaFormateada = reclamo.fecha 
    ? format(new Date(reclamo.fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    : "Fecha desconocida"
  
  const getEstadoBadge = (estado: string | null) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "ASIGNADO":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Asignado</Badge>
      case "EN_PROCESO":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">En Proceso</Badge>
      case "COMPLETADO":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }
  
  const getPrioridadBadge = (prioridad: string | null) => {
    if (!prioridad) return <Badge variant="outline">No asignada</Badge>
    
    const className = prioridadesColors[prioridad as keyof typeof prioridadesColors] || "bg-gray-100 text-gray-800"
    return <Badge variant="outline" className={className}>{prioridad}</Badge>
  }
  
  const handleChangeEstado = async (estado: string) => {
    setEstadoActual(estado)
    setIsSaving(true)
    
    try {
      // Enviamos el parámetro de notificación al backend
      const notificar = notificarUsuario
      
      await updateReclamoEstado(reclamo.id.toString(), estado, notificar)
      toast({
        title: "Estado actualizado",
        description: `El reclamo ha sido actualizado a estado ${estado}${notificarUsuario ? ' y se ha notificado al solicitante' : ''}`,
      })
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar el estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del reclamo",
        variant: "destructive",
      })
      setEstadoActual(reclamo.estado || "PENDIENTE") // Revertir si falla
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleAsignarCuadrilla = async () => {
    setIsSaving(true)
    
    try {
      // Implementamos la llamada al backend para asignar la cuadrilla
      const response = await fetch('/api/asignar-reclamo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reclamoId: reclamo.id,
          cuadrillaId: cuadrillaSeleccionada,
          reclamoDetalles: reclamo,
          notificar: notificarUsuario
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al asignar la cuadrilla')
      }
      
      toast({
        title: "Cuadrilla asignada",
        description: `La cuadrilla ha sido asignada correctamente${notificarUsuario ? ' y se ha notificado al solicitante' : ''}`,
      })
      router.refresh()
    } catch (error) {
      console.error("Error al asignar la cuadrilla:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar la cuadrilla",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleEnviarComentario = async () => {
    if (!comentarioNuevo.trim()) return
    
    setIsSubmittingComentario(true)
    
    try {
      // Aquí iría la llamada al backend para guardar el comentario
      // Por ahora solo simulamos con un toast
      toast({
        title: "Comentario agregado",
        description: "El comentario ha sido agregado correctamente",
      })
      setComentarioNuevo("")
    } catch (error) {
      console.error("Error al agregar el comentario:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComentario(false)
    }
  }
  
  // Nueva implementación de handleExportarPDF que llama al API
  const handleExportarPDF = async () => {
    if (!reclamo || !reclamo.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener el ID del reclamo para exportar.",
        variant: "destructive",
      });
      return;
    }

    const idreclamo = reclamo.id;
    const apiUrl = `https://api.ceres.gob.ar/api/api/reclamo/${idreclamo}/pdf`; 

    toast({
      title: "Exportando PDF...",
      description: "Solicitando el PDF al servidor.",
    });

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorDetails = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorDetails += ` - ${errorData.message}`;
          } else if (typeof errorData === 'string') {
             errorDetails += ` - ${errorData}`;
          }
        } catch (e) { /* No hacer nada si el cuerpo del error no es JSON o está vacío */ }
        throw new Error(errorDetails);
      }

      const blob = await response.blob();

      if (blob.type === "application/json") {
          const errorText = await blob.text();
          let errorDetails = "La API devolvió un JSON en lugar de un PDF.";
          try {
              const errorData = JSON.parse(errorText);
              if (errorData && errorData.message) {
                  errorDetails += ` Mensaje: ${errorData.message}`;
              } else if (errorData && errorData.error) {
                   errorDetails += ` Error: ${errorData.error}`;
              }
          } catch (e) {
              errorDetails += ` Contenido: ${errorText}`;
          }
          toast({
              title: "Error de API",
              description: errorDetails,
              variant: "destructive",
          });
          return;
      }
      
      if (blob.type !== "application/pdf") {
          console.warn("La API no devolvió un PDF. Tipo recibido:", blob.type);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reclamo-${idreclamo}.pdf`; 
      document.body.appendChild(a); 
      a.click();
      a.remove(); 
      window.URL.revokeObjectURL(url); 

      toast({
        title: "PDF Descargado",
        description: `El archivo reclamo-${idreclamo}.pdf debería estar descargándose.`,
      });

    } catch (error) {
      console.error("Error al exportar PDF desde API:", error);
      toast({
        title: "Error al exportar PDF",
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      {/* La ref y el id ya no son necesarios para esta Card */}
      <Card /* ref={componentRef} id="reclamo-detalles" */ className="mb-6">
        <CardHeader>
          <div className="mb-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={handleExportarPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => router.push("/dashboard/reclamos")}
            >
              Volver a la lista
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Reclamo #{reclamo.id}</CardTitle>
              <CardDescription>Recibido: {fechaFormateada}</CardDescription>
            </div>
            <div className="space-x-2">
              {getEstadoBadge(reclamo.estado)}
              {getPrioridadBadge(reclamo.prioridad)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg">Categoría</h3>
              <p className="text-muted-foreground">{reclamo.reclamo || "No especificada"}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Descripción del problema</h3>
              <p className="text-muted-foreground">{reclamo.detalle || "Sin detalles"}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ubicación</p>
                  <p className="text-sm text-muted-foreground">{reclamo.ubicacion || "No especificada"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Barrio</p>
                  <p className="text-sm text-muted-foreground">{reclamo.barrio || "No especificado"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="w-full" onClick={() => router.push(`/dashboard/reclamos/${reclamo.id}/edit`)}>
              <FileText className="mr-2 h-4 w-4" />
              Editar reclamo
            </Button>
            <Button variant="outline" className="w-full" onClick={handleExportarPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/reclamos")}>
              Volver a la lista
            </Button>
            <Button variant="destructive" className="w-full">
              <Trash className="mr-2 h-4 w-4" />
              Eliminar reclamo
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Sección para mostrar el historial de reclamos */}
      {historial && historial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reclamos del Solicitante</CardTitle>
            <CardDescription>Otros reclamos realizados con el mismo número de teléfono.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {historial.map((histReclamo) => (
                <li key={histReclamo.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <Link href={`/dashboard/reclamos/${histReclamo.id}`} className="font-medium text-blue-600 hover:underline">
                        Reclamo #{histReclamo.id}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {histReclamo.reclamo} - {histReclamo.fecha ? format(new Date(histReclamo.fecha), "dd/MM/yyyy", { locale: es }) : 'Fecha desconocida'}
                      </p>
                    </div>
                    {getEstadoBadge(histReclamo.estado)}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
} 