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
  
  // Referencia para exportar a PDF
  const componentRef = useRef<HTMLDivElement>(null)
  
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
  
  // Implementación simplificada de exportación a PDF
  const handleExportarPDF = () => {
    toast({
      title: "Preparando PDF",
      description: "Preparando la vista para imprimir o guardar como PDF...",
    })
    
    // Guardamos las clases originales para restaurarlas después
    const body = document.body;
    const originalBodyClass = body.className;
    const contenido = document.getElementById('reclamo-detalles');
    
    if (!contenido) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
      return;
    }
    
    // Creamos una nueva ventana para imprimir solo el contenido que queremos
    const ventanaImpresion = window.open('', '_blank');
    
    if (!ventanaImpresion) {
      toast({
        title: "Error",
        description: "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
        variant: "destructive",
      });
      return;
    }
    
    // Estilo CSS para la impresión
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Reclamo #${reclamo.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 10px;
            }
            .section {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #eee;
              border-radius: 5px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 16px;
            }
            .section-content {
              margin-left: 10px;
            }
            .label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            .estado {
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .estado-pendiente { background-color: #FEF9C3; color: #854D0E; }
            .estado-asignado { background-color: #DBEAFE; color: #1E40AF; }
            .estado-en-proceso { background-color: #FFEDD5; color: #9A3412; }
            .estado-completado { background-color: #DCFCE7; color: #166534; }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Detalle de Reclamo #${reclamo.id}</h1>
            <p>Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Información General</div>
            <div class="section-content">
              <p><span class="label">Fecha de creación:</span> ${fechaFormateada}</p>
              <p><span class="label">Estado:</span> <span class="estado estado-${reclamo.estado?.toLowerCase() || 'pendiente'}">${reclamo.estado || 'Pendiente'}</span></p>
              <p><span class="label">Prioridad:</span> ${reclamo.prioridad || 'No asignada'}</p>
              <p><span class="label">Categoría:</span> ${reclamo.reclamo || 'No especificada'}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Descripción del Problema</div>
            <div class="section-content">
              <p>${reclamo.detalle || 'Sin detalles'}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Ubicación</div>
            <div class="section-content">
              <p><span class="label">Dirección:</span> ${reclamo.ubicacion || 'No especificada'}</p>
              <p><span class="label">Barrio:</span> ${reclamo.barrio || 'No especificado'}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Datos del Solicitante</div>
            <div class="section-content">
              <p><span class="label">Nombre:</span> ${reclamo.nombre || 'No proporcionado'}</p>
              <p><span class="label">Teléfono:</span> ${reclamo.telefono || 'No proporcionado'}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Este documento es un comprobante de reclamo generado por el sistema de gestión municipal.</p>
            <p>Municipalidad de Ceres - Gestión de Reclamos</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print();" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Imprimir o Guardar como PDF
            </button>
          </div>
        </body>
      </html>
    `);
    
    ventanaImpresion.document.close();
    
    // Esperar a que el contenido se cargue y luego mostrar el diálogo de impresión
    setTimeout(() => {
      toast({
        title: "PDF listo",
        description: "Utilice el botón 'Imprimir o Guardar como PDF' o la opción de guardar como PDF de su navegador.",
      });
    }, 1000);
  }
  
  return (
    <>
      <Card ref={componentRef} id="reclamo-detalles" className="mb-6">
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