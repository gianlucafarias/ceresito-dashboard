"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useKanbanStore } from "@/lib/store";
import { UniqueIdentifier } from "@dnd-kit/core";
import { Input } from "../ui/input";

export function ColumnActions({
  title,
  id,
}: {
  title: string;
  id: UniqueIdentifier;
}) {
  const [name, setName] = React.useState(title);
  const currentKanbanId = useKanbanStore((state) => state.currentKanbanId);
  const updateColumn = useKanbanStore((state) => state.updateColumn);
  const removeColumn = useKanbanStore((state) => state.removeColumn);
  const [editDisable, setIsEditDisable] = React.useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!currentKanbanId) return null;

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsEditDisable(!editDisable);
          updateColumn(currentKanbanId, id, name);
          toast({
            title: "Nombre actualizado",
            variant: "default",
            description: `${title} actualizado a ${name}`,
          });
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-base !mt-0 mr-auto disabled:opacity-100 disabled:cursor-pointer disabled:border-none"
          disabled={editDisable}
          ref={inputRef}
        />
      </form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="ml-1">
            <span className="sr-only">Actions</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setIsEditDisable(!editDisable);
              setTimeout(() => {
                inputRef.current && inputRef.current?.focus();
              }, 500);
            }}
          >
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Eliminar sección
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de querer eliminar la sección?
            </AlertDialogTitle>
            <AlertDialogDescription>
              NOTA: Todas las tareas relacionadas con esta categoría también
              serán eliminadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                // yes, you have to set a timeout
                setTimeout(() => (document.body.style.pointerEvents = ""), 100);

                setShowDeleteDialog(false);
                removeColumn(currentKanbanId, id);
                toast({
                  description: "Esta sección ha sido eliminada.",
                });
              }}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}