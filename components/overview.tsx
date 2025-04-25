"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"
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

const chartConfig = {
  desktop: {
    label: "Visitas",
    color: "#009C69",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig

async function fetchVisitasFlujo() {
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/visitas-flujo");
    const data = await response.json();
    
    // Asegurarnos que visitasFlujo existe y es un array
    if (data && Array.isArray(data.visitasFlujo)) {
      // Filtrar flujos con contador >= 1 y luego ordenar por contador descendente
      return data.visitasFlujo
        .filter((flujo: any) => flujo.contador >= 1)
        .sort((a: any, b: any) => b.contador - a.contador);
    } else {
      console.error("La respuesta de la API no tiene el formato esperado:", data);
      return []; // Devolver array vacío si el formato no es correcto
    }
  } catch (error) {
    console.error("Error fetching visitas-flujo:", error);
    return []; // Devolver array vacío en caso de error de fetch
  }
}

export function Overview() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchAndSetData() {
      const visitasFlujo = await fetchVisitasFlujo();
      setData(
        visitasFlujo.map((item: any) => ({
          name: item.nombre_flujo,
          total: item.contador,
        }))
      );
    }
    fetchAndSetData();
  }, []);

  return (
    <Card>
    <CardHeader>
      <CardTitle>Flujos más visitados</CardTitle>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{
            right: 16,
          }}
        >
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
            hide
          />
          <XAxis dataKey="total" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar
            dataKey="total"
            layout="vertical"
            fill="#009C69"
            radius={4}
          >
            <LabelList
              dataKey="name"
              position="insideLeft"
              offset={8}
              className="fill-[--color-label]"
              fontSize={12}
            />
            <LabelList
              dataKey="total"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </CardContent>
   
  </Card>
  );
}

