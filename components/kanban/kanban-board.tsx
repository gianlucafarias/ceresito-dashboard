"use client";
import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { hasDraggableData } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import type { Column } from "./board-column";
import { BoardColumn, BoardContainer } from "./board-column";
import { NewTaskDialog } from "./new-task-dialog";
import { TaskCard } from "./task-card";
import { toast } from "@/components/ui/use-toast";

// --- Tipos --- 
interface AssigneeInfo {
  id: number;
  username: string;
  email: string;
}

interface KanbanTask {
  id: number;
  title: string;
  description: string | null;
  status: string; 
  order: number;
  boardId: number;
  creatorId: number;
  assigneeId: number | null;
  createdAt: string; 
  updatedAt: string; 
  // Añadir campo opcional para el asignado
  assignee?: AssigneeInfo | null;
}

interface BoardDetails {
  id: number;
  name: string;
  ownerId: number;
  tasks: KanbanTask[]; 
  createdAt: string;
  updatedAt: string;
}
// -------------------------

// Props del componente
interface KanbanBoardProps {
  boardId: number;
  initialTasks: KanbanTask[];
}

// Columnas estáticas
const defaultCols: Column[] = [
  { id: "TODO", title: "Por Hacer" },
  { id: "IN_PROGRESS", title: "En Progreso" },
  { id: "DONE", title: "Hecho" },
];

type Status = typeof defaultCols[number]["id"];

