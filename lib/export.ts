import { type Table } from "@tanstack/react-table";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
    .filter((id) => !excludeColumns.includes(id) || id === "detalle");

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
            header === "fecha" ? formatDate(cellValue) : cellValue;
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
    .filter(id => !excludeColumns.includes(id) || id === "detalle");

  const rows = table.getRowModel().rows.map(row =>
    headers.map(header => {
      const cellValue = row.getValue(header);
      return header === "fecha" ? formatDate(cellValue) : cellValue;
    })
  );

  const doc = new jsPDF();
  doc.autoTable({
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
  const { filename = "reclamos", excludeColumns = ["select", "actions", "estado"], onlySelected = false } = opts;

  const headers = table
    .getAllLeafColumns()
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id) || id === "detalle");

  const rows = (onlySelected ? table.getFilteredSelectedRowModel().rows : table.getRowModel().rows).map(row =>
    headers.map(header => {
      const cellValue = row.getValue(header);
      return header === "fecha" ? formatDate(cellValue) : cellValue;
    })
  );

  const doc = new jsPDF();
  doc.autoTable({
    head: [headers],
    body: rows,
  });

  doc.save(`${filename}.pdf`);
}
