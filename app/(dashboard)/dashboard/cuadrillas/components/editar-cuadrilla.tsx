import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { Checkbox } from "@/components/ui/checkbox";

interface EditarCuadrillaDialogProps {
  open: boolean;
  onClose: () => void;
  cuadrilla: any;
  onUpdateCuadrilla: (cuadrilla: any) => void;
}

interface TipoCuadrilla {
  id: string;
  nombre: string;
  selected?: boolean;
}

export const EditarCuadrillaDialog = ({
  open,
  onClose,
  cuadrilla,
  onUpdateCuadrilla,
}: EditarCuadrillaDialogProps) => {
  const { register, handleSubmit, setValue, formState: {  } } = useForm();
  const [tipos, setTipos] = useState<TipoCuadrilla[]>([]);

  useEffect(() => {
    const fetchTipoReclamos = async () => {
      try {
        const response = await fetch('/api/tipoReclamo');
        if (response.ok) {
          const data = await response.json();
          setTipos(data.map((tipo: any) => ({
            ...tipo,
            selected: cuadrilla.tipo.some((t: any) => t.id === tipo.id),
          })));
        }
      } catch (error) {
        console.error('Error al obtener los tipos de reclamos:', error);
      }
    };

    fetchTipoReclamos();
  }, [cuadrilla]);

  useEffect(() => {
    setValue('nombre', cuadrilla.nombre);
    setValue('telefono', cuadrilla.telefono);
    setValue('limiteReclamos', cuadrilla.limiteReclamosSimultaneos);
  }, [cuadrilla, setValue]);

  const onSubmit = async (data: any) => {
    const selectedTipos = tipos.filter((tipo) => tipo.selected).map((tipo) => tipo.id);
    const formData = {
      nombre: data.nombre,
      telefono: data.telefono,
      tipos: selectedTipos,
      limiteReclamosSimultaneos: parseInt(data.limiteReclamos),
    };
  
    try {
      const response = await fetch(`/api/cuadrillas/${cuadrilla.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      if (response.ok) {
        const updatedCuadrilla = await response.json();
        onUpdateCuadrilla(updatedCuadrilla);
        onClose();
      } else {
        console.error("Error al actualizar la cuadrilla:", response.statusText);
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
    }
  };

  const handleTipoChange = (id: string) => {
    setTipos((prevTipos) => {
      return prevTipos.map((tipo) => {
        if (tipo.id === id) {
          return { ...tipo, selected: !tipo.selected };
        }
        return tipo;
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cuadrilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="nombreEdit"
            >
              Nombre de la cuadrilla
            </Label>
            <Input
              id="nombreEdit"
              {...register('nombre')}
            />
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="telefonoEdit"
            >
              Número de teléfono en formato ejemplo: 3491445588
            </Label>
            <Input
              id="telefonoEdit"
              {...register('telefono')}
            />
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="tipoEdit"
            >
              Tipos de cuadrilla
            </Label>
            <div className="mt-1 space-y-2">
              {tipos.map((tipo) => (
                <div key={tipo.id} className="flex items-center">
                  <Checkbox
                    id={tipo.id}
                    checked={tipo.selected}
                    onCheckedChange={() => handleTipoChange(tipo.id)}
                  />
                  <Label htmlFor={tipo.id}>{tipo.nombre}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="limiteReclamosEdit"
            >
              Límite de reclamos
            </Label>
            <Input
              id="limiteReclamosEdit"
              type="number"
              {...register('limiteReclamos')}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Guardar cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
