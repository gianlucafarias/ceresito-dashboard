"use client"
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { Button } from "@/components/ui/button";
import Card, { CardContent, CardProps } from "@/components/Card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"


export default function page() {
  const [uniqueUsers, setUniqueUsers] = useState(null);
  const [totalConversaciones, setTotalConversaciones] = useState(null);
  const [totalFlujos, setTotalFlujos] = useState(null);
  const [interaccionesLastWeek, setinteraccionesLastWeek] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch para obtener el total de usuarios únicos
        const responseUniqueUsers = await fetch('https://api.ceres.gob.ar/api/api/users/count');
        if (responseUniqueUsers.ok) {
          const data = await responseUniqueUsers.json();
          setUniqueUsers(data.count);
        } else {
          console.error('Error al obtener el conteo de usuarios:', responseUniqueUsers.status);
        }

        // Fetch para obtener el total de conversaciones
        const responseTotalConversaciones = await fetch('https://api.ceres.gob.ar/api/api/conversaciones');
        if (responseTotalConversaciones.ok) {
          const data = await responseTotalConversaciones.json();
          setTotalConversaciones(data.length);
        } else {
          console.error('Error al obtener el total de conversaciones:', responseTotalConversaciones.status);
        }

        // Fetch para obtener el total de flujos recorridos
        const responseTotalFlujos = await fetch('https://api.ceres.gob.ar/api/api/visitas-flujo');
        if (responseTotalFlujos.ok) {
          const data = await responseTotalFlujos.json();
          setTotalFlujos(data.totalVisitas);
        } else {
          console.error('Error al obtener el total de flujos recorridos:', responseTotalFlujos.status);
        }

        // Fetch para obtener el total de usuarios únicos
        const responseInteractionsLastWeek = await fetch('https://api.ceres.gob.ar/api/api/interactions/last-week/count');
        if (responseInteractionsLastWeek.ok) {
          const data = await responseInteractionsLastWeek.json();
          setinteraccionesLastWeek(data.count);
        } else {
          console.error('Error al obtener el conteo de interacciones:', responseInteractionsLastWeek.status);
        }
      } catch (error) {
        console.error('Error al realizar la solicitud:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hola, bienvenido 👋
          </h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsContent value="overview" className="space-y-4">
            <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
              {uniqueUsers === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Usuarios únicos totales"
                  amount={uniqueUsers}
                  description=""
                  icon={UserCheck}
                />
              )}
              {totalConversaciones === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Conversaciones totales"
                  amount={totalConversaciones}
                  description=""
                  icon={UserCheck}
                />
              )}
              {totalFlujos === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Flujos recorridos"
                  amount={totalFlujos}
                  description=""
                  icon={UserCheck}
                />
              )}
              {interaccionesLastWeek === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Interacciones esta semana"
                  amount={interaccionesLastWeek}
                  description=""
                  icon={UserCheck}
                />
              )}
            </section>
            <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
              <CardContent className="flex justify-between gap-4">
                <section>
                  <p>Flujos más visitados</p>
                </section>
                <Overview />
              </CardContent>
              <CardContent className="flex justify-between gap-4">
                <section>
                  <p>Ultimas Conversaciones</p>
                </section>
                <RecentSales />
              </CardContent>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}