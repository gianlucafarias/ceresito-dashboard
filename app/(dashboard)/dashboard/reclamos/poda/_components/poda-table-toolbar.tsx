'use client'

import { DownloadIcon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'

import { exportTableToCSV, exportTableToPDF } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'

import { Reclamo } from '@/types' // Usamos la interfaz global

interface PodaTableToolbarProps {
  table: Table<Reclamo>
}

export function PodaTableToolbar({ table }: PodaTableToolbarProps) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Aquí podrías añadir filtros si los necesitas en el futuro */}
        {/* Ejemplo: <Input placeholder="Filtrar por nombre..." /> */}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportTableToCSV(table, {
              filename: 'reclamos_poda',
              // Aquí puedes excluir columnas específicas de la exportación CSV si es necesario
              // excludeColumns: ['select', 'actions'], 
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
              filename: 'reclamos_poda',
              // Aquí puedes excluir columnas específicas de la exportación PDF si es necesario
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