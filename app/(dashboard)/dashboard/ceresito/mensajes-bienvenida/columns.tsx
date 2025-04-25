"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions" // Importar el nuevo componente
// import { DataTableRowActions } from "./data-table-row-actions" // Para acciones futuras

// Importar helper para formatear fechas si existe, o definir uno simple
import { format } from 'date-fns'; // Asumiendo que date-fns está instalado
import { es } from 'date-fns/locale'; // Para formato en español

// Definición del tipo (debería coincidir con la de page.tsx o importarse de un archivo común)
interface MensajeBienvenida {
  id: string | number;
  clave: string;
  valor: string;
  activo: boolean;
  fecha_actualizacion: string; 
  fecha_expiracion?: string | null; 
}

// Función helper para formatear fechas de forma segura
const formatNullableDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    // Intentar parsear como ISO string primero
    return format(new Date(dateString), 'PPpp', { locale: es }); // Formato: 17 feb 2024, 15:30:00
  } catch (e) {
    console.error("Error formateando fecha:", dateString, e);
    return "Fecha inválida";
  }
};

// La definición de columnas ahora necesita una forma de recibir la función onEdit
// Podríamos hacer que columns sea una función que recibe onEdit:
export const getColumns = (onEdit: (mensaje: MensajeBienvenida) => void): ColumnDef<MensajeBienvenida>[] => [
  // Columna Clave (antes era Valor)
  {
    accessorKey: "clave",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clave" />
    ),
    cell: ({ row }) => {
      const clave = row.getValue("clave") as string;
      return <div className="font-medium" title={clave}>{clave}</div>
    },
    enableSorting: true,
    enableHiding: false,
  },
  // Columna Activo
  {
    accessorKey: "activo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Activo" />
    ),
    cell: ({ row }) => {
      const activo = row.getValue("activo")
      return activo ? <Badge variant="default">Sí</Badge> : <Badge variant="destructive">No</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Columna Fecha Actualización
  {
    accessorKey: "fecha_actualizacion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Última Actualización" />
    ),
    cell: ({ row }) => {
       return <span>{formatNullableDate(row.getValue("fecha_actualizacion"))}</span>
    },
  },
  // Columna Fecha Expiración
  {
    accessorKey: "fecha_expiracion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expira" />
    ),
    cell: ({ row }) => {
       return <span>{formatNullableDate(row.getValue("fecha_expiracion"))}</span>
    },
  },
  // Columna de Acciones
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions 
        row={row} 
        onEdit={onEdit}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

// Eliminar la exportación anterior si existía
// export const columns: ColumnDef<MensajeBienvenida>[] = [...] 