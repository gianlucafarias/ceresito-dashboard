import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin  } from "lucide-react";
import { Reclamo } from "@/types";
import Image from "next/image";
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
            <Image
              src={reclamo.imagen}
              alt="Imagen del reclamo"
              width={128}
              height={128}
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