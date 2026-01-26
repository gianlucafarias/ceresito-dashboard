"use client"

import React, { useMemo } from 'react';
import { useQuery } from "react-query";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

// Tipo para la respuesta específica de la API count-by-barrio
interface CountByBarrioData {
    barrio: string;
    count: string; // La API devuelve count como string
}

// Función de fetching
const fetchReclamosCountByBarrio = async (): Promise<CountByBarrioData[]> => {
    const res = await fetch('https://api.ceres.gob.ar/api/api/reclamos/count-by-barrio', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Error al cargar conteo de reclamos por barrio');
    const data = await res.json();
    // La API devuelve el array directamente
    return Array.isArray(data) ? data : [];
};

// Definición inicial de chartConfig (se adaptará dinámicamente)
const chartConfig = {
  count: {
    label: "Cantidad",
  },
  // Los barrios específicos se agregarán dinámicamente
} satisfies ChartConfig;

export default function ReclamosPorBarrioChart() {
    const { data: apiData, isLoading, error } = useQuery<CountByBarrioData[]>('reclamosCountByBarrio', fetchReclamosCountByBarrio, {
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false
    });

    // Procesar datos para el gráfico
    const { chartData, dynamicChartConfig } = useMemo(() => {
        if (!apiData || apiData.length === 0) return { chartData: [], dynamicChartConfig: chartConfig };

        // Mapear directamente los datos de la API
        const processedData = apiData.map((item, index) => ({
            barrio: item.barrio || 'Sin Barrio', // Asegurar que hay un nombre
            count: parseInt(item.count, 10) || 0, // Convertir count a número
            fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Asignar colores cíclicamente
        }));

        // Generar configuración dinámica basada en los barrios recibidos
        const dynamicConfig: ChartConfig = {
            ...chartConfig, // Mantener la configuración base para 'count'
            ...processedData.reduce((acc, item) => {
                // Usar el 'barrio' como clave para la configuración dinámica
                acc[item.barrio] = {
                    label: item.barrio.charAt(0).toUpperCase() + item.barrio.slice(1), // Capitalizar etiqueta
                    color: item.fill, // Usar el color asignado
                };
                return acc;
            }, {} as Record<string, { label: string; color: string }>),
        };

        return { chartData: processedData, dynamicChartConfig: dynamicConfig };
    }, [apiData]); // Depender de apiData

    if (isLoading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex justify-center items-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm pt-4">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardFooter>
            </Card>
        );
    }

    if (error) {
       return (
           <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Error al cargar datos</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <p className="text-red-500 text-center py-10">No se pudieron cargar los datos de reclamos por barrio.</p>
                </CardContent>
           </Card>
       );
    }

    if (chartData.length === 0) {
        return (
           <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Reclamos por Barrio</CardTitle>
                    <CardDescription>Distribución de reclamos por barrio.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <p className="text-center py-10">No hay datos de reclamos por barrio disponibles.</p>
                </CardContent>
           </Card>
       );
    }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Reclamos por Barrio</CardTitle>
        <CardDescription>Distribución porcentual por barrio</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count" // La clave con el valor numérico
              nameKey="barrio" // La clave con el nombre para la etiqueta/tooltip
              innerRadius={60} // Opcional: para hacer un gráfico de dona
              outerRadius={100} // Ajusta el tamaño
              paddingAngle={2} // Opcional: espacio entre secciones
              strokeWidth={0} // Sin borde entre secciones
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
         {/* Podríamos mostrar aquí alguna estadística calculada si fuera relevante */}
        <div className="leading-none text-muted-foreground text-center w-full">
          Mostrando la distribución de reclamos por barrio.
        </div>
         {/* Ejemplo de cómo sería el footer del ejemplo original, adaptado:
         <div className="flex items-center gap-2 font-medium leading-none self-center">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
         </div>
         <div className="leading-none text-muted-foreground self-center">
             Showing total visitors for the last 6 months
         </div>
         */}
      </CardFooter>
    </Card>
  )
} 
