"use client"

import { DownloadIcon } from "@radix-ui/react-icons"
import { type Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { exportTableToCSV, exportTableToPDF } from "@/lib/export"
import { EncuestaVecinal } from "@/types"

interface EncuestasTableToolbarProps {
  table: Table<EncuestaVecinal>
}

export function EncuestasTableToolbar({ table }: EncuestasTableToolbarProps) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filtros adicionales pueden ir aquí en el futuro */}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportTableToCSV(table, {
              filename: 'encuestas_vecinales',
              excludeColumns: ['select', 'actions', 'dni'], // Excluir DNI por ser sensible
            })
          }
        >
          <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
          Exportar a Excel {selectedRowCount > 0 ? `(${selectedRowCount})` : ''}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportTableToPDF(table, {
              filename: 'encuestas_vecinales',
              excludeColumns: ['select', 'actions', 'dni'], // Excluir DNI por ser sensible
            })
          }
        >
          <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
          Exportar a PDF {selectedRowCount > 0 ? `(${selectedRowCount})` : ''}
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}