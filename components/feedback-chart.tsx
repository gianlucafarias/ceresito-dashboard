"use client"

import * as React from "react"
import { Pie, PieChart, Sector, Cell } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { TrendingUp } from "lucide-react"

import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import {
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

// Interfaz para los datos de feedback de la API
interface FeedbackData {
  id: number;
  calificacion: string;
  comentario: string | null;
  timestamp: string;
}

// Interfaz para los datos procesados para el gráfico
interface ChartDataPoint {
  name: string;
  value: number;
  fill: string;
}

// Mapeo de calificaciones a colores y etiquetas legibles
const ratingConfig: { [key: string]: { label: string; color: string } } = {
  "⭐️ excelente": { label: "Excelente", color: "hsl(var(--chart-1))" }, 
  "👍 buena": { label: "Buena", color: "hsl(var(--chart-2))" }, 
  "😐 mejorable": { label: "Mejorable", color: "hsl(var(--chart-3))" }, 
};

// Generar chartConfig dinámicamente desde ratingConfig (solo labels)
const chartConfig = Object.entries(ratingConfig).reduce((acc, [key, value]) => {
  acc[value.label] = { label: value.label }; // Solo necesitamos el label aquí
  return acc;
}, {} as ChartConfig);

export function FeedbackChart() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([]);
  const [totalFeedbacks, setTotalFeedbacks] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId()

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `https://api.ceres.gob.ar/api/api/feedback`; // Asegúrate que la URL es correcta
        const response = await fetch(apiUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Error al obtener feedback: ${response.statusText}`);
        }
        const data: FeedbackData[] = await response.json();

        // Contar ocurrencias de cada calificación
        const counts = data.reduce((acc, item) => {
          acc[item.calificacion] = (acc[item.calificacion] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // Mapear a formato de gráfico, usando ratingConfig
        const processedData = Object.entries(counts)
          .map(([calificacion, count]) => {
            const config = ratingConfig[calificacion];
            return {
              name: config ? config.label : calificacion, // Usar label legible o la calificación original
              value: count,
              // Usar el color directo del config, o un gris por defecto si no se encuentra
              fill: config ? config.color : "var(--chart-4)" // Usar color corregido
            };
          })
          .sort((a, b) => b.value - a.value); // Opcional: ordenar por valor

        setChartData(processedData);
        setTotalFeedbacks(data.length);

      } catch (err) {
         if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error desconocido");
        }
        console.error("Error fetching feedback data:", err);
        setChartData([]);
        setTotalFeedbacks(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartId = `feedback-chart-${id}`

  return (
    <Card data-chart={chartId} className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Feedback del Bot</CardTitle>
        <CardDescription>Distribución de calificaciones</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            Error: {error}
          </div>
         ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No hay datos de feedback.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="value"/>}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={0}
                activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} />
                )}
              >
                 {/* Renderizar Cells para aplicar colores */}
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className={`fill-[${entry.fill}]`} />
                 ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Feedback Reciente <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando la distribución total de calificaciones.
        </div>
      </CardFooter>
    </Card>
  )
} 
