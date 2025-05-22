"use client"

import { type Task } from "@/db/schema"
import { DownloadIcon } from "@radix-ui/react-icons"
import { type Table } from "@tanstack/react-table"

import { exportTableToCSV, exportTableToPDF } from "@/lib/export"
import { Button } from "@/components/ui/button"

import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTasksDialog } from "./delete-tasks-dialog"

interface TasksTableToolbarActionsProps {
  table: Table<Task>
}

export function TasksTableToolbarActions({
  table,
}: TasksTableToolbarActionsProps) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center gap-2">
      {selectedRowCount > 0 ? (
        <DeleteTasksDialog
          tasks={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <CreateTaskDialog />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "tasks",
            excludeColumns: ["select", "actions"],
          })
        }
      >
        <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
        Exportar a Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToPDF(table)
        }
      >
        <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
        Exportar a PDF {selectedRowCount > 0 ? `(${selectedRowCount})` : ""}
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  )
}
