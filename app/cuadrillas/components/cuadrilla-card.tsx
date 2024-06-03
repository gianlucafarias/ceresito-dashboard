import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDown, CircleIcon, ContactIcon, LightbulbIcon, MoveHorizontalIcon, PawPrintIcon, Send, TreesIcon, UsersIcon, WrenchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";

const CuadrillaCard = ({ id, ultimaAsignacion, nombre, estado, tipo, disponibilidad, onDelete }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        const response = await fetch(`/api/cuadrillas/${id}/mensajes`);
        if (response.ok) {
          const data = await response.json();
          setMensajes(data);
          const noLeidos = data.filter(mensaje => !mensaje.leido).length;
          setMensajesNoLeidos(noLeidos);
        } else {
          console.error('Error al obtener los mensajes');
        }
      } catch (error) {
        console.error('Error al obtener los mensajes:', error);
      }
    };

    fetchMensajes();
  }, [id]);

  const handleNuevoMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      const response = await fetch(`/api/cuadrillas/${id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: nuevoMensaje,
          remitente: 'Usuario', 
        }),
      });

      if (response.ok) {
        const mensaje = await response.json();
        setMensajes((prevMensajes) => [...prevMensajes, mensaje]);
        setNuevoMensaje('');
      } else {
        console.error('Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    }
  };

  const marcarMensajesComoLeidos = async () => {
    try {
      const response = await fetch(`/api/cuadrillas/${id}/mensajes`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setMensajes((prevMensajes) =>
          prevMensajes.map(mensaje => ({ ...mensaje, leido: true }))
        );
        setMensajesNoLeidos(0);
      } else {
        console.error('Error al marcar los mensajes como leídos');
      }
    } catch (error) {
      console.error('Error al marcar los mensajes como leídos:', error);
    }
  };

  const renderTipoIcono = (tipo) => {
    switch (tipo) {
      case "Luminarias":
        return <LightbulbIcon className="w-4 h-4" />;
      case "Arreglos":
        return <WrenchIcon className="w-4 h-4" />;
      case "Arboles":
        return <TreesIcon className="w-4 h-4" />;
      case "Animales":
        return <PawPrintIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <UsersIcon className="w-8 h-8" />
        <div className="grid gap-1">
          <CardTitle>{nombre}</CardTitle>
          <div className="flex items-center gap-1">
            {tipo.map(t => (
              <div key={t.id} className="flex items-center gap-1">
                {renderTipoIcono(t.nombre)}
                <span className="text-gray-500 dark:text-gray-400">{t.nombre}</span>
              </div>
            ))}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" size="icon" variant="ghost">
              <ChevronDown className="w-4 h-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar Cuadrilla</DropdownMenuItem>
            <DropdownMenuItem>Asignar Reclamo</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Eliminar Cuadrilla</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400">Reclamos asignados:</p>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span>3 reclamos asignados</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CircleCheckIcon className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Disponible</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Ultima Asignación: {ultimaAsignacion}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" onClick={marcarMensajesComoLeidos}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensaje
              {mensajesNoLeidos > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {mensajesNoLeidos}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Conversación con Cuadrilla de {nombre}</DialogTitle>
              <DialogDescription>Revisa el historial de mensajes y continúa la conversación.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {mensajes.map((mensaje) => (
                <div key={mensaje.id} className="grid grid-cols-[50px_1fr] items-start gap-4">
                  <Avatar>
                    <AvatarImage alt={mensaje.remitente} src="/placeholder-avatar.jpg" />
                    <AvatarFallback>{mensaje.remitente.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className={`p-3 text-sm rounded-lg ${mensaje.remitente === 'Cuadrilla' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                      <p>{mensaje.contenido}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(mensaje.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <div className="grid grid-cols-[1fr_auto] items-center gap-6">
                <Textarea
                  className="h-20"
                  placeholder="Escribe tu mensaje aquí..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                />
                <Button onClick={handleNuevoMensaje}>Enviar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CuadrillaCard;

function CircleCheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CircleXIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
