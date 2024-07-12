import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { persist } from "zustand/middleware";
import { Column } from "@/components/kanban/board-column";
import { UniqueIdentifier } from "@dnd-kit/core";

export type Status = "COMPLETADO" | "EN PROCESO" | "PENDIENTE" | "ASIGNADO" | "CANCELADO" ;

const defaultCols = [
  {
    id: "TODO" as const,
    title: "Todo",
  },
] satisfies Column[];

export type ColumnId = (typeof defaultCols)[number]["id"];

export type Task = {
  id: string;
  nombre: string;
  detalle?: string;
  estado: Status;
  ubicacion: string;
  barrio: string;
  prioridad: string;
  
};

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: { id: string | null; status: ColumnId | null };
};

export type Actions = {
  addTask: (title: string, description?: string, status?: ColumnId) => void;
  updateCol: (id: UniqueIdentifier, newName: string) => void;
  addCol: (title: string) => void;
  dragTask: (id: string | null, status: ColumnId | null) => void;
  removeTask: (id: string) => void;
  removeCol: (id: UniqueIdentifier) => void;
  setTasks: (updatedTask: Task[]) => void;
  setCols: (cols: Column[]) => void;
};

export const useTaskStore = create<State & Actions>()(
  persist(
    (set) => ({
      tasks: [],
      columns: defaultCols,
      draggedTask: { id: null, status: null },

      addTask: (title, description, status = "TODO") =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { id: uuid(), title, description, status },
          ],
        })),

      // Resto de las acciones
    }),
    { name: "task-store", skipHydration: true }
  )
);

