"use client"
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import Card, { CardContent } from "@/components/Card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UserCheck, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"
import { MessagesPerDayChart } from "@/components/messages-per-day-chart";
import { Badge } from "@/components/ui/badge";
import { FeedbackChart } from "@/components/feedback-chart";
import { FeedbackComments } from "@/components/feedback-comments";

export default function CeresitoPage() {
  const [uniqueUsers, setUniqueUsers] = useState(null);
  const [totalConversaciones, setTotalConversaciones] = useState(null);
  const [totalFlujos, setTotalFlujos] = useState(null);
  const [interaccionesLastWeek, setinteraccionesLastWeek] = useState(null);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsStatusLoading(true);
      try {
        try {
          const responseBotStatus = await fetch('https://api.ceres.gob.ar/v1/health');
          if (responseBotStatus.ok) {
            const data = await responseBotStatus.json();
            setBotStatus(data.status);
          } else {
            console.error('Error al obtener el estado del bot:', responseBotStatus.status);
            setBotStatus('error');
          }
        } catch (statusError) {
           console.error('Error de red al obtener el estado del bot:', statusError);
           setBotStatus('error');
        }
        finally {
            setIsStatusLoading(false);
        }
        
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

        // Fetch para obtener el total de interacciones de la última semana
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

  const getStatusIndicator = () => {
    if (isStatusLoading) {
        return <Skeleton className="h-6 w-20 ml-3" />;
    }
    if (botStatus === 'ok') {
      return (
        <Badge variant="outline" className="ml-3">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2" /> 
          Activo
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="ml-3">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-2" />
           Offline / Error
        </Badge>
      );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
           <div className="flex items-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Hola, bienvenido al panel de Ceresito 👋
              </h2>
              {getStatusIndicator()}
            </div>
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
             <section>
              <MessagesPerDayChart />
             </section>
            <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
              <div >
                <Overview />
                </div>
                <div>
                <RecentSales />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
              <FeedbackChart />
              <FeedbackComments />
            </section>

          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}