export function KanbanBoard({ boardId, initialTasks }: KanbanBoardProps) {
  // const currentKanbanId = useKanbanStore((state) => state.currentKanbanId); // No necesario aquí
  // const kanban = useKanbanStore((state) => 
  //   state.kanbans.find((k) => k.id === currentKanbanId)
  // ); // Reemplazado por props
  // const columns = kanban?.columns || []; // Reemplazado por defaultCols
  // const tasks = kanban?.tasks || []; // Reemplazado por estado local
  // const updateKanban = useKanbanStore((state) => state.updateKanban); // Reemplazar por llamadas API + setTasks

  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [columns, setColumns] = useState<Column[]>(defaultCols);
  const pickedUpTaskColumn = useRef<Status | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [boardData, setBoardData] = useState<BoardDetails | null>(null); // Necesitamos BoardDetails aquí
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // useKanbanStore.persist.rehydrate(); // Quitar si ya no se usa la store para estos datos
  }, []);

  // Actualizar estado local si las props iniciales cambian
  useEffect(() => {
     setTasks(initialTasks);
  }, [initialTasks]);

  // Mover fetchBoardDetails fuera del useEffect para poder llamarla desde el callback
  const fetchBoardDetails = async () => {
    if (!boardId) return; // Salir si no hay ID
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`/api/kanban/boards/${boardId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: BoardDetails = await response.json();
      setBoardData(data);
      setTasks(data.tasks); 
    } catch (err: any) {
      console.error(`Error fetching/refreshing board ${boardId}:`, err);
      setError(err.message || "Failed to load/refresh board details.");
      // Mantener datos viejos si el refresco falla?
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]); // Solo depende de boardId

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // No necesitamos currentKanbanId aquí si usamos boardId de props
  if (!isMounted) return null; 

  function getDraggingTaskData(taskId: UniqueIdentifier, columnId: Status) {
    // Usar estado local 'tasks'
    const tasksInColumn = tasks.filter((task) => task.status === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    // Usar estado local 'columns'
    const column = columns.find((col) => col.id === columnId);
    // Usar estado local 'tasks'
    const draggedTask = tasks.find((task) => task.id === taskId);
    return {
      tasksInColumn,
      taskPosition,
      column,
      draggedTask,
    };
  }

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }
    if (data?.type === "Task") {
      const taskData = data.task as KanbanTask; 
      console.log("onDragStart - Setting activeTask:", taskData);
      setActiveTask(taskData);
      pickedUpTaskColumn.current = taskData.status as Status;
      return;
    }
  }

  // Helper para reordenar array
  function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = array.slice();
    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);
    return newArray;
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumn.current = null;
        return;
    }

    const sourceType = active.data.current?.type;
    const targetType = over.data.current?.type;
    const originalStatus = pickedUpTaskColumn.current;
    pickedUpTaskColumn.current = null; // Limpiar aquí

    // --- Caso 1: Mover TAREA a otra COLUMNA --- 
    if (sourceType === "Task" && targetType && originalStatus) {
        const taskId = active.id as number;
        let targetStatus: Status | null = null;
        if (targetType === "Column") {
            targetStatus = over.id.toString() as Status;
        } else if (targetType === "Task" && over.data.current?.task) { 
            targetStatus = over.data.current.task.status as Status;
        }

        if (targetStatus && targetStatus !== originalStatus) {
            console.log(`onDragEnd: Moviendo tarea ${taskId} de ${originalStatus} a ${targetStatus}`);
            // Lógica existente para mover entre columnas (con fetchBoardDetails)
            const updateTaskStatus = async () => {
                try {
                    const response = await fetch(`/api/kanban/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: targetStatus }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `API Error: ${response.status}`);
                    }
                    
                    toast({ title: "Tarea movida", description: `Tarea actualizada a estado ${targetStatus}.` }); 
                    // Éxito: Refrescar los datos del tablero para actualizar la UI
                    fetchBoardDetails(); // <--- VOLVER a llamar fetch aquí

                } catch (error: any) {
                    console.error("Error actualizando estado de tarea:", error);
                    toast({ variant: "destructive", title: "Error al mover", description: error.message }); 
                    // QUITAR la reversión del estado local
                    // setTasks(originalTasks); 
                }
            };
            updateTaskStatus();
            return; // Terminar aquí si se movió entre columnas
        }
    }
    
    // --- Caso 2: Reordenar TAREA dentro de la MISMA COLUMNA --- 
    if (sourceType === "Task" && targetType === "Task" && originalStatus && active.id !== over.id) {
        const activeTask = active.data.current?.task as KanbanTask;
        const overTask = over.data.current?.task as KanbanTask;

        // Verificar si ambas tareas están en la misma columna (original)
        if (activeTask && overTask && activeTask.status === overTask.status && activeTask.status === originalStatus) {
            console.log(`onDragEnd: Reordenando tarea ${active.id} sobre ${over.id} en columna ${originalStatus}`);
            
            const currentColumnStatus = originalStatus;
            const originalTasks = [...tasks]; // Guardar estado para revertir si falla

            // Actualización optimista local
            setTasks((prevTasks) => {
                const activeIndex = prevTasks.findIndex((t) => t.id === active.id);
                const overIndex = prevTasks.findIndex((t) => t.id === over.id);
                // Mover la tarea en el array
                return arrayMove(prevTasks, activeIndex, overIndex);
            });

            // Preparar datos para la API (lista de IDs en nuevo orden para la columna)
            const reorderedTasksInColumn = arrayMove(
                originalTasks.filter(t => t.status === currentColumnStatus), 
                originalTasks.filter(t => t.status === currentColumnStatus).findIndex(t => t.id === active.id), 
                originalTasks.filter(t => t.status === currentColumnStatus).findIndex(t => t.id === over.id)
            );
            const orderedTaskIds = reorderedTasksInColumn.map(t => t.id);

            // Llamar API para persistir reordenamiento
            const updateTaskOrder = async () => {
                try {
                    // Usaremos PUT en la tarea activa, pasando los IDs ordenados
                    const response = await fetch(`/api/kanban/tasks/${active.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            // Nuevo campo para indicar reordenamiento
                            orderedTaskIds: orderedTaskIds,
                            // Incluir status para que la API sepa en qué columna reordenar
                            status: currentColumnStatus
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `API Error: ${response.status}`);
                    }
                    
                    toast({ title: "Tarea reordenada", description: `Orden actualizado en columna ${currentColumnStatus}.` }); 
                    // Éxito API: El estado local optimista ya es correcto.

                } catch (error: any) {
                    console.error("Error reordenando tarea:", error);
                    toast({ variant: "destructive", title: "Error al reordenar", description: error.message }); 
                    // Fallo API: Revertir el estado local al orden original
                    setTasks(originalTasks); 
                }
            };
            updateTaskOrder();
        }
    }

    // ... (Lógica para mover COLUMNA si se implementa)
  }

  // Simplificar onDragOver (quitar lógica de actualización de estado/API)
  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !active.data.current || active.id === over.id) return;
    // Podríamos añadir lógica aquí para feedback visual (ej: resaltar columna)
    // console.log(`onDragOver: ${active.id} sobre ${over.id}`); 
  }

  // El callback ahora solo llama a la función de fetch
  const handleTaskCreated = () => {
    fetchBoardDetails(); // Volver a cargar los datos del tablero
  };

  // Callback para refrescar después de actualizar una tarea
  const handleTaskUpdated = () => {
    fetchBoardDetails(); // Simplemente recargar datos
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <BoardContainer>
        <SortableContext items={columnsId}>
          {columns.map((col) => (
            <Fragment key={col.id}>
              <BoardColumn
                column={col}
                tasks={tasks.filter((task): task is KanbanTask => task.status === col.id)}
                boardId={boardId}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
              />
            </Fragment>
          ))}
        </SortableContext>
         {/* Botón global para añadir tarea? O se deja solo en columna? */}
         {/* <NewTaskDialog boardId={boardId} status={defaultCols[0].id} onTaskCreated={handleTaskCreated} /> */}
      </BoardContainer>

      {typeof document !== "undefined" && isMounted &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <BoardColumn
                isOverlay
                column={activeColumn}
                tasks={tasks.filter((task): task is KanbanTask => task.status === activeColumn.id)}
                boardId={boardId}
                onTaskCreated={handleTaskCreated}
              />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
