import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { labels, estados, prioridades } from "../data/data"
import { Task } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

const badgeStyle = (color: string) => ({
  borderColor: `${color}20`,
  backgroundColor: `${color}30`,
  color,
})

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar Todo"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()} // Evitar propagación del clic
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      const fechaRecibida = row.getValue("fecha");
      const fecha = new Date(fechaRecibida ?? "");
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const anio = fecha.getFullYear();
      const fechaFormateada = `${dia}/${mes}/${anio}`;
      return <div className="w-[70px] text-xs text-muted-foreground">{fechaFormateada}</div>;
    },
    enableSorting: false,
    enableHiding: false,
    filterFn: (row, id, filterValue) => {
      if (!filterValue) return true;
      const date = new Date(row.getValue(id));
      const [start, end] = filterValue;
      return date >= start && date <= end;
    },
  },
  {
    accessorKey: "reclamo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Detalle" />,
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.getValue("reclamo"));
      const rowData = row.original;
      const detalle = rowData.detalle && rowData.detalle.trim() !== "" ? rowData.detalle : "Sin detalles";

      return (
        <div className={`flex space-x-2 cursor-pointer `}>
          {label && <Badge variant={'default'}>{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">{detalle}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const estado = estados.find((estado) => estado.value === row.getValue("estado"))
      if (!estado) {
        return null
      }
      return (
        <div className="flex w-[100px] items-center">
          <Badge
            variant="outline"
            style={badgeStyle(estado.color)}
            className="mb-2 mr-2"
          >
            {estado.icon && <estado.icon color={estado.color ?? '#000000'} className="mr-2 h-4 w-4 text-muted-foreground" />}
            {estado.label}</Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "prioridad",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridad" />,
    cell: ({ row }) => {
      const prioridad = prioridades.find(
        (prioridad) => prioridad.value === row.getValue("prioridad")
      )
      if (!prioridad) {
        return null
      }
      return (
        <div className="flex items-center">
          {prioridad.icon && <prioridad.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{prioridad.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "acciones",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
