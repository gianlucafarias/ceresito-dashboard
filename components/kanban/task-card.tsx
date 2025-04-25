"use client";

import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cva } from "class-variance-authority";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

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
  assignee?: AssigneeInfo | null;
}

interface TaskCardProps {
  task: KanbanTask;
  isOverlay?: boolean;
  onOpenModal?: (task: KanbanTask) => void;
}

export type TaskType = "Task";

export interface TaskDragData {
  type: TaskType;
  task: KanbanTask;
}

export function TaskCard({ task, isOverlay, onOpenModal }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: "Task",
      task,
    },
    attributes: {
      roleDescription: "Task",
    },
    disabled: isOverlay,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const taskCardVariants = cva(
    "px-3 py-2 rounded-lg border bg-card shadow-sm flex gap-2 items-center",
    {
      variants: {
        isDragging: {
          true: "opacity-50",
        },
        isOverlay: {
            true: "ring-2 ring-primary",
        },
      },
    }
  );

  const getInitials = (name?: string | null): string => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[72px] px-3 py-2 rounded-lg border bg-card opacity-50"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={taskCardVariants({ isDragging, isOverlay })}
        onClick={() => onOpenModal?.(task)}
      >
        <button 
          {...listeners} 
          className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Mover tarea"
        >
          <GripVertical className="w-4 h-4"/>
        </button>
        
        <div className="flex-grow space-y-1 overflow-hidden">
          <p className="font-medium truncate text-sm">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate">
              {task.description}
            </p>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            {task.assignee ? (
              <Avatar className="h-6 w-6 shrink-0" >
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignee.username)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                <User2 className="h-3 w-3 text-muted-foreground"/>
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{task.assignee ? `${task.assignee.username} (${task.assignee.email})` : "Sin asignar"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
