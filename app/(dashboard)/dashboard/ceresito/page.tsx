"use client"
import dynamic from "next/dynamic";
import Card, { CardContent } from "@/components/Card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UserCheck, FileText, CheckCircle2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subMonths, subYears, startOfDay } from "date-fns";
import Link from "next/link";

const MessagesPerDayChart = dynamic(
  () => import("@/components/messages-per-day-chart").then((mod) => mod.MessagesPerDayChart),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> }
);

const FeedbackChart = dynamic(
  () => import("@/components/feedback-chart").then((mod) => mod.FeedbackChart),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> }
);

const FeedbackComments = dynamic(
  () => import("@/components/feedback-comments").then((mod) => mod.FeedbackComments),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> }
);

const Overview = dynamic(
  () => import("@/components/overview").then((mod) => mod.Overview),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

const RecentSales = dynamic(
  () => import("@/components/recent-sales").then((mod) => mod.RecentSales),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

type TimeFilter = "today" | "3months" | "6months" | "1year" | "all";
const ALL_TIME_FROM = new Date("2000-01-01T00:00:00.000Z");

interface CeresitoSummaryResponse {
  uniqueUsers: number;
  conversations: number;
  sentMessages: number;
  claimsReceived: number;
  claimsHandled: number;
  generatedAt: string;
}

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
  const getDateRange = (filter: TimeFilter): { startDate: Date; endDate: Date } => {
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
          startDate: ALL_TIME_FROM,
          endDate: endDate
        };
    }
  };

  // Efecto para el estado del bot (solo se ejecuta una vez)
  useEffect(() => {
    async function fetchBotStatus() {
      setIsStatusLoading(true);
      try {
        const responseBotStatus = await fetch('https://api.ceres.gob.ar/v1/health', {
          cache: 'no-store',
        });
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

      const buildSimpleQueryParams = (filter: TimeFilter): string => {
        const { startDate, endDate } = getDateRange(filter);
        const params = new URLSearchParams();
        params.append("from", startDate.toISOString());
        params.append("to", endDate.toISOString());
        return `?${params.toString()}`;
      };

      try {
        const simpleQueryParams = buildSimpleQueryParams(timeFilter);
        const response = await fetch(
          `/api/core/dashboard/ceresito/summary${simpleQueryParams}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error(`Status ${response.status}: ${response.statusText}`);
        }

        const data: Partial<CeresitoSummaryResponse> = await response.json();

        setUniqueUsers(Number.isFinite(Number(data.uniqueUsers)) ? Number(data.uniqueUsers) : 0);
        setTotalConversaciones(
          Number.isFinite(Number(data.conversations)) ? Number(data.conversations) : 0
        );
        setMensajesEnviados(
          Number.isFinite(Number(data.sentMessages)) ? Number(data.sentMessages) : 0
        );
        setReclamosRecibidos(
          Number.isFinite(Number(data.claimsReceived)) ? Number(data.claimsReceived) : 0
        );
        setReclamosResueltos(
          Number.isFinite(Number(data.claimsHandled)) ? Number(data.claimsHandled) : 0
        );
      } catch (error) {
        console.error('Error al obtener el resumen de Ceresito:', error);
        setUniqueUsers(0);
        setTotalConversaciones(0);
        setMensajesEnviados(0);
        setReclamosRecibidos(0);
        setReclamosResueltos(0);
      } finally {
        setIsDataLoading(false);
      }
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
              <Link
                href="/dashboard/ceresito/flows"
                className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
              >
                Flujos No-Code
              </Link>
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
                  label="Reclamos tratados"
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

