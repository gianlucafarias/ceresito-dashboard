import { type Table } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("es-ES", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const { filename = "reclamos", excludeColumns = ["select", "actions", "estado"], onlySelected = false } = opts;

  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id as any) || id === "detalle");

  const csvContent = [
    headers.join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map((row) =>
      headers
        .map((header) => {
          const cellValue = row.getValue(header);
          const formattedValue =
            header === "fecha" ? formatDate(cellValue as string | number | Date) : cellValue;
          return typeof formattedValue === "string"
            ? `"${formattedValue.replace(/"/g, '""')}"`
            : formattedValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF<TData>(table: Table<TData>) {
  const excludeColumns = ["select", "actions", "estado"];
  const headers = table
    .getAllLeafColumns()
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id as any) || id === "detalle");

  const rows = table.getRowModel().rows.map(row =>
    headers.map(header => {
      const cellValue = row.getValue(header);
      const formattedValue = header === "fecha" ? formatDate(cellValue as string | number | Date) : cellValue;
      return String(formattedValue);
    })
  );

  const doc = new jsPDF();
  autoTable(doc, {
    head: [headers],
    body: rows,
  });

  doc.save('reclamos.pdf');
}

export function exportTableToPDF<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const { filename = "reclamos", excludeColumns = ["select", "actions", "estado"] } = opts;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const headers = table
    .getAllLeafColumns()
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id as any) || id === "detalle");

  const rows = (hasSelectedRows ? selectedRows : table.getRowModel().rows).map(row =>
    headers.map(header => {
      const cellValue = row.getValue(header);
      const formattedValue = header === "fecha" ? formatDate(cellValue as string | number | Date) : cellValue;
      return String(formattedValue);
    })
  );

  const doc = new jsPDF();
  autoTable(doc, {
    head: [headers],
    body: rows,
  });

  doc.save(`${filename}.pdf`);
}