import { KanbanList } from "@/components/kanban/kanban-list";
import { Heading } from "@/components/ui/heading";

export default function KanbanPage() {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-start justify-between">
          <Heading title={`Mis Tableros`} description="Selecciona un tablero o crea uno nuevo" />
        </div>
        {/* Aquí podrías añadir un área principal si quieres mostrar algo más que la lista,
            pero por ahora, la lista es lo principal para seleccionar un Kanban */}
        <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5">
          <KanbanList />
        </div>
      </div>
    </>
  );
}