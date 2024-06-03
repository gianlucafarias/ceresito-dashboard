import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCheck, CheckIcon, ChevronDown, LightbulbIcon, PawPrintIcon, Send, TreesIcon, UsersIcon, WrenchIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { EditarCuadrillaDialog } from "./editar-cuadrilla";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface Mensaje {
    id: number;
    contenido: string;
    remitente: string;
    leido: boolean;
    timestamp: Date;
}

interface Cuadrilla {
    id: number;
    ultimaAsignacion: Date;
    nombre: string;
    tipo: Array<{ id: number; nombre: string }>;
    disponible: boolean;
    onDelete: () => void;
    reclamosAsignados: number[];
    telefono: number;
    limiteReclamosSimultaneos: number;
}

const CuadrillaCard: React.FC<Cuadrilla> = ({ id, ultimaAsignacion, nombre, tipo, disponible, onDelete, reclamosAsignados, telefono, limiteReclamosSimultaneos }) => {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState<string>('');
    const [mensajesNoLeidos, setMensajesNoLeidos] = useState<number>(0);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchMensajes = async () => {
            try {
                const response = await fetch(`/api/cuadrillas/${id}/mensajes`);
                if (response.ok) {
                    const data: Mensaje[] = await response.json();
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

    useEffect(() => {
        if (isChatOpen) {
            const markMessagesAsRead = async () => {
                try {
                    const response = await fetch(`/api/cuadrillas/${id}/mensajes`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        setMensajes((prevMensajes) =>
                            prevMensajes.map((mensaje) => ({ ...mensaje, leido: true }))
                        );
                        setMensajesNoLeidos(0);
                    } else {
                        console.error('Error al marcar los mensajes como leídos');
                    }
                } catch (error) {
                    console.error('Error al marcar los mensajes como leídos:', error);
                }
            };

            markMessagesAsRead();
        }
    }, [isChatOpen, id]);

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

    const renderTipoIcono = (tipo: string) => {
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

    const fechaFormateada = (fechaRecibida: Date) => {
        const fecha = new Date(fechaRecibida);
        const dia = fecha.getDate().toString().padStart(2, "0");
        const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    };

    const renderLeidoIcono = (leido: boolean) => {
        return leido ? (
            <CheckCheck className="w-4 h-4 text-green-500" />
        ) : (
            <CheckIcon className="w-4 h-4 text-gray-500" />
        );
    };

    const handleUpdateCuadrilla = (updatedCuadrilla: Cuadrilla) => {
        toast({ description: "Cuadrilla actualizada correctamente" });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <UsersIcon className="w-8 h-8" />
                <div className="grid gap-1">
                    <CardTitle>{nombre}</CardTitle>
                    <div className="flex items-center gap-1">
                        {tipo.length > 1 ? (
                          <TooltipProvider>

                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center gap-1">
                                        {renderTipoIcono(tipo[0].nombre)}
                                        <span className="text-gray-500 dark:text-gray-400">{tipo[0].nombre} +{tipo.length - 1} más</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {tipo.map(t => (
                                        <div key={t.id} className="flex items-center gap-1">
                                            {renderTipoIcono(t.nombre)}
                                            <span>{t.nombre}</span>
                                        </div>
                                    ))}
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <div className="flex items-center gap-1">
                                {renderTipoIcono(tipo[0].nombre)}
                                <span className="text-gray-500 dark:text-gray-400">{tipo[0].nombre}</span>
                            </div>
                        )}
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
                        <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Editar Cuadrilla</DropdownMenuItem>
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
                        <span>{reclamosAsignados?.length ?? 0} reclamos asignados</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CheckIcon className={`w-5 h-5 ${disponible ? 'text-green-500' : 'text-red-500'}`} />
                    <span>{disponible ? 'Disponible' : 'No Disponible'}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Última Asignación: {fechaFormateada(ultimaAsignacion)}</p>
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="relative">
                            <Send className="mr-2 h-4 w-4" />
                            {mensajesNoLeidos > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{mensajesNoLeidos}</span>
                            )}
                            Enviar Mensaje
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Conversación con Cuadrilla de {nombre}</DialogTitle>
                            <DialogDescription>Revisa el historial de mensajes y continúa la conversación.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-80 overflow-y-auto">
                            {mensajes.map((mensaje) => (
                                <div key={mensaje.id} className="grid grid-cols-[50px_1fr] items-start gap-4">
                                    <Avatar>
                                        <AvatarImage alt={mensaje.remitente} src="/placeholder-avatar.jpg" />
                                        <AvatarFallback>{mensaje.remitente.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <div className={`p-3 text-sm rounded-lg ${mensaje.remitente === 'Cuadrilla' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                                            <p>{mensaje.contenido}</p>
                                            <div className="flex justify-end items-center gap-1">
                                                {renderLeidoIcono(mensaje.leido)}
                                            </div>
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
                <EditarCuadrillaDialog
                    open={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    cuadrilla={{ id, nombre, telefono, disponible, tipo, limiteReclamosSimultaneos }}
                    onUpdateCuadrilla={handleUpdateCuadrilla}
                />
            </CardContent>
        </Card>
    );
};

export default CuadrillaCard;
