"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { reclamoSchema } from "../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onOpenDialog?: (reclamo: any) => void;
}

export function DataTableRowActions<TData>({
  row,
  onOpenDialog,
}: DataTableRowActionsProps<TData>) {
  const task = reclamoSchema.parse(row.original);

  const handleOpenDialogClick = () => {
    if (typeof onOpenDialog === 'function') {
      onOpenDialog(row.original);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
          </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
      <DropdownMenuItem onClick={handleOpenDialogClick}>Editar</DropdownMenuItem>

        <DropdownMenuItem>Asignar...</DropdownMenuItem>
        <DropdownMenuItem>Favorito</DropdownMenuItem>
        <DropdownMenuSeparator />
       
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Eliminar
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}