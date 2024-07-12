"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  BriefcaseIcon,
  CheckIcon,
  FilterIcon,
  LightbulbIcon,
  PawPrintIcon,
  TreesIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { AgregarCuadrillaDialog } from "./components/agregar-cuadrilla";
import { useEffect, useState } from "react";
import CuadrillaCard from "./components/cuadrilla-card";


interface Cuadrilla {
  id: number;
  ultimaAsignacion: Date;
  nombre: string;
  tipo: Array<{ id: number; nombre: string }>;
  disponible: boolean;
  reclamosAsignados: number[];
  telefono: number;
  limiteReclamosSimultaneos: number;
  disponibilidad: boolean;
  estado: String;
}

export default function Page() {
  const [showDialog, setShowDialog] = useState(false);
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);

  useEffect(() => {
    fetch("/api/cuadrillas")
      .then((res) => res.json())
      .then((data) => setCuadrillas(data))
      .catch((err) => console.error(err));
  }, []);

  // Función para abrir el diálogo
  const openDialog = () => {
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
  };

  const handleAddCuadrilla = (nuevaCuadrilla: Cuadrilla) => {
    setCuadrillas((prevCuadrillas) => [...prevCuadrillas, nuevaCuadrilla]);
  };

  const handleDeleteCuadrilla = async (id: number) => {
    try {
      const res = await fetch("/api/cuadrillas", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCuadrillas((prevCuadrillas) => prevCuadrillas.filter((cuadrilla) => cuadrilla.id !== id));
      } else {
        console.error("Error al eliminar la cuadrilla");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
        <nav className="hidden font-medium sm:flex flex-row items-center gap-5 text-sm lg:gap-6">
          <Link className="font-bold" href="#">
            Cuadrillas
          </Link>
          <Link className="text-gray-500 dark:text-gray-400" href="#">
            Reclamos
          </Link>
          <Link
            className="text-gray-500 dark:text-gray-400"
            href="/dashboard/cuadrillas/reportes"
          >
            Reportes
          </Link>
        </nav>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="max-w-6xl w-full mx-auto flex items-center gap-4">
          <form className="flex-1">
            <Input
              className="bg-white dark:bg-gray-950"
              placeholder="Buscar cuadrillas..."
            />
            <Button className="sr-only" type="submit">
              Buscar
            </Button>
          </form>
          <Button onClick={openDialog}>Crear Cuadrilla</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" variant="outline">
                <FilterIcon className="w-4 h-4" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem>
                <LightbulbIcon className="w-4 h-4 mr-2" />
                Luminarias
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                <WrenchIcon className="w-4 h-4 mr-2" />
                Reparaciones
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                <TreesIcon className="w-4 h-4 mr-2" />
                Árboles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                <PawPrintIcon className="w-4 h-4 mr-2" />
                Animales en la vía
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem>
                <CheckIcon className="w-4 h-4 mr-2" />
                Disponibles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                <BriefcaseIcon className="w-4 h-4 mr-2" />
                Ocupadas
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full mx-auto">
  {cuadrillas.map(cuadrilla => (
    <CuadrillaCard
      key={cuadrilla.id}
      id={cuadrilla.id}
      nombre={cuadrilla.nombre}
      estado={cuadrilla.estado}
      tipo={cuadrilla.tipo}
      disponibilidad={cuadrilla.disponibilidad}
      ultimaAsignacion={cuadrilla.ultimaAsignacion}
      onDelete={() => handleDeleteCuadrilla(cuadrilla.id)} // Pasar la función de eliminación

    />
  ))}
</div>
      </main>
      {showDialog && (
        <AgregarCuadrillaDialog onClose={closeDialog} open={showDialog} onAddCuadrilla={handleAddCuadrilla}
        />
      )}
    </div>
  );
}
