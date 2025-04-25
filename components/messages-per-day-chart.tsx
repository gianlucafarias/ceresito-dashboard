"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format, subDays, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton";

// Interfaz para los datos procesados que usará el gráfico
interface DailyMessageData {
  date: string; // Mantener como string YYYY-MM-DD o similar para el eje X
  count: number; // Convertir el count a número
}

// Configuración básica del gráfico
const chartConfig = {
  messages: {
    label: "Mensajes",
    color: "#009C69", // Usar el color directamente
  },
} satisfies ChartConfig

// Función para obtener la fecha en formato YYYY-MM-DD
const getFormattedDate = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export function MessagesPerDayChart() {
  const [chartData, setChartData] = React.useState<DailyMessageData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<string>("90d"); // Estado para el rango, default 3 meses

  // Texto descriptivo basado en el rango
  const timeRangeDescription: { [key: string]: string } = {
    "90d": "Últimos 3 meses",
    "180d": "Últimos 6 meses",
    "365d": "Último año",
  };

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Calcular fechas basado en timeRange
        const endDate = new Date();
        let startDate: Date;
        switch (timeRange) {
          case "180d":
            startDate = subMonths(endDate, 6);
            break;
          case "365d":
            startDate = subYears(endDate, 1);
            break;
          case "90d":
          default:
            startDate = subMonths(endDate, 3); // Por defecto 3 meses
            break;
        }
        
        const startDateString = getFormattedDate(startDate);
        const endDateString = getFormattedDate(endDate);
        const groupBy = 'day'; // Agrupar por día

        // Construir la URL de la API
        // Asegúrate que la URL base sea la correcta (localhost:3001 o la URL de producción)
        const apiUrl = `https://api.ceres.gob.ar/api/api/interactions/last-week/count/${startDateString}/${endDateString}/${groupBy}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error al obtener los datos: ${response.statusText}`);
        }
        const data: { date: string; count: string }[] = await response.json();

        // Procesar los datos: convertir count a número
        const processedData = data.map(item => ({
          date: item.date, // La fecha ya viene como string de la API
          count: parseInt(item.count, 10) || 0, // Convertir a número, default 0 si falla
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar por fecha asc

        setChartData(processedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error desconocido");
        }
        console.error("Error fetching daily messages:", err);
        setChartData([]); // Limpiar datos en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]); // <-- Añadir timeRange como dependencia del useEffect

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
            <CardTitle>Mensajes Enviados por Día</CardTitle>
            {/* Actualizar descripción dinámicamente */}
            <CardDescription>{timeRangeDescription[timeRange] || "Seleccione un período"}</CardDescription>
        </div>
         {/* Añadir el Select para el rango de fechas */}
         <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[180px] ml-auto"
            aria-label="Seleccionar rango de tiempo"
          >
            <SelectValue placeholder="Seleccionar rango" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">Últimos 3 meses</SelectItem>
            <SelectItem value="180d">Últimos 6 meses</SelectItem>
            <SelectItem value="365d">Último año</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : error ? (
           <div className="flex h-[250px] w-full items-center justify-center text-destructive">
             Error al cargar datos: {error}
           </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
            No hay datos disponibles para el período seleccionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={10} // Ajusta el espacio mínimo entre ticks si hay muchas barras
                tickFormatter={(value) => {
                  // Formatear la fecha para mostrar en el eje X (ej: 'Nov 26')
                  try {
                    const date = new Date(value);
                    return format(date, "d MMM", { locale: es });
                  } catch (e) {
                    return value; // Fallback si la fecha no es válida
                  }
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => {
                       // Formatear la fecha en el tooltip (ej: '26 de Noviembre de 2024')
                      try {
                        const date = new Date(value);
                        return format(date, "PPP", { locale: es }); // Formato localizado largo
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                }
              />
              <Bar dataKey="count" fill="#009C69" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
} 