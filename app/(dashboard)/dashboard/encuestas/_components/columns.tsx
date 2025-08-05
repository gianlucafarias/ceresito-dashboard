"use client"

import { DotsHorizontalIcon, DownloadIcon } from "@radix-ui/react-icons"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EncuestaVecinal } from "@/types"
import { exportEncuestaToPDF } from "@/lib/export-encuesta-pdf"

export interface EncuestaTableRowAction {
  label: string
  action: (encuesta: EncuestaVecinal) => void
}

interface GetEncuestaColumnsProps {
  onViewDetails: (encuesta: EncuestaVecinal) => void
  onEdit?: (encuesta: EncuestaVecinal) => void
  onDelete?: (encuesta: EncuestaVecinal) => void
}

export function getEncuestaColumns({
  onViewDetails,
  onEdit,
  onDelete,
}: GetEncuestaColumnsProps): ColumnDef<EncuestaVecinal>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "fechaCreacion",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => {
        const fecha = new Date(row.getValue("fechaCreacion"))
        return (
          <div className="w-[100px]">
            {format(fecha, "dd/MM/yyyy", { locale: es })}
          </div>
        )
      },
      enableSorting: true,
      enableHiding: false,
    },
    // DNI removido por ser campo sensible
    {
      accessorKey: "barrio",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Barrio" />
      ),
      cell: ({ row }) => {
        return (
          <div className="max-w-[150px] truncate font-medium">
            {row.getValue("barrio")}
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "obrasUrgentes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Obras Urgentes" />
      ),
      cell: ({ row }) => {
        const obras = row.getValue("obrasUrgentes") as string[]
        const abreviaciones = {
          "Pavimentación de calles": "Pavimentación",
          "Veredas y rampas accesibles": "Veredas/Rampas", 
          "Mantenimiento de las calles": "Mant. Calles",
          "Limpieza": "Limpieza",
          "Plazas y espacios verdes": "Espacios Verdes",
          "Cordón cuneta": "Cordón Cuneta",
          "Cloacas": "Cloacas",
          "Desagües pluviales": "Desagües"
        }
        
        return (
          <div className="max-w-[180px]">
            <div className="flex flex-wrap gap-1">
              {obras.slice(0, 2).map((obra, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs cursor-help" 
                  title={obra}
                >
                  {abreviaciones[obra as keyof typeof abreviaciones] || 
                   (obra.length > 12 ? `${obra.substring(0, 9)}...` : obra)}
                </Badge>
              ))}
              {obras.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-help"
                  title={obras.slice(2).join(", ")}
                >
                  +{obras.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "serviciosMejorar",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Servicios a Mejorar" />
      ),
      cell: ({ row }) => {
        const servicios = row.getValue("serviciosMejorar") as string[]
        const abreviaciones = {
          "Mantenimiento de las calles": "Mant. Calles",
          "Mantenimiento de los espacios verdes": "Mant. Espacios",
          "Limpieza / recolección de residuos": "Limpieza/Residuos",
          "Arbolado / poda": "Arbolado/Poda",
          "Alumbrado público": "Alumbrado",
          "Seguridad": "Seguridad"
        }
        
        return (
          <div className="max-w-[180px]">
            <div className="flex flex-wrap gap-1">
              {servicios.slice(0, 2).map((servicio, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs cursor-help"
                  title={servicio}
                >
                  {abreviaciones[servicio as keyof typeof abreviaciones] || 
                   (servicio.length > 12 ? `${servicio.substring(0, 9)}...` : servicio)}
                </Badge>
              ))}
              {servicios.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-help"
                  title={servicios.slice(2).join(", ")}
                >
                  +{servicios.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "quiereContacto",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contacto" />
      ),
      cell: ({ row }) => {
        const quiereContacto = row.getValue("quiereContacto") as boolean
        return (
          <Badge variant={quiereContacto ? "default" : "secondary"}>
            {quiereContacto ? "Sí" : "No"}
          </Badge>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "nombreCompleto",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => {
        const nombre = row.getValue("nombreCompleto") as string
        return (
          <div className="max-w-[150px] truncate">
            {nombre || "-"}
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const estado = row.getValue("estado") as string
        return (
          <Badge 
            variant={estado === "completada" ? "default" : "secondary"}
          >
            {estado}
          </Badge>
        )
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const encuesta = row.original

        const handleExportPDF = () => {
          try {
            toast.success("Generando PDF...", {
              description: "Preparando el archivo para descarga.",
            });

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

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => onViewDetails(encuesta)}>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(encuesta)}>
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(encuesta)}
                  className="text-destructive"
                >
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}