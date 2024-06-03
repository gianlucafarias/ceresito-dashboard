"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

async function fetchVisitasFlujo() {
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/visitas-flujo");
    const data = await response.json();
    return data.visitasFlujo.sort((a, b) => a.nombre_flujo.localeCompare(b.nombre_flujo));
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export function Overview() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchAndSetData() {
      const visitasFlujo = await fetchVisitasFlujo();
      setData(
        visitasFlujo.map((item) => ({
          name: item.nombre_flujo,
          total: item.contador,
        }))
      );
    }
    fetchAndSetData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={360} className="padding-bottom: 50">
      <BarChart data={data} >
      <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
        />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} className="padding-bottom: 50"/>
        <Bar dataKey="total" fill="#adfa1d" radius={[1, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
