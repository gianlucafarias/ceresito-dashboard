"use client"
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import Card, { CardContent } from "@/components/Card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UserCheck, FileText, CheckCircle2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"
import { MessagesPerDayChart } from "@/components/messages-per-day-chart";
import { Badge } from "@/components/ui/badge";
import { FeedbackChart } from "@/components/feedback-chart";
import { FeedbackComments } from "@/components/feedback-comments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths, subYears, startOfDay } from "date-fns";

type TimeFilter = "today" | "3months" | "6months" | "1year" | "all";

export default function CeresitoPage() {
  const [uniqueUsers, setUniqueUsers] = useState<number | null>(null);
  const [totalConversaciones, setTotalConversaciones] = useState<number | null>(null);
  const [mensajesEnviados, setMensajesEnviados] = useState<number | null>(null);
  const [reclamosRecibidos, setReclamosRecibidos] = useState<number | null>(null);
  const [reclamosResueltos, setReclamosResueltos] = useState<number | null>(null);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Función helper para calcular fechas según el filtro
  const getDateRange = (filter: TimeFilter): { startDate: Date | null; endDate: Date } => {
    const endDate = new Date();
    
    switch (filter) {
      case "today":
        return {
          startDate: startOfDay(endDate),
          endDate: endDate
        };
      case "3months":
        return {
          startDate: subMonths(endDate, 3),
          endDate: endDate
        };
      case "6months":
        return {
          startDate: subMonths(endDate, 6),
          endDate: endDate
        };
      case "1year":
        return {
          startDate: subYears(endDate, 1),
          endDate: endDate
        };
      case "all":
      default:
        return {
          startDate: null,
          endDate: endDate
        };
    }
  };

  // Función para construir parámetros de query string para reclamos
  const buildReclamosQueryParams = (filter: TimeFilter, estado?: string): string => {
    const params = new URLSearchParams();
    
    // Parámetros de paginación (necesarios para obtener el total)
    params.append("page", "1");
    params.append("per_page", "1"); // Solo necesitamos el total, no los datos
    
    // Filtro de estado si se especifica
    if (estado) {
      params.append("estado", estado);
    }
    
    // Filtros de fecha
    if (filter !== "all") {
      const { startDate, endDate } = getDateRange(filter);
      if (startDate) {
        // Convertir a ISO string como espera el backend
        params.append("from", startDate.toISOString());
      }
      if (endDate) {
        params.append("to", endDate.toISOString());
      }
    }
    
    return `?${params.toString()}`;
  };

  // Efecto para el estado del bot (solo se ejecuta una vez)
  useEffect(() => {
    async function fetchBotStatus() {
      setIsStatusLoading(true);
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
      } finally {
        setIsStatusLoading(false);
      }
    }

    fetchBotStatus();
  }, []);

  // Efecto para los datos del dashboard (se ejecuta cuando cambia el filtro)
  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true);
      
      // Construir parámetros de query para las APIs que usan formato ISO (como el backend espera)
      const buildSimpleQueryParams = (filter: TimeFilter): string => {
        if (filter === "all") {
          return "";
        }
        const { startDate, endDate } = getDateRange(filter);
        const params = new URLSearchParams();
        if (startDate) {
          params.append("from", startDate.toISOString());
        }
        if (endDate) {
          params.append("to", endDate.toISOString());
        }
        return `?${params.toString()}`;
      };

      // Función para construir URL de mensajes/interacciones
      const buildMensajesUrl = (filter: TimeFilter): string => {
        if (filter === "all") {
          return 'https://api.ceres.gob.ar/api/api/interactions/count';
        }
        const { startDate, endDate } = getDateRange(filter);
        if (startDate) {
          const startDateString = format(startDate, "yyyy-MM-dd");
          const endDateString = format(endDate, "yyyy-MM-dd");
          return `https://api.ceres.gob.ar/api/api/interactions/count/${startDateString}/${endDateString}`;
        }
        return 'https://api.ceres.gob.ar/api/api/interactions/count';
      };
      
      const simpleQueryParams = buildSimpleQueryParams(timeFilter);
      const reclamosRecibidosParams = buildReclamosQueryParams(timeFilter);
      const reclamosResueltosParams = buildReclamosQueryParams(timeFilter, "COMPLETADO");
      const mensajesUrl = buildMensajesUrl(timeFilter);

      // URLs para debug
      const reclamosResueltosUrl = `https://api.ceres.gob.ar/api/api/reclamos${reclamosResueltosParams}`;
      console.log('🔍 Filtro seleccionado:', timeFilter);
      console.log('🔍 Parámetros simples:', simpleQueryParams);
      console.log('🔍 Parámetros reclamos resueltos:', reclamosResueltosParams);
      console.log('URL mensajes:', mensajesUrl);
      console.log('URL reclamos resueltos:', reclamosResueltosUrl);

      // Ejecutar todas las llamadas en paralelo para que no se bloqueen entre sí
      const [usersResult, conversacionesResult, mensajesResult, reclamosRecibidosResult, reclamosResueltosResult] = await Promise.allSettled([
        fetch(`https://api.ceres.gob.ar/api/api/users/count${simpleQueryParams}`),
        fetch(`https://api.ceres.gob.ar/api/api/conversaciones${simpleQueryParams}`),
        fetch(mensajesUrl),
        fetch(`https://api.ceres.gob.ar/api/api/reclamos${reclamosRecibidosParams}`),
        fetch(reclamosResueltosUrl)
      ]);

      // Procesar resultado de usuarios únicos
      if (usersResult.status === 'fulfilled' && usersResult.value.ok) {
        try {
          const data = await usersResult.value.json();
          setUniqueUsers(data.count);
        } catch (error) {
          console.error('Error al parsear respuesta de usuarios:', error);
          setUniqueUsers(0);
        }
      } else {
        console.error('Error al obtener el conteo de usuarios:', usersResult.status === 'rejected' ? usersResult.reason : usersResult.value.status);
        setUniqueUsers(0);
      }

      // Procesar resultado de conversaciones
      if (conversacionesResult.status === 'fulfilled' && conversacionesResult.value.ok) {
        try {
          const data = await conversacionesResult.value.json();
          setTotalConversaciones(Array.isArray(data) ? data.length : (data.count || data.length || 0));
        } catch (error) {
          console.error('Error al parsear respuesta de conversaciones:', error);
          setTotalConversaciones(0);
        }
      } else {
        console.error('Error al obtener el total de conversaciones:', conversacionesResult.status === 'rejected' ? conversacionesResult.reason : conversacionesResult.value.status);
        setTotalConversaciones(0);
      }

      // Procesar resultado de mensajes enviados
      if (mensajesResult.status === 'fulfilled' && mensajesResult.value.ok) {
        try {
          const data = await mensajesResult.value.json();
          console.log('✅ Respuesta de mensajes:', data); // Debug
          // El endpoint puede devolver count directamente o un array que hay que sumar
          let count = 0;
          if (typeof data === 'number') {
            count = data;
          } else if (data.count !== undefined) {
            count = data.count;
          } else if (Array.isArray(data)) {
            // Si es un array, sumar todos los counts
            count = data.reduce((sum: number, item: any) => {
              const itemCount = typeof item === 'number' ? item : (item.count ? parseInt(item.count, 10) : 0);
              return sum + itemCount;
            }, 0);
          } else if (data.total !== undefined) {
            count = data.total;
          }
          console.log('✅ Total mensajes extraído:', count);
          setMensajesEnviados(count);
        } catch (error) {
          console.error('❌ Error al parsear respuesta de mensajes:', error);
          setMensajesEnviados(0);
        }
      } else {
        const errorMsg = mensajesResult.status === 'rejected' 
          ? mensajesResult.reason 
          : `Status ${mensajesResult.value.status}: ${mensajesResult.value.statusText}`;
        console.error('❌ Error al obtener el total de mensajes enviados:', errorMsg);
        if (mensajesResult.status === 'fulfilled') {
          try {
            const errorData = await mensajesResult.value.text();
            console.error('❌ Respuesta de error de mensajes:', errorData);
          } catch (e) {
            // Ignorar si no se puede leer el error
          }
        }
        setMensajesEnviados(0);
      }

      // Procesar resultado de reclamos recibidos
      if (reclamosRecibidosResult.status === 'fulfilled' && reclamosRecibidosResult.value.ok) {
        try {
          const data = await reclamosRecibidosResult.value.json();
          // El endpoint devuelve { data: [], total: number }
          setReclamosRecibidos(data.total || 0);
        } catch (error) {
          console.error('Error al parsear respuesta de reclamos recibidos:', error);
          setReclamosRecibidos(0);
        }
      } else {
        console.error('Error al obtener el conteo de reclamos recibidos:', reclamosRecibidosResult.status === 'rejected' ? reclamosRecibidosResult.reason : reclamosRecibidosResult.value.status);
        setReclamosRecibidos(0);
      }

      // Procesar resultado de reclamos resueltos
      if (reclamosResueltosResult.status === 'fulfilled' && reclamosResueltosResult.value.ok) {
        try {
          const data = await reclamosResueltosResult.value.json();
          console.log('✅ Respuesta de reclamos resueltos:', data); // Debug
          // El endpoint devuelve { data: [], total: number }
          const count = data.total ?? data.count ?? (Array.isArray(data) ? data.length : 0);
          console.log('✅ Total reclamos resueltos extraído:', count);
          setReclamosResueltos(count);
        } catch (error) {
          console.error('❌ Error al parsear respuesta de reclamos resueltos:', error);
          setReclamosResueltos(0);
        }
      } else {
        const errorMsg = reclamosResueltosResult.status === 'rejected' 
          ? reclamosResueltosResult.reason 
          : `Status ${reclamosResueltosResult.value.status}: ${reclamosResueltosResult.value.statusText}`;
        console.error('❌ Error al obtener el conteo de reclamos resueltos:', errorMsg);
        if (reclamosResueltosResult.status === 'fulfilled') {
          try {
            const errorData = await reclamosResueltosResult.value.text();
            console.error('❌ Respuesta de error de reclamos resueltos:', errorData);
          } catch (e) {
            // Ignorar si no se puede leer el error
          }
        }
        setReclamosResueltos(0);
      }

      setIsDataLoading(false);
    }

    fetchData();
  }, [timeFilter]);

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

  const getFilterLabel = (filter: TimeFilter): string => {
    switch (filter) {
      case "today":
        return "Hoy";
      case "3months":
        return "Últimos 3 meses";
      case "6months":
        return "Últimos 6 meses";
      case "1year":
        return "Último año";
      case "all":
      default:
        return "Total";
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
            <div className="flex items-center gap-4">
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                <SelectTrigger className="w-[180px]" aria-label="Seleccionar período de tiempo">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="1year">Último año</SelectItem>
                  <SelectItem value="all">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
       
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsContent value="overview" className="space-y-4">
            <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {isDataLoading && uniqueUsers === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Usuarios únicos"
                  amount={uniqueUsers?.toString() || "0"}
                  description={getFilterLabel(timeFilter)}
                  icon={UserCheck}
                />
              )}
              {isDataLoading && totalConversaciones === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Conversaciones"
                  amount={totalConversaciones?.toString() || "0"}
                  description={getFilterLabel(timeFilter)}
                  icon={UserCheck}
                />
              )}
              {isDataLoading && mensajesEnviados === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Mensajes enviados"
                  amount={mensajesEnviados?.toString() || "0"}
                  description={getFilterLabel(timeFilter)}
                  icon={MessageSquare}
                />
              )}
              {isDataLoading && reclamosRecibidos === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Reclamos recibidos"
                  amount={reclamosRecibidos?.toString() || "0"}
                  description={getFilterLabel(timeFilter)}
                  icon={FileText}
                />
              )}
              {isDataLoading && reclamosResueltos === null ? (
                <Skeleton className="h-[120px]" />
              ) : (
                <Card
                  label="Reclamos resueltos"
                  amount={reclamosResueltos?.toString() || "0"}
                  description={getFilterLabel(timeFilter)}
                  icon={CheckCircle2}
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