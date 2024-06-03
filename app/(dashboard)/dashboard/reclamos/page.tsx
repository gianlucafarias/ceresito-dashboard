"use client"

import { z } from "zod"
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { reclamoSchema } from "./data/schema"
import { useEffect, useState } from "react"
import { DetallesReclamoDialog } from "./components/detalles-reclamo-dialog"
import { Toaster, toast } from 'sonner'

async function getTasks() {
  const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos')
  const data = await response.json()
  const tasks = z.array(reclamoSchema).parse(data);
  return tasks;
}

// Función para ordenar reclamos por ID de manera descendente
const ordenarReclamosPorIdDesc = (reclamos: any) => {
  return reclamos.sort((a: any, b: any) => b.id - a.id);
}

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cuadrillas, setCuadrillas] = useState([]);

  useEffect(() => {
    fetch('/api/cuadrillas')
      .then(res => res.json())
      .then(data => {
        console.log('Cuadrillas fetched:', data);
        setCuadrillas(data);
      })
      .catch(err => console.error('Error fetching cuadrillas:', err));
  }, []);

  const handleRowClick = (reclamo: any) => {
    setSelectedReclamo(reclamo);
    setIsDialogOpen(true); // Abre el diálogo
  };

  const handleCloseDialog = () => {
    setSelectedReclamo(null);
    setIsDialogOpen(false); // Cierra el diálogo
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTasks();
        const reclamosOrdenados = ordenarReclamosPorIdDesc(data); // Ordenar los reclamos por ID descendente
        setTasks(reclamosOrdenados);
      } catch (error) {
        console.error('Error al obtener los reclamos:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        {/* Contenido de la página */}
        <DataTable
          data={tasks}
          columns={columns}
          onRowClick={handleRowClick} // Pasa la función handleRowClick como prop
        />
      </div>
      {/* Diálogo de detalles del reclamo */}
      {selectedReclamo && (
        <DetallesReclamoDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          reclamo={selectedReclamo}
          cuadrillas={cuadrillas} // Pasar las cuadrillas disponibles
          onSuccessfulUpdate={() => { /* Implementa la función de actualización exitosa */ }}

        />
      )}
      <Toaster position="top-right" richColors />
    </>
  );
}