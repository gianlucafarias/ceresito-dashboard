"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { DownloadIcon } from "@radix-ui/react-icons"
import { exportEncuestaToPDF } from "@/lib/export-encuesta-pdf"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EncuestaVecinal } from "@/types"

interface EncuestaDetailDialogProps {
  encuesta: EncuestaVecinal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const handleExportarPDF = (encuesta: EncuestaVecinal) => {
  if (!encuesta || !encuesta.id) {
    toast.error("Error", {
      description: "No se pudo obtener el ID de la encuesta para exportar.",
    });
    return;
  }

  try {
    toast.success("Generando PDF...", {
      description: "Preparando el archivo para descarga.",
    });

    // Generar PDF desde el frontend
    exportEncuestaToPDF(encuesta);

    toast.success("PDF Generado", {
      description: `El archivo encuesta-vecinal-${encuesta.id}.pdf se ha descargado correctamente.`,
    });

  } catch (error) {
    toast.error("Error al generar PDF", {
      description: error instanceof Error ? error.message : "Ocurrió un error desconocido al generar el PDF.",
    });
  }
}

export default function EncuestaDetailDialog({
  encuesta,
  open,
  onOpenChange,
}: EncuestaDetailDialogProps) {
  if (!encuesta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalles de la Encuesta</DialogTitle>
          <DialogDescription>
            Encuesta #{encuesta.id} - {encuesta.barrio}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barrio</p>
                  <p className="text-sm">{encuesta.barrio}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="text-sm">
                    {format(new Date(encuesta.fechaCreacion), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={encuesta.estado === "completada" ? "default" : "secondary"}>
                    {encuesta.estado}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Obras Urgentes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Obras Urgentes</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {encuesta.obrasUrgentes.map((obra, index) => (
                    <Badge key={index} variant="secondary">
                      {obra}
                    </Badge>
                  ))}
                </div>
                {encuesta.obrasUrgentesOtro && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Otra obra urgente especificada:</p>
                    <p className="text-sm">{encuesta.obrasUrgentesOtro}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Servicios a Mejorar */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Servicios a Mejorar</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {encuesta.serviciosMejorar.map((servicio, index) => (
                    <Badge key={index} variant="outline">
                      {servicio}
                    </Badge>
                  ))}
                </div>
                {encuesta.serviciosMejorarOtro && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Otro servicio especificado:</p>
                    <p className="text-sm">{encuesta.serviciosMejorarOtro}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Espacios y Propuestas */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Espacios y Propuestas</h3>
              <div className="space-y-4">
                {encuesta.espacioMejorar && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Espacio específico a mejorar:</p>
                    <p className="text-sm">{encuesta.espacioMejorar}</p>
                  </div>
                )}
                {encuesta.propuesta && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Propuesta del vecino:</p>
                    <p className="text-sm">{encuesta.propuesta}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Información de Contacto */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Información de Contacto</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">¿Quiere ser contactado?</p>
                  <Badge variant={encuesta.quiereContacto ? "default" : "secondary"}>
                    {encuesta.quiereContacto ? "Sí" : "No"}
                  </Badge>
                </div>
                
                {encuesta.quiereContacto && (
                  <div className="grid grid-cols-1 gap-4">
                    {encuesta.nombreCompleto && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                        <p className="text-sm">{encuesta.nombreCompleto}</p>
                      </div>
                    )}
                    {encuesta.telefono && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p className="text-sm">{encuesta.telefono}</p>
                      </div>
                    )}
                    {encuesta.email && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{encuesta.email}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Información del Sistema</h3>
              <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">ID de Encuesta:</span> {encuesta.id}
                </div>
                <div>
                  <span className="font-medium">Fecha de Actualización:</span>{" "}
                  {format(new Date(encuesta.fechaActualizacion), "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleExportarPDF(encuesta)}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}