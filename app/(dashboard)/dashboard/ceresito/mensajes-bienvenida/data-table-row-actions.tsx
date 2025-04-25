'use client'

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Importar la interfaz (idealmente desde un archivo común)
interface MensajeBienvenida {
    id: string | number;
    valor: string;
    activo: boolean;
    fecha_actualizacion: string; 
    fecha_expiracion?: string | null; 
}

interface DataTableRowActionsProps<TData extends MensajeBienvenida> {
  row: Row<TData>
  // Añadir función para abrir el diálogo de edición
  onEdit: (mensaje: TData) => void;
}

export function DataTableRowActions<TData extends MensajeBienvenida>({
  row,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const mensaje = row.original // Acceder a los datos originales de la fila

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(mensaje)}>
          Editar
        </DropdownMenuItem>
        {/* Aquí se podrían añadir más opciones como "Eliminar" en el futuro */}
        {/* <DropdownMenuSeparator /> */}
        {/* <DropdownMenuItem>Eliminar</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 