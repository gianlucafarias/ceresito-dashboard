import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from 'xlsx'

export function exportToPDF(tasks) {
  const doc = new jsPDF()
  doc.autoTable({
    head: [['ID', 'Fecha', 'Nombre', 'Reclamo', 'Ubicación', 'Barrio', 'Teléfono', 'Detalle']],
    body: tasks.map(task => [task.id, task.fecha, task.nombre, task.reclamo, task.ubicacion, task.barrio, task.telefono, task.detalle]),
  })
  doc.save('reclamos.pdf')
}

export function exportToExcel(tasks) {
  const worksheet = XLSX.utils.json_to_sheet(tasks)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reclamos")
  XLSX.writeFile(workbook, "reclamos.xlsx")
}
