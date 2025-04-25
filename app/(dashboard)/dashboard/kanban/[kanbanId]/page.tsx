"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/kanban-board";
// import { useKanbanStore } from "@/lib/store"; // Aún podría usarse para setCurrentKanban si es necesario
import { Heading } from "@/components/ui/heading";
import { AlertCircle, Loader2 } from "lucide-react"; // Para estados de carga/error

// --- Tipos esperados de la API --- 
interface KanbanTask {
  id: number;
  title: string;
  description: string | null;
  status: string; // Columna
  order: number;
  boardId: number;
  creatorId: number;
  assigneeId: number | null;
  createdAt: string; // O Date si se parsea
  updatedAt: string; // O Date si se parsea
  // Podríamos incluir datos del asignado/creador si la API los devuelve
  // assignee?: { id: number; username: string; };
}

interface BoardDetails {
  id: number;
  name: string;
  ownerId: number;
  tasks: KanbanTask[]; // Incluir las tareas
  createdAt: string;
  updatedAt: string;
  // Podríamos incluir más detalles como miembros, etc.
}
// --------------------------------

export default function KanbanBoardPage() {
  const params = useParams();
  const kanbanId = params.kanbanId as string; // Obtener ID de la URL

  // const { setCurrentKanban } = useKanbanStore(); // Mantener si es necesario para otra lógica

  const [boardData, setBoardData] = useState<BoardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   if (kanbanId) {
  //     setCurrentKanban(kanbanId); // Llamar si aún es necesario
  //   }
  // }, [kanbanId, setCurrentKanban]);

  useEffect(() => {
    if (!kanbanId) {
        // Manejar caso donde el ID no está presente (aunque no debería pasar con la estructura de carpetas)
        setError("Board ID not found in URL.");
        setIsLoading(false);
        return;
    }

    const fetchBoardDetails = async () => {
      setIsLoading(true);
      setError(null);
      setBoardData(null); // Limpiar datos anteriores
      try {
        const response = await fetch(`/api/kanban/boards/${kanbanId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: BoardDetails = await response.json();
        setBoardData(data);
      } catch (err: any) {
        console.error(`Error fetching board ${kanbanId}:`, err);
        setError(err.message || "Failed to load board details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardDetails();
  }, [kanbanId]); // Re-ejecutar si el kanbanId cambia

  // --- Renderizado --- 
  const title = isLoading ? "Cargando Tablero..." : error ? "Error" : boardData?.name || "Tablero sin nombre";
  const description = isLoading ? "" : error ? error : boardData ? `ID: ${boardData.id}` : "Error al cargar datos";

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Heading title={title} description={description} />
          {/* Botones de acción del tablero */} 
        </div>
        <div className="flex-1 h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertCircle className="h-8 w-8" />
              <span className="mt-2 text-center">{error}</span>
            </div>
          )}
          {!isLoading && !error && boardData && (
            // Pasar las tareas al componente KanbanBoard
            <KanbanBoard boardId={boardData.id} initialTasks={boardData.tasks} />
          )}
          {!isLoading && !error && !boardData && (
              // Caso raro donde no hay error pero tampoco datos
              <div className="text-center text-muted-foreground">No se encontraron datos del tablero.</div>
          )}
        </div>
      </div>
    </>
  );
} 