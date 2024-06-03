import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PhoneInput } from "./phone-input";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [telefono, setTelefono] = useState<string>("");

  useEffect(() => {
    const fetchTipoReclamos = async () => {
      try {
        const response = await fetch('/api/tipoReclamo');
        if (response.ok) {
          const data = await response.json();
          setTipos(data.map((tipo: any) => ({ ...tipo, selected: false })));
        }
      } catch (error) {
        console.error('Error al obtener los tipos de reclamos:', error);
      }
    };

    fetchTipoReclamos();
  }, []);

  const onSubmit = async (data: any) => {
    const selectedTipos = tipos.filter((tipo) => tipo.selected).map((tipo) => tipo.id);
    const formData = {
      nombre: data.nombre,
      telefono: telefono,
      tipos: selectedTipos,
      limiteReclamosSimultaneos: parseInt(data.limiteReclamos),
    };

    console.log(formData);

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
        onAddCuadrilla(nuevaCuadrilla);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar nueva cuadrilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="nombre">
              Nombre de la cuadrilla
            </Label>
            <Input id="nombre" {...register('nombre', { required: 'Este campo es requerido' })} />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="telefono">
              Número de teléfono sin 0 y sin 15. Ejemplo: 3491445588
            </Label>
          <PhoneInput value={telefono} onChange={setTelefono}   />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="tipo-cuadrilla">
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
                  <Label htmlFor={tipo.id} className="ml-2">{tipo.nombre}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="limiteReclamos">
              Límite de reclamos
            </Label>
            <Input id="limiteReclamos" type="number" {...register('limiteReclamos')} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
            <Button type="submit">Guardar cuadrilla</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
