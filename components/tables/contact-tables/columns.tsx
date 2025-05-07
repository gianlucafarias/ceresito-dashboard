"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Contact } from "@/types/contact";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";
// import { CellAction } from "./cell-action"; // Descomentar si se necesitan acciones por fila

export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "contact_name",
    header: "Nombre",
    cell: ({ row }) => {
      const name = row.original.contact_name || "N/A";
      // Podríamos hacer el nombre un enlace también si se prefiere
      // return <Link href={`/dashboard/contacts/${row.original.id}`} className="hover:underline">{name}</Link>;
      return name;
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => row.original.phone || "N/A",
  },
  {
    accessorKey: "createdAt",
    header: "Fecha Registro",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    accessorKey: "lastInteraction",
    header: "Última interacción",
    cell: ({ row }) => 
      row.original.lastInteraction 
        ? new Date(row.original.lastInteraction).toLocaleString() 
        : "N/A",
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <Link href={`/dashboard/contacts/${row.original.id}`} passHref>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" /> Ver Detalles
        </Button>
      </Link>
    ),
  },
  // Descomentar si se necesitan acciones por fila
  // {
  //   id: "actions",
  //   cell: ({ row }) => <CellAction data={row.original} />,
  // },
]; 