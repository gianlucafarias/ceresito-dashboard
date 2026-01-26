import { Suspense, cache } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Calendar, Clock, LayoutDashboard, Users as UsersIcon, CheckCircle, AlertCircle } from "lucide-react";
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

// Cargar los gráficos de manera diferida para reducir JS inicial
const LazyReclamosPorTipoChart = dynamic(
  () => import("./ReclamosPorTipoChart").then((mod) => mod.ReclamosPorTipoChart),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

const LazyReclamosPorBarrioChart = dynamic(
  () => import("./ReclamosPorBarrioChart").then((mod) => mod.ReclamosPorBarrioChart),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

// Fetch helpers con deduplicación por request
const fetchCuadrillas = cache(async (): Promise<Cuadrilla[]> => {
  const res = await fetch("/api/cuadrillas", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar cuadrillas");
  return res.json();
});

const fetchReclamos = cache(async (): Promise<ReclamosResponse> => {
  const res = await fetch("https://api.ceres.gob.ar/api/api/reclamos", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar reclamos");
  return res.json();
});

const fetchRegistros = cache(async (): Promise<Registro[]> => {
  const res = await fetch("/api/registro-reclamo", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar registros");
  return res.json();
});

export default async function Dashboard() {
  const [cuadrillasResult, reclamosResult, registrosResult] = await Promise.allSettled([
    fetchCuadrillas(),
    fetchReclamos(),
    fetchRegistros(),
  ]);

  const cuadrillas = cuadrillasResult.status === "fulfilled" ? cuadrillasResult.value : [];
  const reclamosData = reclamosResult.status === "fulfilled" ? reclamosResult.value : undefined;
  const registrosData = registrosResult.status === "fulfilled" ? registrosResult.value : undefined;

  const cuadrillasActivas = cuadrillas?.filter((cuadrilla) => cuadrilla.disponible)?.length || 0;
  const reclamosPendientes = reclamosData?.data?.filter((reclamo) => reclamo.estado === "PENDIENTE")?.length || 0;
  const reclamosAsignados = reclamosData?.data?.filter((reclamo) => reclamo.estado === "ASIGNADO")?.length || 0;
  const reclamosCompletados =
    reclamosData?.data?.filter((reclamo) => reclamo.estado === "COMPLETADO")?.length || 0;
  const totalReclamos = reclamosData?.data?.length || 0;

  const tiempoPromedio = (() => {
    if (!registrosData) return 0;

    const tiempos = registrosData
      .filter((registro) => registro.fechaRegistro && registro.fechaSolucion)
      .map(
        (registro) =>
          new Date(registro.fechaSolucion as string).getTime() -
          new Date(registro.fechaRegistro).getTime()
      );

    if (tiempos.length > 0) {
      return tiempos.reduce((a: number, b: number) => a + b, 0) / tiempos.length;
    }
    return 0;
  })();

  const convertirTiempoPromedio = (milisegundos: number): string => {
    const horas = Math.floor(milisegundos / (1000 * 60 * 60));
    const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const actividadReciente = [
    {
      tipo: "completado",
      titulo: "Reclamo #1245 completado",
      tiempo: "Hace 10 minutos",
      descripcion: "Luminaria en Calle San Martín",
    },
    {
      tipo: "asignado",
      titulo: "Cuadrilla #3 asignada",
      tiempo: "Hace 1 hora",
      descripcion: "Reparación en Plaza Central",
    },
    {
      tipo: "nuevo",
      titulo: "Nuevo reclamo registrado",
      tiempo: "Hace 3 horas",
      descripcion: "Poda de árbol en Av. Rivadavia",
    },
    {
      tipo: "completado",
      titulo: "Reclamo #1240 completado",
      tiempo: "Ayer",
      descripcion: "Reparación de bache en Calle Moreno",
    },
    {
      tipo: "asignado",
      titulo: "Cuadrilla #1 asignada",
      tiempo: "Hace 2 días",
      descripcion: "Trabajo en alumbrado público",
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Hola, bienvenido al panel de Obras Públicas</h2>
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
                  <CardTitle className="text-sm font-medium">Cuadrillas Activas</CardTitle>
                  <UsersIcon className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cuadrillasActivas}</div>
                  <p className="text-xs text-muted-foreground">
                    {cuadrillasActivas > 0 && cuadrillas.length > 0
                      ? `${Math.round((cuadrillasActivas / cuadrillas.length) * 100)}% del total disponible`
                      : "Sin cuadrillas activas"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Reclamos Pendientes</CardTitle>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reclamosPendientes}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalReclamos > 0
                      ? `${Math.round((reclamosPendientes / totalReclamos) * 100)}% del total`
                      : "Sin reclamos registrados"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Reclamos Completados</CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reclamosCompletados}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalReclamos > 0
                      ? `${Math.round((reclamosCompletados / totalReclamos) * 100)}% del total`
                      : "Sin reclamos completados"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                  <Clock className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tiempoPromedio ? convertirTiempoPromedio(tiempoPromedio) : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Tiempo de resolución</p>
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
                <CardDescription>Actividad registrada en el sistema durante los últimos días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actividadReciente.map((actividad, i) => (
                    <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
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
                        <p className="text-sm text-muted-foreground">{actividad.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">{actividad.tiempo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
