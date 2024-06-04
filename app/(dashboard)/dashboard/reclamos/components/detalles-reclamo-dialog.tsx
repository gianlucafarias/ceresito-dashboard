import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import { Task } from "../data/schema";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labels, estados, prioridades } from "../data/data"
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import { CheckIcon, ClockIcon, MapPin, UserIcon, WrenchIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Cuadrilla {
  id: number;
  nombre: string;
  tipo: Array<{ id: number; nombre: string }>;
  disponible: boolean; 
}


interface Reclamo {
  id: number,
  fechaAsignacion: Date,
  cuadrillaId: number,
  fecha: Date,
  latitud: number,
  longitud: number,
  estado: string,

}



interface DetallesReclamoDialogProps {
  open: boolean;
  onClose: () => void;
  reclamo: Task;
  onSuccessfulUpdate: () => void;
  cuadrillas: Cuadrilla[];
}

const handleSuccessfulUpdate = () => {
  toast.success('Estado actualizado correctamente');
};

  export const DetallesReclamoDialog = ({
    open,
    onClose,
    reclamo,
    onSuccessfulUpdate,
    cuadrillas = [],
  }: DetallesReclamoDialogProps) => {
    const [selectedEstado, setSelectedEstado] = useState<string>(reclamo?.estado || "");
    const [selectedCuadrilla, setSelectedCuadrilla] = useState<string>(reclamo?.cuadrillaId || "");
  
    useEffect(() => {
      console.log("Reclamo:", reclamo);
      console.log("Cuadrillas disponibles:", cuadrillas);
    }, [cuadrillas, reclamo]);
  
    const cuadrillasDisponibles = reclamo
    ? cuadrillas.filter(
        (c) =>
          c.tipo.some((t) => t.nombre.toLowerCase() === reclamo.reclamo.toLowerCase()) &&
          c.disponible  // Filtrando solo las cuadrillas disponibles
      )
    : [];
  
    useEffect(() => {
      console.log("Cuadrillas disponibles después del filtrado:", cuadrillasDisponibles);
    }, [cuadrillasDisponibles]);
  
    const handleEstadoChange = (value: string) => {
      setSelectedEstado(value);
    };
  
    const handleCuadrillaChange = (value: string) => {
      setSelectedCuadrilla(value);
    };
  
    const handleSubmit = async () => {
     
  
      try {
        console.log('Enviando datos:', { 
          reclamoId: reclamo.id, 
          cuadrillaId: selectedCuadrilla,
          reclamoDetalles: reclamo
        });
  
        const response = await fetch('/api/asignar-reclamo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reclamoId: reclamo.id, 
            cuadrillaId: selectedCuadrilla,
            reclamoDetalles: reclamo
          }),
        });
  
        if (response.ok) {
          toast.success('Reclamo asignado y estado actualizado correctamente');
          onSuccessfulUpdate();
        } else {
          const errorText = await response.text();
          console.error('Error al asignar la cuadrilla:', errorText);
        }
      } catch (error) {
        console.error('Error al asignar la cuadrilla:', error);
      }
    };

    const renderEstadoMensaje = () => {
      switch (reclamo?.estado) {
        case "ASIGNADO":
          return (
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-md flex items-center justify-center aspect-square w-10 dark:bg-gray-800">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="grid gap-1">
                <div className="font-medium">Asignado a cuadrilla # 00{reclamo.cuadrillaid}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Tu reclamo ha sido asignado a la cuadrilla # 00{reclamo.cuadrillaid} el{" "}
                  {new Date(reclamo.fechaAsignacion).toLocaleDateString()}.
                </div>
              </div>
              <Progress className="flex-1" value={40} />
            </div>
          );
        case "EN_PROCESO":
          return (
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-md flex items-center justify-center aspect-square w-10 dark:bg-gray-800">
                <WrenchIcon className="w-5 h-5" />
              </div>
              <div className="grid gap-1">
                <div className="font-medium">Cuadrilla acepta y soluciona</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  La cuadrilla técnica ha aceptado tu reclamo y está trabajando en la solución desde el{" "}
                  {new Date(reclamo.fechaEnProceso).toLocaleDateString()}.
                </div>
              </div>
              <Progress className="flex-1" value={80} />
            </div>
          );
        case "COMPLETADO":
          return (
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-md flex items-center justify-center aspect-square w-10 dark:bg-gray-800">
                <CheckIcon className="w-5 h-5" />
              </div>
              <div className="grid gap-1">
                <div className="font-medium">Solucionado</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Tu reclamo ha sido resuelto satisfactoriamente el{" "}
                  {new Date(reclamo.fechaCompletado).toLocaleDateString()}.
                </div>
              </div>
              <Progress className="flex-1" value={100} />
            </div>
          );
        default:
          return (
            
            <div className="flex items-center gap-4">
              {reclamo?.cuadrillaId && (
                <div>
                  <h3 className="font-medium">Cuadrilla Asignada:</h3>
                  <p>{cuadrillas.find(c => c.id === reclamo.cuadrillaId)?.nombre || 'Desconocida'}</p>
                </div>
              )}
              {!reclamo?.cuadrillaId && (
                <>
                 
                  <Select value={selectedCuadrilla} onValueChange={handleCuadrillaChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Asignar Cuadrilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Cuadrillas Disponibles</SelectLabel>
                        {cuadrillasDisponibles.map((cuadrilla) => (
                          <SelectItem key={cuadrilla.id} value={cuadrilla.nombre}>
                            {cuadrilla.nombre}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              )}
              <div className="bg-gray-100 rounded-md flex items-center justify-center aspect-square w-10 dark:bg-gray-800">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div className="grid gap-1">
                <div className="font-medium">Pendiente</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  El reclamo ha sido registrado y está en espera de asignación.
                </div>
              </div>
              <Progress className="flex-1" value={0} />
            </div>
          );
      }
    };
  
const fechaFormateada = (fechaRecibida: Date) => {
  const fecha = new Date(fechaRecibida);
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}


const getGoogleMapsLink = (lat: number, lng: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
  
    return (
      <AlertDialog open={open} onOpenChange={onClose}> 
      
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reclamo N° {reclamo?.id}</AlertDialogTitle>
            <AlertDialogDescription>
            <div className="grid gap-4 py-4">
              <div>
                <h3 className="font-medium">Fecha:</h3>
                <p>{fechaFormateada(reclamo?.fecha)}</p>

              </div>
              <div>
                <h3 className="font-medium">Reclamo:</h3>
                <Badge variant="destructive">{reclamo?.reclamo}</Badge>
              </div>
              <div>
                <h3 className="font-medium">Ubicación:</h3>
                <p>{reclamo?.ubicacion}</p>
                {reclamo?.latitud && reclamo?.longitud && (
                  <a
                    href={getGoogleMapsLink(reclamo.latitud, reclamo.longitud)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline"><MapPin /> Ver en Mapa</Button>
                  </a>
                )}
              </div>
              <div>
                <h3 className="font-medium">Barrio:</h3>
                <p>{reclamo?.barrio}</p>
              </div>
              <div>
                <h3 className="font-medium">Detalle:</h3>
                <p>{reclamo?.detalle}</p>
              </div>
              <Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Cambiar Prioridad" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Prioridad</SelectLabel>
      {prioridades.map((label) => (
        <SelectItem key={label.value} value={label.label}>
           {label.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
<Select value={selectedEstado} onValueChange={handleEstadoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {estados.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {renderEstadoMensaje()}
              {reclamo?.cuadrillaId && (
                <div>
                  <h3 className="font-medium">Cuadrilla Asignada:</h3>
                  <p>{cuadrillas.find((c) => c.id === reclamo.cuadrillaId)?.nombre || "Desconocida"}</p>
                </div>
              )}
             
</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
            <AlertDialogAction  onClick={handleSubmit}>Actualizar</AlertDialogAction>

          </AlertDialogFooter>
     
        </AlertDialogContent>
      
      </AlertDialog>
    );
  };
