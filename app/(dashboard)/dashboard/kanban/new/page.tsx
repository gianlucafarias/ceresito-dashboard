import { CreateKanbanForm } from "@/components/kanban/create-kanban-form";

export default function NewKanbanPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Crear Nuevo Tablero</h1>
        <p className="text-muted-foreground">
          Crea un nuevo tablero Kanban para organizar tus tareas y colaborar con tu equipo.
        </p>
        <CreateKanbanForm />
      </div>
    </div>
  );
} 