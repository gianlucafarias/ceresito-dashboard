"use client"

import React, { useMemo } from 'react';
import { useQuery } from "react-query";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts" // Añadir LabelList, quitar YAxis

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"; // Para mostrar estado de carga

// Tipo para la respuesta específica de la API count-by-type
interface CountByTypeData {
    tipo: string;
    count: string; // La API devuelve count como string
}

// Función de fetching
const fetchReclamosCountByType = async (): Promise<CountByTypeData[]> => {
    const res = await fetch('https://api.ceres.gob.ar/api/api/reclamos/count-by-type', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Error al cargar conteo de reclamos por tipo');
    const data = await res.json();
    // La API devuelve el array directamente
    return Array.isArray(data) ? data : [];
};

// Definición inicial de chartConfig
const chartConfig = {
  count: {
    label: "Cantidad",
    color: "hsl(var(--chart-1))", // Añadir un color base
  },
  // Los tipos específicos se agregarán dinámicamente
} satisfies ChartConfig;

export default function ReclamosPorTipoChart() {
    // Usar el tipo específico y la función de fetch correcta
    const { data: apiData, isLoading, error } = useQuery<CountByTypeData[]>('reclamosCountByType', fetchReclamosCountByType, {
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false
    });

    // Procesar datos para el gráfico
    const { chartData, dynamicChartConfig } = useMemo(() => {
        if (!apiData || apiData.length === 0) return { chartData: [], dynamicChartConfig: chartConfig };

        // Mapear directamente los datos de la API
        const processedData = apiData.map((item, index) => ({
            tipo: item.tipo,
            count: parseInt(item.count, 10) || 0, // Convertir count a número
            fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Asignar colores cíclicamente
        }));

        // Generar configuración dinámica basada en los tipos recibidos
        const dynamicConfig: ChartConfig = {
            ...chartConfig, // Mantener la configuración base para 'count'
            ...apiData.reduce((acc, item, index) => {
                // Usar el 'tipo' como clave para la configuración dinámica
                // Protección contra item.tipo nulo
                const tipoLabel = item.tipo ? (item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)) : 'Sin Tipo'; // O usar '' si prefieres
                const tipoKey = item.tipo ?? `unknown_${index}`; // Clave única si tipo es null

                acc[tipoKey] = {
                    label: tipoLabel, 
                    color: `hsl(var(--chart-${(index % 5) + 1}))`,
                };
                return acc;
            }, {} as Record<string, { label: string; color: string }>),
        };

        return { chartData: processedData, dynamicChartConfig: dynamicConfig };
    }, [apiData]); // Depender de apiData


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-8 w-full" />
                </CardFooter>
            </Card>
        );
    }

    if (error) {
       return (
           <Card>
                <CardHeader>
                    <CardTitle>Error al cargar datos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">No se pudieron cargar los datos de los reclamos.</p>
                </CardContent>
           </Card>
       )
    }

    if (chartData.length === 0) {
        return (
           <Card>
                <CardHeader>
                    <CardTitle>Reclamos por Tipo</CardTitle>
                    <CardDescription>Cantidad de reclamos agrupados por su tipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>No hay datos de reclamos disponibles para mostrar.</p>
                </CardContent>
           </Card>
       )
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Reclamos por Tipo</CardTitle>
        <CardDescription>Cantidad de reclamos registrados agrupados por tipo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicChartConfig} className="h-48 w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tipo"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => dynamicChartConfig[value as keyof typeof dynamicChartConfig]?.label ?? value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />} // Ocultar etiqueta de color
            />
            <Bar
              dataKey="count"
              radius={5}
              // fill no es necesario aquí si se define en los datos
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
