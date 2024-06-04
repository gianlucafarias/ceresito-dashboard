import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MapPin, ClockIcon, CheckIcon, WrenchIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReclamoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  reclamo: Reclamo | null;
}

export const DetallesReclamoDialog: React.FC<ReclamoDetailsDialogProps> = ({
  open,
  onClose,
  reclamo,
}) => {
  if (!reclamo) return null;

  const fechaFormateada = (fechaRecibida: string) => {
    const fecha = new Date(fechaRecibida);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const getGoogleMapsLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Reclamo</DialogTitle>
          <DialogDescription>
            Información detallada del reclamo seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div>
            <strong>Fecha:</strong> {reclamo.fecha}
          </div>
          <div>
            <strong>Nombre:</strong> {reclamo.nombre}
          </div>
          <div>
            <strong>Teléfono:</strong> {reclamo.telefono}
          </div>
          <div>
            <strong>Ubicación:</strong> {reclamo.ubicacion}
            {reclamo.latitud && reclamo.longitud && (
              <a
                href={getGoogleMapsLink(reclamo.latitud, reclamo.longitud)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <MapPin /> Ver en Mapa
                </Button>
              </a>
            )}
          </div>
          <div>
            <strong>Barrio:</strong> {reclamo.barrio}
          </div>
          <div>
            <strong>Imagen:</strong>
            <img
              src={reclamo.imagen}
              alt="Imagen del reclamo"
              className="mt-2 h-32 w-32 object-cover"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};