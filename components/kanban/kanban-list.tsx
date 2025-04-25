"use client";

import React, { useState, useEffect } from 'react';
// import { useKanbanStore } from "@/lib/store"; // Ya no se usa para obtener kanbans
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Plus, AlertCircle, Loader2 } from "lucide-react"; // Añadir iconos para error/carga
import Link from "next/link";
// import { useSession } from "next-auth/react"; // Ya no se necesita aquí si la API valida sesión
import { Badge } from "../ui/badge";

// Definir un tipo para los datos del tablero que esperamos de la API
// Idealmente, este tipo podría venir de Prisma o ser más específico
interface Board {
  id: number;
  name: string;
  ownerId: number;
  // Podríamos añadir opcionalmente _count si la API lo devuelve:
  // _count?: { members: number; tasks: number };
}

export function KanbanList() {
  // const { data: session } = useSession(); // No necesario aquí
  // const kanbans = useKanbanStore((state) => state.kanbans); // Reemplazado por estado local
  // const currentKanbanId = useKanbanStore((state) => state.currentKanbanId); // ¿Se usa en otro lado? Si no, quitar

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Podríamos necesitar saber el ID actual si se usa para estilizar el botón activo
  // Si currentKanbanId venía de useKanbanStore y se necesita, habría que obtenerlo de ahí
  // o manejar la selección activa de otra forma (ej: usando el path de la URL)

  useEffect(() => {
    const fetchBoards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/kanban/boards');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Board[] = await response.json();
        setBoards(data);
      } catch (err: any) {
        console.error("Error fetching boards:", err);
        setError(err.message || "Failed to load boards.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []); // Ejecutar solo al montar el componente

  // --- Renderizado condicional ---
  let content;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando...</span>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center py-4 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <span className="mt-2 text-center">Error: {error}</span>
      </div>
    );
  } else if (boards.length === 0) {
    content = (
      <div className="text-center text-sm text-muted-foreground py-4">
        No tienes tableros aún.
      </div>
    );
  } else {
    content = (
      <div className="space-y-1">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/dashboard/kanban/${board.id}`}
            className="block"
          >
            {/* TODO: Reemplazar currentKanbanId con lógica de ruta activa si es necesario */}
            <Button
              variant={/* currentKanbanId === board.id ? "secondary" : */ "ghost"}
              className="w-full justify-start"
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{board.name}</span>
                {/* La API ya filtra, no necesitamos mostrar dueño/miembros aquí 
                    a menos que la API devuelva esa info explícitamente */}
                 {/* <div className="flex items-center gap-2">
                   {board.ownerId === session?.user?.id && (
                     <Badge variant="outline" className="ml-auto">
                       Dueño
                     </Badge>
                   )}
                   {board._count && (
                      <div className="flex items-center">
                         <Users className="h-4 w-4" />
                         <span className="ml-1 text-xs">
                            {board._count.members}
                         </span>
                       </div>
                    )}
                  </div> */}
              </div>
            </Button>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mis Tableros</h2>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/kanban/new">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Nuevo Tablero</span>
          </Link>
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {content} 
      </ScrollArea>
    </div>
  );
} 