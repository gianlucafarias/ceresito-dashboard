import { cache } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Bot,
  Briefcase,
  Building,
  ClipboardList,
  Clock3,
  FileWarning,
  Hammer,
  LayoutDashboard,
} from "lucide-react";

interface ActivityRecord {
  id: number;
  type: string;
  action: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  timeAgo?: string;
}

interface CeresitoSummary {
  uniqueUsers: number;
  conversations: number;
  sentMessages: number;
  claimsReceived: number;
  claimsHandled: number;
  generatedAt: string;
}

interface ServicesStatsResponse {
  success: boolean;
  data?: {
    overview?: {
      totalProfessionals?: number;
      activeProfessionals?: number;
    };
  };
}

type StatusCountRow = {
  estado?: string;
  status?: string;
  count?: number | string;
  total?: number | string;
  value?: number | string;
};

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfToday(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStatusRows(payload: unknown): StatusCountRow[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is StatusCountRow => item !== null && typeof item === "object");
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    const data = objectPayload.data;
    if (Array.isArray(data)) {
      return data.filter((item): item is StatusCountRow => item !== null && typeof item === "object");
    }
  }

  return [];
}

function extractStatusCounters(payload: unknown): {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
} {
  const rows = getStatusRows(payload);
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let total = 0;

  if (rows.length > 0) {
    rows.forEach((row) => {
      const status = String(row.estado ?? row.status ?? "").trim().toUpperCase();
      const count = asNumber(row.count ?? row.total ?? row.value);

      total += count;

      if (status === "PENDIENTE") pending += count;
      if (status === "ASIGNADO" || status === "EN_PROCESO") inProgress += count;
      if (status === "COMPLETADO") completed += count;
    });
    return { pending, inProgress, completed, total };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    const pendingCount = asNumber(objectPayload.PENDIENTE ?? objectPayload.pending);
    const assignedCount = asNumber(objectPayload.ASIGNADO ?? objectPayload.assigned);
    const inProcessCount = asNumber(objectPayload.EN_PROCESO ?? objectPayload.inProgress);
    const completedCount = asNumber(objectPayload.COMPLETADO ?? objectPayload.completed);

    pending = pendingCount;
    inProgress = assignedCount + inProcessCount;
    completed = completedCount;
    total = pending + inProgress + completed;
  }

  return { pending, inProgress, completed, total };
}

function countActivitiesToday(activities: ActivityRecord[]): number {
  const todayStart = startOfToday();
  return activities.filter((item) => {
    const date = new Date(item.createdAt);
    return Number.isFinite(date.getTime()) && date >= todayStart;
  }).length;
}

function resolveActivityTone(activity: ActivityRecord): "default" | "secondary" | "outline" {
  if (activity.type === "RECLAMO" && activity.action === "ESTADO_CAMBIADO") return "default";
  if (activity.type === "NOTIFICACION") return "secondary";
  return "outline";
}

const fetchActivityRecent = cache(async (): Promise<ActivityRecord[]> => {
  const res = await fetch("/api/core/activity/recent?limit=15", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar actividad reciente");
  return res.json();
});

const fetchReclamosByStatus = cache(async (): Promise<unknown> => {
  const res = await fetch("/api/core/reclamos/count-by-status", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar reclamos por estado");
  return res.json();
});

const fetchCeresitoSummary = cache(async (): Promise<CeresitoSummary> => {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 3);
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`/api/core/dashboard/ceresito/summary?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar resumen de Ceresito");
  return res.json();
});

const fetchServicesStats = cache(async (): Promise<ServicesStatsResponse> => {
  const res = await fetch("/api/servicios-externos/api/admin/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar resumen de servicios");
  return res.json();
});

export default async function GeneralDashboard() {
  const [activityResult, reclamosResult, ceresitoResult, servicesResult] = await Promise.allSettled([
    fetchActivityRecent(),
    fetchReclamosByStatus(),
    fetchCeresitoSummary(),
    fetchServicesStats(),
  ]);

  const activity = activityResult.status === "fulfilled" ? activityResult.value : [];
  const reclamosByStatus = reclamosResult.status === "fulfilled" ? reclamosResult.value : [];
  const ceresitoSummary =
    ceresitoResult.status === "fulfilled"
      ? ceresitoResult.value
      : {
          uniqueUsers: 0,
          conversations: 0,
          sentMessages: 0,
          claimsReceived: 0,
          claimsHandled: 0,
          generatedAt: new Date().toISOString(),
        };
  const servicesStats = servicesResult.status === "fulfilled" ? servicesResult.value : undefined;

  const reclamos = extractStatusCounters(reclamosByStatus);
  const actividadesHoy = countActivitiesToday(activity);
  const profesionalesActivos = asNumber(servicesStats?.data?.overview?.activeProfessionals);
  const profesionalesTotales = asNumber(servicesStats?.data?.overview?.totalProfessionals);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Panel general</h2>
            <p className="text-sm text-muted-foreground">
              Vista unificada de operaciones y actividad del ecosistema municipal.
            </p>
          </div>
          <Badge variant="outline">
            <Clock3 className="mr-2 h-3.5 w-3.5" />
            Actualizado en tiempo real
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Vista general
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividad reciente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-l-4 border-l-slate-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Actividad de hoy</CardTitle>
                  <Activity className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{actividadesHoy}</div>
                  <p className="text-xs text-muted-foreground">Eventos registrados en el dia</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Reclamos pendientes</CardTitle>
                  <FileWarning className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reclamos.pending}</div>
                  <p className="text-xs text-muted-foreground">Requieren atencion inicial</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-600">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Ceresito (90d)</CardTitle>
                  <Bot className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ceresitoSummary.uniqueUsers}</div>
                  <p className="text-xs text-muted-foreground">Vecinos unicos que interactuaron</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-600">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Profesionales activos</CardTitle>
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profesionalesActivos}</div>
                  <p className="text-xs text-muted-foreground">
                    {profesionalesTotales > 0
                      ? `${profesionalesTotales} registrados en total`
                      : "Plataforma de servicios"}
                  </p>
                </CardContent>
              </Card>
            </section>

            

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Actividad reciente</CardTitle>
                  <CardDescription>Ultimos eventos funcionales del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay eventos recientes para mostrar.
                    </p>
                  ) : (
                    activity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type} / {item.action}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={resolveActivityTone(item)}>{item.timeAgo || "Reciente"}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>Entradas directas a areas clave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href="/dashboard/obras"
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Hammer className="h-4 w-4" />
                      Obras
                    </span>
                    <span className="text-muted-foreground">Abrir</span>
                  </Link>
                  <Link
                    href="/dashboard/ceresito"
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Ceresito
                    </span>
                    <span className="text-muted-foreground">Abrir</span>
                  </Link>
                  <Link
                    href="/dashboard/servicios"
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Servicios
                    </span>
                    <span className="text-muted-foreground">Abrir</span>
                  </Link>
                  <Link
                    href="/dashboard/encuestas"
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Encuestas
                    </span>
                    <span className="text-muted-foreground">Abrir</span>
                  </Link>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>Ultimos eventos funcionales del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay eventos recientes para mostrar.
                  </p>
                ) : (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type} / {item.action}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={resolveActivityTone(item)}>{item.timeAgo || "Reciente"}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
