"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";

import { useKanbanStore, COLOR_PALETTE, DEFAULT_COLUMN_COLOR } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NewSectionDialog() {
  const currentKanbanId = useKanbanStore((state) => state.currentKanbanId);
  const addColumn = useKanbanStore((state) => state.addColumn);
  const [color, setColor] = useState(DEFAULT_COLUMN_COLOR);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!currentKanbanId) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title) return;

    addColumn(currentKanbanId, title, color);
    setTitle("");
    setColor(DEFAULT_COLUMN_COLOR);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg" className="w-full">
          ＋ Agregar nueva sección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar una nueva sección</DialogTitle>
          <DialogDescription>
            ¿Qué sección quieres agregar hoy?
          </DialogDescription>
        </DialogHeader>
        <form
          id="todo-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              placeholder="Título de la sección..."
              className="col-span-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <Label className="text-right">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((paletteColor) => (
                <button
                  key={paletteColor}
                  type="button"
                  onClick={() => setColor(paletteColor)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform duration-100 ease-in-out",
                    color === paletteColor
                      ? "scale-110 ring-2 ring-ring ring-offset-2"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: paletteColor }}
                  aria-label={`Select color ${paletteColor}`}
                />
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" size="sm" form="todo-form">
            Agregar sección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}