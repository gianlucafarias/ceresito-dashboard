import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState } from "react";
import { Task, Cuadrilla } from "../data/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface AsignarCuadrillaModalProps {
  open: boolean;
  onClose: () => void;
  selectedReclamos: Task[];
  cuadrillas: Cuadrilla[];
  onSuccessfulUpdate: () => void;
}

export const AsignarCuadrillaModal = ({
  open,
  onClose,
  selectedReclamos,
  cuadrillas,
  onSuccessfulUpdate,
}: AsignarCuadrillaModalProps) => {
  const [selectedCuadrilla, setSelectedCuadrilla] = useState<string>("");

  const handleCuadrillaChange = (value: string) => {
    setSelectedCuadrilla(value);
  };

  const handleSubmit = async () => {
    try {
      const reclamosIds = selectedReclamos.map(reclamo => reclamo.id);

 
      const response = await fetch('/api/asignar-reclamo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reclamosIds,
          cuadrillaId: selectedCuadrilla,
        }),
      });

      if (response.ok) {
        toast.success('Reclamos asignados y estado actualizado correctamente');
        onSuccessfulUpdate();
        onClose(); // Cierra el modal después de una actualización exitosa
      } else {
        const errorText = await response.text();
        console.error('Error al asignar la cuadrilla:', errorText);
      }
    } catch (error) {
      console.error('Error al asignar la cuadrilla:', error);
    }
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Reclamo", "Ubicación", "Barrio", "Detalle"];
    const tableRows: any[] = [];

    selectedReclamos.forEach((reclamo) => {
      const reclamoData = [
        reclamo.id,
        reclamo.reclamo,
        reclamo.ubicacion,
        reclamo.barrio,
        reclamo.detalle || "N/A",
      ];
      tableRows.push(reclamoData);
    });

    doc.text("Reclamos Asignados", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });
    doc.save("reclamos_asignados.pdf");
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(selectedReclamos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reclamos Asignados");
    XLSX.writeFile(workbook, "reclamos_asignados.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Cuadrilla</DialogTitle>
          <DialogDescription>
            Selecciona una cuadrilla para asignar los reclamos seleccionados.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="font-medium">Reclamos Seleccionados:</h3>
          <ul>
            {selectedReclamos.map(reclamo => (
              <li key={reclamo.id}>Reclamo #{reclamo.id}: {reclamo.reclamo}</li>
            ))}
          </ul>
          <Select onValueChange={handleCuadrillaChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar Cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cuadrillas Disponibles</SelectLabel>
                {cuadrillas.map(cuadrilla => (
                  <SelectItem key={cuadrilla.id} value={cuadrilla.id.toString()}>
                    {cuadrilla.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleExportToPDF}>Exportar PDF</Button>
          <Button onClick={handleExportToExcel}>Exportar Excel</Button>
          <Button onClick={handleSubmit} disabled={!selectedCuadrilla}>
            Asignar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
