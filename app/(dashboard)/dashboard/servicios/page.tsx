"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Star, 
  MessageSquare, 
  TrendingUp,
  MapPin,
  Briefcase,
  Loader2,
  AlertCircle,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { apiClient, type APIPlatformObservabilitySummaryResponse } from "./_lib/api-client";
import { adaptDashboardStats } from "./_lib/api-adapters";

const observabilityChartConfig = {
  count: {
    label: "Eventos",
    color: "#009C69",
  },
} satisfies ChartConfig;

export default function ServiciosDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [observability, setObservability] = useState<APIPlatformObservabilitySummaryResponse | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<
    Array<{
      id: string;
      eventName: string;
      summary: string;
      status: "success" | "failure" | "warning" | "skipped";
      createdAt: string;
      domain: string;
    }>
  >([]);
  const [observabilityError, setObservabilityError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);
        setObservabilityError(null);

        const [statsResponse, obsSummaryResponse, obsEventsResponse] =
          await Promise.all([
            apiClient.getStats(),
            apiClient.getPlatformObservabilitySummary(),
            apiClient.listPlatformObservabilityEvents({
              status: "failure",
              page: 1,
              limit: 8,
            }),
          ]);

        if (statsResponse.success) {
          const adaptedStats = adaptDashboardStats(statsResponse.data);
          setStats(adaptedStats);
        } else {
          setError(statsResponse.message || "Error al cargar las estadísticas");
        }

        if (obsSummaryResponse.success) {
          setObservability(obsSummaryResponse.data);
        } else {
          setObservabilityError(
            obsSummaryResponse.message || "No se pudo cargar observabilidad",
          );
        }

        if (obsEventsResponse.success) {
          setRecentIncidents(
            obsEventsResponse.data.map((event) => ({
              id: event.id,
              eventName: event.eventName,
              summary: event.summary,
              status: event.status,
              createdAt: event.createdAt,
              domain: event.domain,
            })),
          );
        } else {
          setObservabilityError((current) =>
            current ?? (obsEventsResponse.message || "No se pudieron cargar incidentes"),
          );
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Error de conexión al cargar las estadísticas");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Plataforma de Servicios
        </h2>
        
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profesionales Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProfessionals}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeProfessionals / stats.totalProfessionals) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes de Aprobación
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProfessionals}</div>
            <p className="text-xs text-muted-foreground">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servicios Ofrecidos
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Servicios registrados
            </p>
          </CardContent>
        </Card>

        
       

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ubicaciones Activas
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professionalsByLocation.length}</div>
            <p className="text-xs text-muted-foreground">
              Ciudades con profesionales
            </p>
          </CardContent>
        </Card>
      </div>

     
      {/* Gráficos y distribuciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Distribución por Categorías</CardTitle>
            <CardDescription>
              Profesionales registrados por tipo de servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.professionalsByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{item.count} profesionales</span>
                    <Badge variant="secondary">
                      {((item.count / stats.totalProfessionals) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribución Geográfica</CardTitle>
            <CardDescription>
              Profesionales por ubicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.professionalsByLocation.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.location}</span>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registros mensuales - Pendiente de implementación en API */}
      {stats.monthlyRegistrations && stats.monthlyRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registros Mensuales</CardTitle>
            <CardDescription>
              Evolución de nuevos profesionales registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyRegistrations.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...stats.monthlyRegistrations.map((m: any) => m.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observabilidad Plataforma de Servicios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observability?.totals.events24h ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total acumulado: {observability?.totals.totalEvents ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores 24h</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observability?.totals.errorEvents24h ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Requests fallidos: {observability?.totals.requestFailures24h ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests lentos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observability?.totals.slowRequests24h ?? 0}</div>
            <p className="text-xs text-muted-foreground">Detectados en las últimas 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de email 24h</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observability?.totals.emailEvents24h ?? 0}</div>
            <p className="text-xs text-muted-foreground">Dominio email en auditoría</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Estado de eventos (24h)</CardTitle>
            <CardDescription>Distribución por status en observabilidad.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={observabilityChartConfig} className="h-[260px] w-full">
              <BarChart data={observability?.statusBreakdown ?? []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Dominios con más actividad</CardTitle>
            <CardDescription>Top dominios por volumen de eventos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(observability?.domainBreakdown ?? []).slice(0, 8).map((item) => (
              <div key={item.domain} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">{item.domain}</span>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
            {(!observability || observability.domainBreakdown.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin datos de dominio.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incidentes recientes</CardTitle>
          <CardDescription>
            Últimos eventos con status failure (origen: Plataforma de Servicios).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {observabilityError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {observabilityError}
            </div>
          )}
          {recentIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay incidentes recientes.</p>
          ) : (
            recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start justify-between gap-4 rounded-md border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{incident.eventName}</div>
                  <p className="text-sm text-muted-foreground">{incident.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {incident.domain} · {new Date(incident.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <Badge variant={incident.status === "failure" ? "destructive" : "secondary"}>
                  {incident.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
