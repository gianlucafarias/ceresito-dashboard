"use client";

import * as React from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/handle-error";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { updateReclamoEstado } from "../_lib/actions";
import { DeleteTasksDialog } from "./delete-tasks-dialog";
import { UpdateTaskSheet } from "./update-task-sheet";
import { labelEnum, statusEnum } from "@/db/schema";
import { getStatusIcon } from "../_lib/utils";

export interface Reclamo {
  id: number;
  fecha: string;
  nombre: string;
  reclamo: string;
  ubicacion: string;
  barrio: string;
  telefono: string;
  estado: string;
  detalle: string;
  prioridad: string | null;
  latitud: string;
  longitud: string;
  cuadrillaid: number | null;
}

export function getColumns(): ColumnDef<Reclamo>[] {
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
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => formatDate(new Date(row.getValue("fecha"))),
      enableSorting: false,
      enableHiding: false,
      
    },
    {
      accessorKey: "detalle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reclamo" />
      ),
      cell: ({ row }) => {
        const label = labelEnum.find(
          (label) => label === row.original.reclamo
        )        
        return (
          <div className="flex space-x-2">
            {label && <Badge variant="outline">{label}</Badge>}
            <span className="max-w-[31.25rem] truncate font-medium">
              {row.getValue("detalle")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "ubicacion",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ubicación" />
      ),
      cell: ({ row }) => <div>{row.getValue("ubicacion")}</div>,
    },
    {
      accessorKey: "barrio",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Barrio" />
      ),
      cell: ({ row }) => <div>{row.getValue("barrio")}</div>,
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const estado = row.getValue("estado");

        if (!estado) return null;

        const Icon = getStatusIcon(estado);

        return (
          <div className="flex w-[6.25rem] items-center">
            <Icon
              className="mr-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="capitalize">{estado}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const [isUpdatePending, startUpdateTransition] = React.useTransition();
        const [showUpdateTaskSheet, setShowUpdateTaskSheet] =
          React.useState(false);
        const [showDeleteTaskDialog, setShowDeleteTaskDialog] =
          React.useState(false);

        return (
          <>
            <UpdateTaskSheet
              open={showUpdateTaskSheet}
              onOpenChange={setShowUpdateTaskSheet}
              task={row.original}
            />
            <DeleteTasksDialog
              open={showDeleteTaskDialog}
              onOpenChange={setShowDeleteTaskDialog}
              tasks={[row.original]}
              showTrigger={false}
              onSuccess={() => row.toggleSelected(false)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <DotsHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setShowUpdateTaskSheet(true)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Cambiar Estado</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={row.original.estado}
                      onValueChange={(value) => {
                        startUpdateTransition(async () => {
                          const { error } = await updateReclamoEstado(
                            row.original.id,
                            value
                          );

                          if (error) {
                            toast.error(getErrorMessage(error));
                          } else {
                            toast.success("Estado del Reclamo Actualizado");
                          }
                        });
                      }}
                    >
                      {statusEnum.map((label) => (
                        <DropdownMenuRadioItem
                          key={label}
                          value={label}
                          className="capitalize"
                          disabled={isUpdatePending}
                        >
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setShowDeleteTaskDialog(true)}
                >
                  Eliminar Reclamo
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];
}