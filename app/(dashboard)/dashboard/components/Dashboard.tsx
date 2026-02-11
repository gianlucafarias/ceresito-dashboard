import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Users as UsersIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

interface Cuadrilla {
  id: string;
  nombre: string;
  disponible: boolean;
  [key: string]: any;
}

interface Reclamo {
  id: string;
  estado: string;
  reclamo: string;
  fecha: string;
  [key: string]: any;
}

interface Registro {
  id: string;
  fechaRegistro: string;
  fechaSolucion?: string;
  fechaAsignacion?: string;
  [key: string]: any;
}

interface ReclamosResponse {
  data: Reclamo[];
}

interface ActivityRecord {
  id: number;
  type: string;
  action: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  timeAgo?: string;
}

type ActivityViewItem = {
  id: number;
  tipo: "completado" | "asignado" | "nuevo";
  titulo: string;
  descripcion: string;
  tiempo: string;
};

function resolveInternalOrigin(): string {
  try {
    const requestHeaders = headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");

    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // Fallback for contexts without request headers
  }

  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

// Cargar los graficos de manera diferida para reducir JS inicial
const LazyReclamosPorTipoChart = dynamic(
  () => import("./ReclamosPorTipoChart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

const LazyReclamosPorBarrioChart = dynamic(
  () => import("./ReclamosPorBarrioChart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

async function fetchCuadrillas(origin: string): Promise<Cuadrilla[]> {
  const res = await fetch(`${origin}/api/cuadrillas`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar cuadrillas");
  return res.json();
}

async function fetchReclamos(origin: string): Promise<ReclamosResponse> {
  const res = await fetch(`${origin}/api/core/reclamos`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar reclamos");
  return res.json();
}

async function fetchRegistros(origin: string): Promise<Registro[]> {
  const res = await fetch(`${origin}/api/registro-reclamo`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar registros");
  return res.json();
}

async function fetchActivityRecent(origin: string): Promise<ActivityRecord[]> {
  const res = await fetch(`${origin}/api/core/activity/recent?limit=20`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar actividad reciente");
  return res.json();
}

function resolveActivityType(
  activity: ActivityRecord,
): ActivityViewItem["tipo"] {
  if (activity.type === "RECLAMO" && activity.action === "ESTADO_CAMBIADO") {
    return "completado";
  }

  if (
    activity.type === "FARMACIA_TURNO" &&
    activity.action === "DIA_ACTUALIZADO"
  ) {
    return "asignado";
  }

  return "nuevo";
}

function resolveActivityDescription(activity: ActivityRecord): string {
  if (!activity.metadata || typeof activity.metadata !== "object") {
    return `${activity.type} / ${activity.action}`;
  }

  const metadata = activity.metadata as Record<string, unknown>;
  if (
    typeof metadata.ubicacion === "string" &&
    metadata.ubicacion.trim().length > 0
  ) {
    return metadata.ubicacion;
  }
  if (typeof metadata.date === "string" && metadata.date.trim().length > 0) {
    return `Fecha: ${metadata.date}`;
  }

  return `${activity.type} / ${activity.action}`;
}

export default async function Dashboard() {
  noStore();
  const origin = resolveInternalOrigin();

  const [cuadrillasResult, reclamosResult, registrosResult, activityResult] =
    await Promise.allSettled([
      fetchCuadrillas(origin),
      fetchReclamos(origin),
      fetchRegistros(origin),
      fetchActivityRecent(origin),
    ]);

  const cuadrillas =
    cuadrillasResult.status === "fulfilled" ? cuadrillasResult.value : [];
  const reclamosData =
    reclamosResult.status === "fulfilled" ? reclamosResult.value : undefined;
  const registrosData =
    registrosResult.status === "fulfilled" ? registrosResult.value : undefined;
  const activityData =
    activityResult.status === "fulfilled" ? activityResult.value : [];

  const cuadrillasActivas = cuadrillas.filter(
    (cuadrilla) => cuadrilla.disponible,
  ).length;
  const reclamosPendientes =
    reclamosData?.data?.filter((reclamo) => reclamo.estado === "PENDIENTE")
      .length || 0;
  const reclamosCompletados =
    reclamosData?.data?.filter((reclamo) => reclamo.estado === "COMPLETADO")
      .length || 0;
  const totalReclamos = reclamosData?.data?.length || 0;

  const tiempoPromedio = (() => {
    if (!registrosData) return 0;

    const tiempos = registrosData
      .filter((registro) => registro.fechaRegistro && registro.fechaSolucion)
      .map(
        (registro) =>
          new Date(registro.fechaSolucion as string).getTime() -
          new Date(registro.fechaRegistro).getTime(),
      );

    if (tiempos.length > 0) {
      return (
        tiempos.reduce((a: number, b: number) => a + b, 0) / tiempos.length
      );
    }
    return 0;
  })();

  const convertirTiempoPromedio = (milisegundos: number): string => {
    const horas = Math.floor(milisegundos / (1000 * 60 * 60));
    const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const actividadReciente: ActivityViewItem[] = activityData.map(
    (activity) => ({
      id: activity.id,
      tipo: resolveActivityType(activity),
      titulo: activity.description,
      descripcion: resolveActivityDescription(activity),
      tiempo: activity.timeAgo || "Hace unos segundos",
    }),
  );

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hola, bienvenido al panel de Obras Publicas
          </h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Vista General
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividad Reciente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cuadrillas Activas
                  </CardTitle>
                  <UsersIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cuadrillasActivas}</div>
                  <p className="text-xs text-muted-foreground">
                    {cuadrillasActivas > 0 && cuadrillas.length > 0
                      ? `${Math.round(
                          (cuadrillasActivas / cuadrillas.length) * 100,
                        )}% del total disponible`
                      : "Sin cuadrillas activas"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reclamos Pendientes
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reclamosPendientes}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalReclamos > 0
                      ? `${Math.round(
                          (reclamosPendientes / totalReclamos) * 100,
                        )}% del total`
                      : "Sin reclamos registrados"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reclamos Completados
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reclamosCompletados}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalReclamos > 0
                      ? `${Math.round(
                          (reclamosCompletados / totalReclamos) * 100,
                        )}% del total`
                      : "Sin reclamos completados"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tiempo Promedio
                  </CardTitle>
                  <Clock className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tiempoPromedio
                      ? convertirTiempoPromedio(tiempoPromedio)
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tiempo de resolucion
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <LazyReclamosPorTipoChart />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <LazyReclamosPorBarrioChart />
              </Suspense>
            </section>
          </TabsContent>

          <TabsContent value="actividad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividad</CardTitle>
                <CardDescription>
                  Actividad registrada en el sistema durante los ultimos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actividadReciente.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay actividad reciente disponible.
                    </p>
                  ) : (
                    actividadReciente.map((actividad) => (
                      <div
                        key={actividad.id}
                        className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            actividad.tipo === "completado"
                              ? "bg-green-100"
                              : actividad.tipo === "asignado"
                              ? "bg-blue-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {actividad.tipo === "completado" ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : actividad.tipo === "asignado" ? (
                            <UsersIcon className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Calendar className="h-6 w-6 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{actividad.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {actividad.descripcion}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {actividad.tiempo}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
