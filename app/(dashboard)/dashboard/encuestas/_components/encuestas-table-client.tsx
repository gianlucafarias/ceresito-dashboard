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
  const [pageCount, setPageCount] = useState(7) // Forzar 7 páginas como devuelve el backend
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
  
  // Estado de paginación - Ajustado para 50 resultados por página
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(search.page) - 1,
    pageSize: 50, // Forzar 50 resultados por página para coincidir con el backend
  })

  // Usar el filtro de barrio del contexto
  const { selectedBarrio, isFiltered } = useBarrioFilter()

  // Función para obtener encuestas filtradas desde la API
  const getFilteredEncuestas = async (barrio?: string, customParams?: any) => {
    try {
      // Usar parámetros personalizados o los de search por defecto
      const params = customParams || search
      
      // Construir la URL base de la API con los parámetros de paginación
      let apiUrl = `https://api.ceres.gob.ar/api/api/encuestaobras/todas?page=${params.page}&per_page=${params.per_page}`

      // Forzar ordenamiento por ID ascendente para paginación correcta
      // Esto asegura que la página 1 tenga los IDs más bajos (1-10), página 2 (11-20), etc.
      apiUrl += `&sort=id&order=asc`
      
      // Si se especifica otro orden, sobrescribir
      if (params.sort && params.sort !== 'id.asc') {
        const [column, order] = params.sort.split(".")
        apiUrl = apiUrl.replace('&sort=id&order=asc', `&sort=${column}&order=${order}`)
      }

      // Parámetros de búsqueda
      if (params.search) {
        apiUrl += `&search=${encodeURIComponent(params.search)}`
      }
      
      // Filtro de barrio - NUEVO: usar el parámetro del backend
      if (barrio && barrio !== "todos") {
        apiUrl += `&barrio=${encodeURIComponent(barrio)}`
      }
      
      // Filtro de estado
      if (params.estado) {
        apiUrl += `&estado=${encodeURIComponent(params.estado)}`
      }
      
      // Fechas
      if (params.desde) {
        const fromDay = new Date(params.desde).toISOString()
        apiUrl += `&desde=${fromDay}`
      }
      if (params.hasta) {
        const toDay = new Date(params.hasta).toISOString()
        apiUrl += `&hasta=${toDay}`
      }

      console.log("🌐 Llamando a API:", {
        url: apiUrl,
        paginaSolicitada: params.page,
        perPage: params.per_page,
        perPageEsperado: 10,
        params: params,
        barrio: barrio
      })

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
      
      // USAR EXACTAMENTE lo que devuelve el backend para pageCount
      // El backend devuelve 7 páginas, no 32
      const pageCount = totalPages || Math.ceil(total / 50)
      
      console.log("📊 Paginación calculada (client):", {
        total,
        per_page: 50,
        calculatedPageCount: Math.ceil(total / 50),
        backendTotalPages: totalPages,
        finalPageCount: pageCount,
        encuestasEnPagina: encuestas.length,
        decision: "USANDO BACKEND TOTALPAGES"
      })
      
      return { 
        data: encuestas, 
        pageCount: pageCount, // Usar exactamente lo que devuelve el backend
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
        
        // Debug: verificar cuántos resultados recibimos
        console.log("📥 Datos iniciales cargados:", {
          solicitados: 50, // Ajustado a 50 para coincidir con el backend
          recibidos: result.data.length,
          problema: result.data.length !== 50 ? "⚠️ Backend no devuelve 50!" : "✅ OK"
        })
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
          
          // Resetear paginación a la primera página
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
          
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
          
          // Resetear paginación a la primera página
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        } catch (error) {
          toast.error("Error al cargar las encuestas")
        } finally {
          setIsLoading(false)
        }
      }
    }

    reloadDataWithFilter()
  }, [selectedBarrio, isFiltered, search, encuestasPromise])

  // Sincronizar paginación cuando cambien los parámetros de búsqueda
  useEffect(() => {
    setPagination({
      pageIndex: parseInt(search.page) - 1,
      pageSize: 50, // Siempre usar 50 resultados por página
    })
  }, [search.page]) // Removido search.per_page ya que siempre usamos 50

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

  // Manejador para cambios de paginación
  const handlePaginationChange = async (updater: any) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    
    console.log("🔄 Cambio de paginación solicitado:", {
      pageIndex: newPagination.pageIndex + 1,
      pageSize: newPagination.pageSize,
      totalPages: pageCount,
      currentData: data.length
    })
    
    // Actualizar el estado local primero
    setPagination(newPagination)
    
    // Recargar datos con la nueva página
    setIsLoading(true)
    try {
      let result
      
      // Crear parámetros para la nueva página - Siempre usar 50 por página
      const newParams = {
        page: String(newPagination.pageIndex + 1),
        per_page: "50", // Forzar 50 resultados por página para coincidir con el backend
        sort: search.sort,
        barrio: search.barrio,
        estado: search.estado,
        desde: search.desde,
        hasta: search.hasta,
        search: search.search
      }
      
      console.log("📋 Parámetros para nueva página:", newParams)
      
      if (isFiltered) {
        // Si hay filtro de barrio, usar la función de filtrado
        console.log("🎯 Llamando getFilteredEncuestas con filtro de barrio:", selectedBarrio)
        result = await getFilteredEncuestas(selectedBarrio, newParams)
      } else {
        // Si no hay filtro, usar la función normal
        console.log("🌍 Llamando getFilteredEncuestas sin filtro")
        result = await getFilteredEncuestas(undefined, newParams)
      }
      
      console.log("📊 Resultado de la API:", {
        encuestasRecibidas: result.data.length,
        perPageSolicitado: newParams.per_page,
        perPageRecibido: result.data.length,
        total: result.total,
        pageCount: result.pageCount,
        primeraEncuesta: result.data[0]?.id,
        ultimaEncuesta: result.data[result.data.length - 1]?.id,
        todasLasIds: result.data.map(e => e.id).join(', '),
        problema: result.data.length !== parseInt(newParams.per_page) ? "⚠️ BACKEND IGNORA per_page!" : "✅ OK"
      })
      
      // Actualizar datos y pageCount
      setData(result.data)
      setPageCount(result.pageCount)
      
      console.log("✅ Datos de página cargados:", {
        pagina: newPagination.pageIndex + 1,
        datos: result.data.length,
        total: result.total,
        pageCount: result.pageCount,
        pageCountAnterior: pageCount
      })
      
      console.log("🔄 Estado actualizado:", {
        nuevaData: result.data.length,
        nuevoPageCount: result.pageCount,
        nuevaPaginacion: newPagination
      })
      
    } catch (error) {
      console.error("❌ Error al cargar página:", error)
      toast.error("Error al cargar la página", {
        description: "No se pudieron cargar los datos de la página solicitada"
      })
    } finally {
      setIsLoading(false)
    }
    
    // Construir nueva URL con los parámetros de paginación
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(newPagination.pageIndex + 1))
    url.searchParams.set('per_page', String(newPagination.pageSize))
    
    // Navegar a la nueva URL
    window.history.pushState({}, '', url.toString())
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
  console.log("🏗️ Configurando tabla con:", { 
    data: data.length, 
    pageCount, 
    pagination,
    totalEncuestas: data.length * pageCount // Debug: verificar cálculo
  })
  
  const table = useReactTable({
    data,
    columns,
    pageCount, // Agregar el pageCount calculado
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      console.log("🚨 onPaginationChange interceptado por TanStack Table:", updater)
      handlePaginationChange(updater)
    },
    manualPagination: true, // Habilitar paginación manual
    manualFiltering: true, // Habilitar filtrado manual
    manualSorting: true, // Habilitar ordenamiento manual
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // NO usar getPaginationRowModel porque estamos manejando la paginación manualmente
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })
  
  // Verificar que la tabla use nuestro pageCount
  console.log("✅ Tabla creada con:", {
    pageCountConfigurado: table.getPageCount(),
    pageCountEsperado: pageCount,
    coinciden: table.getPageCount() === pageCount,
    backendPages: 7,
    frontendPages: pageCount
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
        <div className="rounded-md border relative">
          {/* Indicador de carga */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Cargando datos...</span>
              </div>
            </div>
          )}
          
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
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Debug: Página actual {pagination.pageIndex + 1} de {pageCount} | Datos: {data.length} | Por página: 50
        </div>
        <div className="text-xs text-muted-foreground">
          Tabla pageCount: {table.getPageCount()} | Nuestro pageCount: {pageCount} | Backend: 7 páginas
        </div>
        <div className="text-xs text-green-600 font-medium">
          ✅ Ajustado para usar 7 páginas del backend (50 resultados por página)
        </div>
        <DataTablePagination table={table} />
      </div>
      
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