"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Clock, 
  MessageSquare,
  MapPin,
  Briefcase,
  Loader2,
  AlertCircle,
  Users,
  Bug,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { apiClient } from "./_lib/api-client";
import { adaptDashboardStats } from "./_lib/api-adapters";

const growthChartConfig = {
  count: {
    label: "Altas",
    color: "#009C69",
  },
} satisfies ChartConfig;

export default function ServiciosDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);
        const statsResponse = await apiClient.getStats();

        if (statsResponse.success) {
          const adaptedStats = adaptDashboardStats(statsResponse.data);
          setStats(adaptedStats);
        } else {
          setError(statsResponse.message || "Error al cargar las estadísticas");
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
              Usuarios Registrados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Comunidad total de la plataforma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de uso general */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactos generados</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContactRequests}</div>
            <p className="text-xs text-muted-foreground">Solicitudes entre vecinos y profesionales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reseñas publicadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Interacción y confianza de usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias abiertas</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openBugReports}</div>
            <p className="text-xs text-muted-foreground">Feedback pendiente de resolución</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ubicaciones activas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLocations}</div>
            <p className="text-xs text-muted-foreground">Ciudades con oferta publicada</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de negocio */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Crecimiento reciente</CardTitle>
            <CardDescription>
              Nuevas altas en semana y mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={growthChartConfig} className="h-[260px] w-full">
              <BarChart
                data={[
                  { metric: "Profesionales (semana)", count: stats.growth.newProfessionalsThisWeek },
                  { metric: "Profesionales (mes)", count: stats.growth.newProfessionalsThisMonth },
                  { metric: "Usuarios (semana)", count: stats.growth.newUsersThisWeek },
                  { metric: "Usuarios (mes)", count: stats.growth.newUsersThisMonth },
                  { metric: "Servicios (mes)", count: stats.growth.newServicesThisMonth },
                ]}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top categorías</CardTitle>
            <CardDescription>
              Categorías con mayor volumen de servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {(stats.topCategories || []).slice(0, 8).map((item: { category: string; count: number }, index: number) => (
                <div key={`${item.category}-${index}`} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.category}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de solicitudes de contacto</CardTitle>
          <CardDescription>
            Muestra cómo avanza la gestión de contactos entre vecinos y profesionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.contactRequestsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            stats.contactRequestsByStatus.map((item: { status: string; count: number }) => (
              <div key={item.status} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium capitalize">{item.status}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
