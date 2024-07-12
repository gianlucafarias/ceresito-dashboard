"use client"
import React, { useMemo, useEffect, useState } from "react";
import { z } from "zod";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { reclamoSchema, cuadrillaSchema, Task, Cuadrilla } from "./data/schema";
import { DetallesReclamoDialog } from "./components/detalles-reclamo-dialog";
import { AsignarCuadrillaModal } from "./components/asignar-cuadrilla-modal";
import { Toaster, toast } from 'sonner';

async function getTasks() {
  const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos');
  const data = await response.json();
  try {
    const tasks = z.array(reclamoSchema).parse(data);
    return tasks;
  } catch (e) {
    console.error("Error al validar los datos: ", e);
    throw e;
  }
}

async function getCuadrillas() {
  const response = await fetch('/api/cuadrillas');
  const data = await response.json();
  try {
    const cuadrillas = z.array(cuadrillaSchema).parse(data);
    return cuadrillas;
  } catch (e) {
    console.error("Error al validar los datos de cuadrillas: ", e);
    throw e;
  }
}

const ordenarReclamosPorIdDesc = (reclamos: Task[]) => {
  return reclamos.sort((a, b) => b.id - a.id);
}

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedReclamo, setSelectedReclamo] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [selectedReclamos, setSelectedReclamos] = useState<Task[]>([]);
  const [isAsignarCuadrillaModalOpen, setIsAsignarCuadrillaModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTasks();
        const cuadrillasData = await getCuadrillas();
        const reclamosOrdenados = ordenarReclamosPorIdDesc(data);
        setTasks(reclamosOrdenados);
        setCuadrillas(cuadrillasData);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    }
    fetchData();
  }, []);

  const handleRowClick = (reclamo: Task) => {
    setSelectedReclamo(reclamo);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedReclamo(null);
    setIsDialogOpen(false);
  };

  const handleOpenAsignarCuadrillaModal = (selectedReclamos: Task[]) => {
    setSelectedReclamos(selectedReclamos);
    setIsAsignarCuadrillaModalOpen(true);
  };

  const handleCloseAsignarCuadrillaModal = () => {
    setIsAsignarCuadrillaModalOpen(false);
  };

  const handleSuccessfulUpdate = () => {
    toast.success('Reclamos asignados correctamente');
    handleCloseAsignarCuadrillaModal();
  };

  const memoizedColumns = useMemo(() => columns, []);
  const memoizedTasks = useMemo(() => tasks, [tasks]);

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <DataTable
          data={memoizedTasks}
          columns={memoizedColumns}
          onRowClick={handleRowClick}
          onAsignar={handleOpenAsignarCuadrillaModal}
          cuadrillas={cuadrillas}
        />
      </div>
      {selectedReclamo && (
        <DetallesReclamoDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          reclamo={selectedReclamo}
          cuadrillas={cuadrillas}
          onSuccessfulUpdate={handleSuccessfulUpdate}
        />
      )}
      <AsignarCuadrillaModal
        open={isAsignarCuadrillaModalOpen}
        onClose={handleCloseAsignarCuadrillaModal}
        selectedReclamos={selectedReclamos}
        cuadrillas={cuadrillas}
        onSuccessfulUpdate={handleSuccessfulUpdate}
      />
      <Toaster position="top-right" />
    </>
  );
}
