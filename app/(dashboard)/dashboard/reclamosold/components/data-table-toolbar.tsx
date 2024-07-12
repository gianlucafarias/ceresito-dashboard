"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/(dashboard)/dashboard/reclamosold/components/data-table-view-options"
import { estados, prioridades } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DatePickerWithRange } from "./DatePickerWithRange"
import { useState } from "react"
import { AsignarCuadrillaModal } from "./asignar-cuadrilla-modal" // Importar el modal de asignar cuadrilla

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  cuadrillas: any[]
}

export function DataTableToolbar<TData>({
  table,
  cuadrillas
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([])

  const handleAsignarClick = () => {
    const selectedReclamos = table.getSelectedRowModel().flatRows.map((row) => row.original)
    setSelectedRows(selectedReclamos)
    setIsModalOpen(true)
  }

  const handleDateChange = (range: { from: Date | null, to: Date | null }) => {
    if (range.from && range.to) {
      table.getColumn("fecha")?.setFilterValue([range.from, range.to])
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRows([])
  }

  const handleSuccessfulUpdate = () => {
    setIsModalOpen(false)
    setSelectedRows([])
    table.resetRowSelection()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filtrar reclamos..."
            value={(table.getColumn("reclamo")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("reclamo")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {table.getColumn("estado") && (
            <DataTableFacetedFilter
              column={table.getColumn("estado")}
              title="Estado"
              options={estados}
            />
          )}
          {table.getColumn("prioridad") && (
            <DataTableFacetedFilter
              column={table.getColumn("prioridad")}
              title="Prioridad"
              options={prioridades}
            />
          )}
          <DatePickerWithRange onChange={handleDateChange} />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleAsignarClick}
            disabled={table.getSelectedRowModel().flatRows.length === 0}
          >
            Asignar
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <AsignarCuadrillaModal
        open={isModalOpen}
        onClose={handleCloseModal}
        selectedReclamos={selectedRows}
        cuadrillas={cuadrillas}
        onSuccessfulUpdate={handleSuccessfulUpdate}
      />
    </>
  )
}
