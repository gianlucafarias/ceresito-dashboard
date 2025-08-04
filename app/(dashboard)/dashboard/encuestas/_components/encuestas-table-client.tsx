"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { EncuestaVecinal } from "@/types"
import { getEncuestaColumns } from "./columns"
import EncuestaDetailDialog from "./encuesta-detail-dialog"
import EditEncuestaDialog from "./edit-encuesta-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { deleteEncuesta } from "../_lib/actions"
import { EncuestasTableToolbar } from "./encuestas-table-toolbar"

interface EncuestasTableClientProps {
  initialData: EncuestaVecinal[]
  pageCount: number
  search: any
}

export default function EncuestasTableClient({ 
  initialData, 
  pageCount, 
  search 
}: EncuestasTableClientProps) {
  const [selectedEncuesta, setSelectedEncuesta] = useState<EncuestaVecinal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Estados de la tabla
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const handleEdit = (encuesta: EncuestaVecinal) => {
    setSelectedEncuesta(encuesta)
    setEditDialogOpen(true)
  }

  const handleDelete = (encuesta: EncuestaVecinal) => {
    setSelectedEncuesta(encuesta)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedEncuesta) return

    setIsDeleting(true)
    try {
      const result = await deleteEncuesta(selectedEncuesta.id)
      
      if (result.error) {
        toast.error("Error al eliminar", {
          description: result.error,
        })
        return
      }

      toast.success("Encuesta eliminada", {
        description: "La encuesta se ha eliminado correctamente.",
      })
      
      setDeleteDialogOpen(false)
      setSelectedEncuesta(null)
      
      // Recargar la página para actualizar los datos
      window.location.reload()
      
    } catch (error) {
      toast.error("Error al eliminar", {
        description: "Ocurrió un error inesperado.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    // Recargar la página para actualizar los datos
    window.location.reload()
  }

  // Definir columnas
  const columns = getEncuestaColumns({
    onViewDetails: (encuesta) => {
      setSelectedEncuesta(encuesta)
      setDetailDialogOpen(true)
    },
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  // Crear la tabla
  const table = useReactTable({
    data: initialData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <>
      <div className="w-full space-y-4">
        {/* Toolbar con búsqueda y exportación */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Buscar por nombre o barrio..."
                value={(table.getColumn("nombreCompleto")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("nombreCompleto")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
          </div>
          <EncuestasTableToolbar table={table} />
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron encuestas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Paginación */}
      <DataTablePagination table={table} />
      
      <EncuestaDetailDialog
        encuesta={selectedEncuesta}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Modal de edición */}
      <EditEncuestaDialog
        encuesta={selectedEncuesta}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la encuesta
              #{selectedEncuesta?.id} de {selectedEncuesta?.barrio} y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}