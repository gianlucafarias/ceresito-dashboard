"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CardsStats } from "./cuadrillas/reportes/components/TipoReclamosChart";

export default function DashboardPage() {
    const [cuadrillasActivas, setCuadrillasActivas] = useState(0);
    const [reclamosPendientes, setReclamosPendientes] = useState(0);
    const [reclamosAsignados, setReclamosAsignados] = useState(0);
    const [reclamosCompletados, setReclamosCompletados] = useState(0);
    const [cuadrillas, setCuadrillas] = useState([]);
    const [tiempoPromedio, setTiempoPromedio] = useState("");

    useEffect(() => {
        // Fetch data for cuadrillas
        fetch('/api/cuadrillas')
            .then(res => res.json())
            .then(data => {
                setCuadrillas(data);
                const activas = data.filter((cuadrilla) => cuadrilla.disponible).length;
                setCuadrillasActivas(activas);
            })
            .catch(err => console.error(err));

        // Fetch data for reclamos
        fetch('https://api.ceres.gob.ar/api/api/reclamos')
            .then(res => res.json())
            .then(data => {
                const pendientes = data.data.filter((reclamo) => reclamo.estado === 'PENDIENTE').length;
                setReclamosPendientes(pendientes);

                const asignados = data.data.filter((reclamo) => reclamo.estado === 'ASIGNADO').length;
                setReclamosAsignados(asignados);

                const completados = data.data.filter((reclamo) => reclamo.estado === 'COMPLETADO').length;
                setReclamosCompletados(completados);
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
                                    <div className="text-2xl font-bold">{reclamosPendientes}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Reclamos Asignados</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reclamosAsignados}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Reclamos Completados</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reclamosCompletados}</div>
                                </CardContent>
                            </Card>
                            
                        </section>
                        <CardsStats />
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollArea>
    );
}
