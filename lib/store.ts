import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UniqueIdentifier } from "@dnd-kit/core";

// Mantener Status si se usa externamente, o definirlo donde se necesite
// Podría basarse en las columnas estáticas definidas en KanbanBoard
export type Status = string; // Simplificado a string por ahora

// --- Tipos obsoletos eliminados ---
// export interface KanbanMember { ... }
// export interface Kanban { ... }
// export type Task = { ... };
// ---------------------------------

// Estado simplificado: solo mantiene el ID del tablero activo (si se necesita globalmente)
export type State = {
  currentKanbanId: string | null;
};

// Acciones simplificadas
export type Actions = {
  setCurrentKanban: (kanbanId: string | null) => void;
};

// Exportar el store simplificado
export const useKanbanStore = create<State & Actions>()(
  persist(
    (set) => ({
      // Estado inicial
      currentKanbanId: null,

      // Única acción restante
      setCurrentKanban: (kanbanId) => set({ currentKanbanId: kanbanId }),

      // --- Acciones obsoletas eliminadas --- 
      // createKanban: (...) => { ... },
      // deleteKanban: (...) => { ... },
      // updateKanban: (...) => { ... },
      // addMemberToKanban: (...) => { ... },
      // removeMemberFromKanban: (...) => { ... },
      // addColumn: (...) => { ... },
      // updateColumn: (...) => { ... },
      // removeColumn: (...) => { ... },
      // addTask: (...) => { ... },
      // updateTask: (...) => { ... },
      // removeTask: (...) => { ... },
      // moveTask: (...) => { ... },
      // ------------------------------------
    }),
    {
      name: "kanban-store", // Nombre para persistencia (localStorage)
      // Considerar si aún se necesita persistir solo el currentKanbanId
      // partialize: (state) => ({ currentKanbanId: state.currentKanbanId }),
      skipHydration: true, // Puede ser útil si la hidratación causaba problemas
    }
  )
);

// --- Constantes y defaultColumns eliminadas, definir donde se usen --- 
// export const COLOR_PALETTE = [...];
// export const DEFAULT_TASK_COLOR = ...;
// export const DEFAULT_COLUMN_COLOR = ...;
// const defaultColumns = [...];

