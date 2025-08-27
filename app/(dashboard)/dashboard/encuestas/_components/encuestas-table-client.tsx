"use client"

import React, { useState, useEffect } from "react"
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
import { useBarrioFilter } from "./barrio-filter-context"
import type { ApiResponse } from "../_types/api"

interface EncuestasTableClientProps {
  encuestasPromise: Promise<{ data: EncuestaVecinal[]; pageCount: number; total: number }>
  search: any
}

export default function EncuestasTableClient({ 
  encuestasPromise, 
  search 
}: EncuestasTableClientProps) {
  const [data, setData] = useState<EncuestaVecinal[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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

  // Usar el filtro de barrio del contexto
  const { selectedBarrio, isFiltered } = useBarrioFilter()

  // Función para obtener encuestas filtradas desde la API
  const getFilteredEncuestas = async (barrio?: string) => {
    try {
      // Construir la URL base de la API con los parámetros de paginación
      let apiUrl = `https://api.ceres.gob.ar/api/api/encuestaobras/todas?page=${search.page}&per_page=${search.per_page}`

      // Si no se especifica un orden, el backend aplicará el orden por defecto (ID descendente)
      if (search.sort) {
        const [column, order] = search.sort.split(".")
        apiUrl += `&sort=${column}&order=${order}`
      }

      // Parámetros de búsqueda
      if (search.search) {
        apiUrl += `&search=${encodeURIComponent(search.search)}`
      }
      
      // Filtro de barrio - NUEVO: usar el parámetro del backend
      if (barrio && barrio !== "todos") {
        apiUrl += `&barrio=${encodeURIComponent(barrio)}`
      }
      
      // Filtro de estado
      if (search.estado) {
        apiUrl += `&estado=${encodeURIComponent(search.estado)}`
      }
      
      // Fechas
      if (search.desde) {
        const fromDay = new Date(search.desde).toISOString()
        apiUrl += `&desde=${fromDay}`
      }
      if (search.hasta) {
        const toDay = new Date(search.hasta).toISOString()
        apiUrl += `&hasta=${toDay}`
      }

      const response = await fetch(apiUrl, {
        cache: 'no-store' // Siempre datos frescos
      })
      
      if (!response.ok) {
        throw new Error("Error al obtener las encuestas de la API externa")
      }

      const result: ApiResponse<{
        encuestas: EncuestaVecinal[]
        total: number
        page: number
        totalPages: number
      }> = await response.json()
      
      if (!result.success) {
        throw new Error("La API devolvió un error")
      }

      const { encuestas, total, page: currentPage, totalPages } = result.data
      const pageCount = totalPages || Math.ceil(total / search.per_page)
      
      return { 
        data: encuestas, 
        pageCount: pageCount,
        total: total 
      }
    } catch (error) {
      console.error("Error al obtener encuestas:", error)
      throw new Error("Error al obtener las encuestas de la API externa")
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const result = await encuestasPromise
        setData(result.data)
        setPageCount(result.pageCount)
      } catch (error) {
        toast.error("Error al cargar las encuestas")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [encuestasPromise])

  // Recargar datos cuando cambie el filtro de barrio
  useEffect(() => {
    const reloadDataWithFilter = async () => {
      if (isFiltered) {
        setIsLoading(true)
        try {
          // Crear nuevos parámetros de búsqueda con el filtro de barrio
          const newSearch = {
            ...search,
            barrio: selectedBarrio,
            page: "1" // Volver a la primera página cuando se cambie el filtro
          }
          
          const result = await getFilteredEncuestas(selectedBarrio)
          setData(result.data)
          setPageCount(result.pageCount)
          
          toast.success("Datos filtrados cargados", {
            description: `Mostrando encuestas del barrio ${selectedBarrio}`,
          })
        } catch (error) {
          toast.error("Error al cargar datos filtrados")
        } finally {
          setIsLoading(false)
        }
      } else {
        // Si se volvió a "todos", recargar datos originales
        setIsLoading(true)
        try {
          const result = await encuestasPromise
          setData(result.data)
          setPageCount(result.pageCount)
        } catch (error) {
          toast.error("Error al cargar las encuestas")
        } finally {
          setIsLoading(false)
        }
      }
    }

    reloadDataWithFilter()
  }, [selectedBarrio, isFiltered, search, encuestasPromise])

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
    data,
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

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
            {isFiltered && (
              <div className="text-sm text-muted-foreground">
                Filtrado por: <span className="font-medium">{selectedBarrio}</span>
              </div>
            )}
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
                    {isFiltered 
                      ? `No se encontraron encuestas en el barrio ${selectedBarrio}.`
                      : "No se encontraron encuestas."
                    }
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