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
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';

interface AgregarCuadrillaDialogProps {
  open: boolean;
  onClose: () => void;
  onAddCuadrilla: (cuadrilla: any) => void;

}

interface TipoCuadrilla {
    id: string;
    nombre: string;
    selected?: boolean;
  }
  

  export const AgregarCuadrillaDialog = ({
    open,
    onClose,
    onAddCuadrilla,
  }: AgregarCuadrillaDialogProps) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [tipos, setTipos] = useState<TipoCuadrilla[]>([]);
  
    useEffect(() => {
      const fetchTipoReclamos = async () => {
        try {
          const response = await fetch('/api/tipoReclamo');
          if (response.ok) {
            const data = await response.json();
            setTipos(data.map((tipo: any) => ({ ...tipo, selected: false }))); // Asegúrate de que cada tipo tenga una propiedad "selected"
          }
        } catch (error) {
          console.error('Error al obtener los tipos de reclamos:', error);
        }
      };
  
      fetchTipoReclamos();
    }, []);
  
    const onSubmit = async (data: any) => {
      const selectedTipos = tipos.filter((tipo) => tipo.selected).map((tipo) => tipo.id); // Filtrar los tipos seleccionados
      const formData = {
        nombre: data.nombre,
        telefono: data.telefono,
        tipos: selectedTipos, // Enviar los IDs de los tipos seleccionados
        limiteReclamosSimultaneos: parseInt(data.limiteReclamos),
      };
  
      console.log(formData); // Agregar console.log para verificar los datos enviados
  
      try {
        const response = await fetch("/api/cuadrillas/agregar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        if (response.ok) {
          const nuevaCuadrilla = await response.json();
          onAddCuadrilla(nuevaCuadrilla); // Llamar a la función callback
          onClose();
        } else {
          console.error("Error al guardar la cuadrilla:", response.statusText);
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
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar nueva cuadrilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="name"
            >
              Nombre de la cuadrilla
            </Label>
            <Input
              id="nombre"
              {...register('nombre', { required: 'Este campo es requerido' })}
            />
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="type-arreglos"
            >
              Número de teléfono en formato ejemplo: 3491445588
            </Label>
            <Input
              id="telefono"
              {...register('telefono', { required: 'Este campo es requerido' })}
            />
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="type-arreglos">
              Tipos de cuadrilla
            </Label>
            <div className="mt-1 space-y-2">
                    {tipos.map((tipo) => (
                    <div key={tipo.id} className="flex items-center">
                    <input
                    type="checkbox"
                    id={tipo.id}
                    checked={tipo.selected}
                    onChange={() => handleTipoChange(tipo.id)}
                    />
                    <Label htmlFor={tipo.id}>{tipo.nombre}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="claim-limit"
            >
              Límite de reclamos
            </Label>
            <Input
              id="limiteReclamos"
              type="number"
              {...register('limiteReclamos', { required: 'Este campo es requerido' })}
            />
            {errors.limiteReclamos && <span>{errors.limiteReclamos.message}</span>}
          </div>

          <DialogFooter>
            <Button type="submit">Guardar cuadrilla</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
