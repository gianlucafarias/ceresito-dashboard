"use client";

import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { GripVertical, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { ColumnActions } from "./column-action";
import { TaskCard } from "./task-card";
import { NewTaskDialog } from "./new-task-dialog";
import { DEFAULT_COLUMN_COLOR } from "./constants";
import { TaskDetailsModal } from "./task-details-modal";

interface KanbanTask {
  id: number;
  title: string;
  description: string | null;
  status: string; // Columna
  order: number;
  boardId: number;
  creatorId: number;
  assigneeId: number | null;
  createdAt: string; 
  updatedAt: string; 
}

export type Column = {
  id: UniqueIdentifier;
  title: string;
  color?: string; // Color opcional para la columna
};

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface ColumnProps {
  column: Column;
  tasks: KanbanTask[]; // Esperar el tipo correcto
  isOverlay?: boolean;
  boardId: number; // ID del tablero padre
  onTaskCreated: () => void; // <-- Corregir tipo aquí
  onTaskUpdated: () => void; // <-- Añadir prop para actualizar
}

export function BoardColumn({ column, tasks, isOverlay, boardId, onTaskCreated, onTaskUpdated }: ColumnProps) {
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
    disabled: isOverlay,
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[70vh] max-h-[70vh] w-[350px] max-w-full bg-secondary flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    },
  );

  const handleOpenModal = (task: KanbanTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader 
        className="p-4 font-semibold border-b-2 text-left flex flex-row space-between items-center text-card-foreground"
        style={{ backgroundColor: column.color || DEFAULT_COLUMN_COLOR }}
      >
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className=" p-1 text-primary/50 -ml-2 h-auto cursor-grab relative"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical />
        </Button>
        <span className="flex-grow mx-2 truncate" title={column.title}>{column.title}</span>
        <ColumnActions id={column.id} title={column.title} />
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-4 p-2 overflow-y-auto overflow-x-hidden">
        <SortableContext items={tasksIds.map(id => id.toString())}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpenModal={handleOpenModal} />
          ))}
        </SortableContext>
        <NewTaskDialog 
          boardId={boardId} 
          status={column.id.toString()} 
          onTaskCreated={onTaskCreated} 
        />
      </CardContent>

      <TaskDetailsModal 
        task={selectedTask} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onTaskUpdated={onTaskUpdated}
      />
    </Card>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();

  const variations = cva(
    "overflow-x-auto px-2  pb-4 md:px-0 flex lg:justify-start",
    {
      variants: {
        dragging: {
          default: "snap-x snap-mandatory",
          active: "snap-none",
        },
      },
    },
  );

  return (
    <div
      className={variations({
        dragging: dndContext.active ? "active" : "default",
      })}
    >
      <div className="flex gap-4 items-start flex-row justify-center">
        {children}
      </div>
    </div>
  );
}