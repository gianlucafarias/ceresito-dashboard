import { useEffect, useState } from "react";
import { Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function CardsStats() {
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReclamosData() {
      try {
        const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos');
        const data = await response.json();

        // Transformar datos para el gráfico de pastel
        const tipos = ['Animales', 'Arreglos', 'Arboles', 'Luminarias', 'Higiene Urbana'];
        const transformedPieData = tipos.map((tipo) => ({
          name: tipo,
          value: data.filter((reclamo) => reclamo.reclamo === tipo).length,
        }));
        setPieData(transformedPieData);

        // Obtener datos de los últimos 14 días
        const today = new Date();
        const last14Days = Array.from({ length: 14 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          return date;
        }).reverse(); // Asegurarnos de que las fechas estén en orden ascendente

        const reclamosLast14Days = last14Days.map(date => ({
          date,
          count: data.filter(reclamo => reclamo.fecha.split('T')[0] === date.toISOString().split('T')[0]).length
        }));

        const transformedLineData = last14Days.slice(0, 7).map((day, index) => {
          const previousWeekIndex = index + 7;
          return {
            date: dayNames[day.getDay()], // Mostrar el nombre del día
            thisWeek: reclamosLast14Days[index]?.count || 0,
            lastWeek: reclamosLast14Days[previousWeekIndex]?.count || 0,
          };
        });

        setLineData(transformedLineData);
      } catch (error) {
        console.error('Error fetching reclamos data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReclamosData();
  }, []);

  useEffect(() => {
    async function fetchHistoryData() {
      try {
        const response = await fetch('/api/registro-reclamo');
        const data = await response.json();

        // Ordenar los datos por fecha
        const sortedData = data.sort((a, b) => new Date(b.fechaSolucion || b.fechaAsignacion || b.fechaRegistro) - new Date(a.fechaSolucion || a.fechaAsignacion || a.fechaRegistro));
        setHistoryData(sortedData); // No limitar aquí, ya que limitaremos en la renderización

      } catch (error) {
        console.error('Error fetching history data:', error);
      }
    }

    fetchHistoryData();
  }, []);

  const loadMoreHistory = () => {
    setVisibleHistoryCount((prevCount) => prevCount + 5);
  };

  const COLORS = ['#adfa1d'];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Reclamos esta semana</CardTitle>
          <CardDescription>
            Comparación de reclamos recibidos esta semana con la semana anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[200px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="date" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="text-center font-bold">{label}</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Semana Anterior
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0]?.value}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Esta Semana
                                </span>
                                <span className="font-bold">
                                  {payload[1]?.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lastWeek"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    stroke="#888888"
                    opacity={0.7}
                  />
                  <Line
                    type="monotone"
                    dataKey="thisWeek"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    stroke="#adfa1d"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reclamos por categoría</CardTitle>
          <CardDescription>
            Distribución de los tipos de reclamos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#000000"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Actividad de Reclamos</CardTitle>
          <CardDescription>
            Registro de las últimas actividades de reclamos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              historyData.length === 0 ? (
                <p className="text-center text-gray-500">No hay reclamos registrados.</p>
              ) : (
                <div className="space-y-4">
                  {historyData.slice(0, visibleHistoryCount).map((reclamo) => (
                    <div key={reclamo.id} className="flex justify-between items-center p-4">
                      <div>
                        <p className="font-bold">{reclamo.reclamo}</p>
                        <p>{reclamo.direccion}</p>
                      </div>
                      <div>
                        <p className={`font-bold ${reclamo.estado === "COMPLETADO" ? "text-green-500" : "text-yellow-500"}`}>{reclamo.estado}</p>
                        <p className="text-gray-500">{new Date(reclamo.fechaSolucion || reclamo.fechaAsignacion || reclamo.fechaRegistro).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {visibleHistoryCount < historyData.length && (
                    <div className="text-center mt-4">
                      <Button onClick={loadMoreHistory}>Cargar más</Button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
