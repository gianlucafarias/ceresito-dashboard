"use client"
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ClockIcon, FilterIcon, ListOrderedIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CardsStats } from "./components/TipoReclamosChart";

export default function page() {
    const [cuadrillasActivas, setCuadrillasActivas] = useState(0);
    const [reclamosAbiertos, setReclamosAbiertos] = useState(0);
    const [reclamosResueltos, setReclamosResueltos] = useState(0);
    const [tiempoPromedio, setTiempoPromedio] = useState("");
    const [cuadrillas, setCuadrillas] = useState([]);
    const [comparacionReclamosAbiertos, setComparacionReclamosAbiertos] = useState(0);
    const [comparacionReclamosResueltos, setComparacionReclamosResueltos] = useState(0);

    useEffect(() => {
        // Fetch data for metrics
        fetch('/api/cuadrillas')
            .then(res => res.json())
            .then(data => {
                setCuadrillas(data);
                const activas = data.filter((cuadrilla) => cuadrilla.disponible).length;
                setCuadrillasActivas(activas);
            })
            .catch(err => console.error(err));

        fetch('https://api.ceres.gob.ar/api/api/reclamos')
            .then(res => res.json())
            .then(data => {
                const abiertos = data.filter((reclamo) => reclamo.estado === 'PENDIENTE').length;
                setReclamosAbiertos(abiertos);

                const resueltos = data.filter((reclamo) => reclamo.estado === 'COMPLETADO').length;
                setReclamosResueltos(resueltos);

                const hoy = new Date();
                const hace7Dias = new Date(hoy);
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                const hace14Dias = new Date(hoy);
                hace14Dias.setDate(hace14Dias.getDate() - 14);

                const abiertosSemanaActual = data.filter((reclamo) => 
                    new Date(reclamo.fecha) >= hace7Dias && reclamo.estado === 'PENDIENTE').length;
                const abiertosSemanaAnterior = data.filter((reclamo) => 
                    new Date(reclamo.fecha) >= hace14Dias && new Date(reclamo.fecha) < hace7Dias && reclamo.estado === 'PENDIENTE').length;

                const resueltosSemanaActual = data.filter((reclamo) => 
                    new Date(reclamo.fecha) >= hace7Dias && reclamo.estado === 'COMPLETADO').length;
                const resueltosSemanaAnterior = data.filter((reclamo) => 
                    new Date(reclamo.fecha) >= hace14Dias && new Date(reclamo.fecha) < hace7Dias && reclamo.estado === 'COMPLETADO').length;

                const porcentajeAbiertos = abiertosSemanaAnterior > 0 ? ((abiertosSemanaActual - abiertosSemanaAnterior) / abiertosSemanaAnterior) * 100 : (abiertosSemanaActual > 0 ? 100 : 0);
                const porcentajeResueltos = resueltosSemanaAnterior > 0 ? ((resueltosSemanaActual - resueltosSemanaAnterior) / resueltosSemanaAnterior) * 100 : (resueltosSemanaActual > 0 ? 100 : 0);

                setComparacionReclamosAbiertos(porcentajeAbiertos);
                setComparacionReclamosResueltos(porcentajeResueltos);
            })
            .catch(err => console.error(err));

        async function fetchRegistros() {
            try {
                const response = await fetch("/api/registro-reclamo");
                const data = await response.json();

                const tiempos = data
                    .filter((registro) => registro.fechaRegistro && registro.fechaSolucion)
                    .map((registro) => new Date(registro.fechaSolucion).getTime() - new Date(registro.fechaRegistro).getTime());

                if (tiempos.length > 0) {
                    const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
                    setTiempoPromedio(promedio);
                }
            } catch (error) {
                console.error("Error al obtener los registros de reclamos:", error);
            }
        }

        fetchRegistros();
    }, []);

    const convertirTiempoPromedio = (milisegundos) => {
        const horas = Math.floor(milisegundos / (1000 * 60 * 60));
        const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60));
        return `${horas}h ${minutos}m`;
    };

    const formatPorcentaje = (porcentaje) => {
        if (porcentaje > 0) {
            return `+${porcentaje.toFixed(1)}%`;
        } else if (porcentaje < 0) {
            return `${porcentaje.toFixed(1)}%`;
        } else {
            return '0%';
        }
    };

    return (
        <ScrollArea className="h-full">
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Hola, bienvenido al panel de Obras Públicas👋
                    </h2>
                </div>
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsContent value="overview" className="space-y-4">
                        <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
                            {cuadrillas === null ? (
                                <Skeleton className="h-[120px]" />
                            ) : (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Cuadrillas Activas</CardTitle>
                                        <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{cuadrillasActivas}</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">+2 desde ayer</p>
                                    </CardContent>
                                </Card>
                            )}
                            
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Reclamos Pendientes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reclamosAbiertos}</div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatPorcentaje(comparacionReclamosAbiertos)} desde la semana anterior
                                    </p>
                                </CardContent>
                            </Card>
                            {reclamosResueltos === null ? (
                                <Skeleton className="h-[120px]" />
                            ) : (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Reclamos Resueltos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reclamosResueltos}</div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatPorcentaje(comparacionReclamosResueltos)} desde la semana anterior
                                    </p>
                                </CardContent>
                            </Card>
                             )}
                              {tiempoPromedio === null ? (
                                <Skeleton className="h-[120px]" />
                            ) : (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Tiempo Promedio de Solución</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{convertirTiempoPromedio(tiempoPromedio)}</div>
                                </CardContent>
                            </Card>
                             )}
                        </section>
                        <CardsStats />
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollArea>
    );
}
