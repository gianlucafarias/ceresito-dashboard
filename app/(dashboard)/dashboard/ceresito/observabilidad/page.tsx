"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Activity, AlertTriangle, Loader2, RefreshCcw, Search, ShieldCheck } from "lucide-react";
import { apiClient } from "@/app/(dashboard)/dashboard/servicios/_lib/api-client";
import type {
  APIError,
  APIObservabilityEvent,
  APIObservabilityEventDetailResponse,
  APIObservabilitySummaryResponse,
  ObservabilityEventsParams,
} from "@/app/(dashboard)/dashboard/servicios/_lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_FROM_DATE = format(subDays(new Date(), 7), "yyyy-MM-dd");
const DEFAULT_TO_DATE = format(new Date(), "yyyy-MM-dd");

type LogsDraftFilters = Omit<ObservabilityEventsParams, "kind" | "status" | "source"> & {
  kind?: ObservabilityEventsParams["kind"] | "all";
  status?: ObservabilityEventsParams["status"] | "all";
  domain?: string;
};

const DEFAULT_DRAFT: LogsDraftFilters = {
  from: DEFAULT_FROM_DATE,
  to: DEFAULT_TO_DATE,
  page: 1,
  limit: 20,
  domain: "all",
  kind: "all",
  status: "all",
};

const DOMAIN_OPTIONS = ["all", "bot", "bot.reclamos", "bot.impuestos", "bot.ai", "bot.menu", "bot.integration"];
const KIND_OPTIONS = ["all", "audit", "workflow", "request"] as const;
const STATUS_OPTIONS = ["all", "success", "warning", "failure", "skipped"] as const;

function toIsoRangeBoundary(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const date =
    boundary === "start"
      ? new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
      : new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);

  return date.toISOString();
}

function buildAppliedFilters(draft: LogsDraftFilters): Omit<ObservabilityEventsParams, "source"> {
  return {
    ...draft,
    from: toIsoRangeBoundary(draft.from, "start"),
    to: toIsoRangeBoundary(draft.to, "end"),
    domain: draft.domain === "all" ? undefined : draft.domain,
    kind: draft.kind === "all" ? undefined : draft.kind,
    status: draft.status === "all" ? undefined : draft.status,
    query: draft.query?.trim() || undefined,
    actorId: draft.actorId?.trim() || undefined,
    entityId: draft.entityId?.trim() || undefined,
    requestId: draft.requestId?.trim() || undefined,
    page: draft.page ?? 1,
    limit: draft.limit ?? 20,
  };
}

const DEFAULT_FILTERS = buildAppliedFilters(DEFAULT_DRAFT);

function errorMessage(result: APIError | null) {
  return result?.message || "Error inesperado";
}

function dateTime(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy HH:mm:ss") : "n/a";
}

function duration(value?: number | null) {
  if (value === undefined || value === null) return "n/a";
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(2)} s`;
}

function tone(status: APIObservabilityEvent["status"]) {
  if (status === "success") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "warning") return "bg-amber-100 text-amber-900 border-amber-200";
  if (status === "failure") return "bg-rose-100 text-rose-900 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function BotObservabilityPage() {
  const [summary, setSummary] = useState<APIObservabilitySummaryResponse | null>(null);
  const [events, setEvents] = useState<APIObservabilityEvent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<LogsDraftFilters>(DEFAULT_DRAFT);
  const [detail, setDetail] = useState<APIObservabilityEventDetailResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const activeFilters = useMemo(
    () => [filters.domain, filters.kind, filters.status, filters.query, filters.actorId, filters.entityId, filters.requestId].filter(Boolean).length,
    [filters],
  );

  async function load(current: Omit<ObservabilityEventsParams, "source">) {
    setLoading(true);
    setError(null);
    const [summaryResponse, eventsResponse] = await Promise.all([
      apiClient.getBotObservabilitySummary(),
      apiClient.listBotObservabilityEvents(current),
    ]);

    if (!summaryResponse.success) {
      setError(errorMessage(summaryResponse));
      setLoading(false);
      return;
    }

    if (!eventsResponse.success) {
      setError(errorMessage(eventsResponse));
      setLoading(false);
      return;
    }

    setSummary(summaryResponse.data);
    setEvents(eventsResponse.data);
    setPagination(eventsResponse.pagination);
    setLoading(false);
  }

  async function openDetail(id: string) {
    setSelectedId(id);
    setLoadingDetail(true);
    setOpen(true);
    const response = await apiClient.getBotObservabilityEvent(id);
    if (response.success) {
      setDetail(response.data);
    } else {
      setError(errorMessage(response));
    }
    setLoadingDetail(false);
  }

  useEffect(() => {
    void load(filters);
  }, [filters]);

  function applyFilters() {
    setFilters({
      ...buildAppliedFilters(draft),
      page: 1,
    });
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <Badge className="border border-blue-200 bg-blue-50 text-blue-900">Fuente bloqueada: bot</Badge>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load(filters)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
            {activeFilters} filtros
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Activity} label="Eventos Bot 24h" value={summary?.totals.events24h ?? 0} note={`${summary?.totals.totalEvents ?? 0} acumulados`} />
        <MetricCard icon={AlertTriangle} label="Errores Bot 24h" value={summary?.totals.errorEvents24h ?? 0} note={`${summary?.totals.requestFailures24h ?? 0} requests fallidos`} />
        <MetricCard icon={ShieldCheck} label="Acciones audit" value={summary?.totals.adminActions24h ?? 0} note="auditoria en bot" />
        <MetricCard icon={Activity} label="Requests lentos" value={summary?.totals.slowRequests24h ?? 0} note="deteccion temprana" />
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Filtros de observabilidad del bot</CardTitle>
          <CardDescription>Busca por requestId, entidad, actor o dominio del bot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input type="date" value={draft.from || ""} onChange={(e) => setDraft((c) => ({ ...c, from: e.target.value }))} />
            <Input type="date" value={draft.to || ""} onChange={(e) => setDraft((c) => ({ ...c, to: e.target.value }))} />
            <Select value={draft.domain || "all"} onValueChange={(value) => setDraft((c) => ({ ...c, domain: value }))}>
              <SelectTrigger><SelectValue placeholder="Dominio" /></SelectTrigger>
              <SelectContent>{DOMAIN_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.kind || "all"} onValueChange={(value) => setDraft((c) => ({ ...c, kind: value as ObservabilityEventsParams["kind"] | "all" }))}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>{KIND_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input className="pl-9" placeholder="requestId, eventName, summary o actor" value={draft.query || ""} onChange={(e) => setDraft((c) => ({ ...c, query: e.target.value }))} />
            </div>
            <Select value={draft.status || "all"} onValueChange={(value) => setDraft((c) => ({ ...c, status: value as ObservabilityEventsParams["status"] | "all" }))}>
              <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Actor ID o entidad ID" value={draft.actorId || ""} onChange={(e) => setDraft((c) => ({ ...c, actorId: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>Aplicar</Button>
            <Button variant="outline" onClick={() => { setDraft(DEFAULT_DRAFT); setFilters(DEFAULT_FILTERS); }}>Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Timeline de eventos del bot</CardTitle>
                <CardDescription>{pagination.total} eventos encontrados.</CardDescription>
              </div>
              <Badge variant="outline">pagina {pagination.page}/{pagination.totalPages}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" />Cargando...</div>
            ) : error ? (
              <div className="px-6 py-12 text-sm text-rose-600">{error}</div>
            ) : (
              <>
                <div className="max-h-[720px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Request</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id} className={`cursor-pointer ${selectedId === event.id ? "bg-blue-50/60" : ""}`} onClick={() => void openDetail(event.id)}>
                          <TableCell className="min-w-[280px]">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{event.kind}</Badge>
                                <Badge className={`border ${tone(event.status)}`}>{event.status}</Badge>
                              </div>
                              <div className="font-medium text-zinc-900">{event.eventName}</div>
                              <p className="line-clamp-2 text-sm text-zinc-600">{event.summary}</p>
                              <div className="text-xs text-zinc-500">{event.domain}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-600">{event.actorLabel || event.actorType}</TableCell>
                          <TableCell className="text-sm text-zinc-600">{event.status}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-500">{event.requestId || "n/a"}</TableCell>
                          <TableCell className="text-xs text-zinc-500">{dateTime(event.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                  <div className="text-sm text-zinc-500">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={pagination.page <= 1} onClick={() => setFilters((c) => ({ ...c, page: pagination.page - 1 }))}>Anterior</Button>
                    <Button variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((c) => ({ ...c, page: pagination.page + 1 }))}>Siguiente</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Dominios activos del bot</CardTitle>
              <CardDescription>Lo que más está emitiendo eventos del bot ahora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary?.domainBreakdown?.map((item) => (
                <div key={item.domain} className="rounded-2xl border border-zinc-200 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-800">{item.domain}</span>
                    <span className="text-zinc-500">{item.count}</span>
                  </div>
                </div>
              )) || <p className="text-sm text-zinc-500">Sin datos.</p>}
            </CardContent>
          </Card>
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Warnings y fallos del bot</CardTitle>
              <CardDescription>Los últimos eventos para revisar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary?.recentFailures?.map((event) => (
                <button key={event.id} className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40" onClick={() => void openDetail(event.id)}>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`border ${tone(event.status)}`}>{event.status}</Badge>
                    <span className="text-sm font-medium text-zinc-900">{event.eventName}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{event.summary}</p>
                </button>
              )) || <p className="text-sm text-zinc-500">Sin fallos recientes.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Detalle del evento (Bot)</SheetTitle>
            <SheetDescription>Diff sanitizado, metadata y timeline correlacionado del bot.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Cargando detalle...</div>
            ) : !detail ? (
              <p className="text-sm text-zinc-500">Selecciona un evento.</p>
            ) : (
              <>
                <Card>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{detail.event.kind}</Badge>
                      <Badge className={`border ${tone(detail.event.status)}`}>{detail.event.status}</Badge>
                      <Badge variant="outline">{detail.event.domain}</Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-950">{detail.event.eventName}</h3>
                      <p className="mt-1 text-sm text-zinc-600">{detail.event.summary}</p>
                    </div>
                    <div className="grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
                      <Detail label="Actor" value={detail.event.actorLabel || detail.event.actorType} />
                      <Detail label="Actor ID" value={detail.event.actorId || "n/a"} mono />
                      <Detail label="Request ID" value={detail.event.requestId || "n/a"} mono />
                      <Detail label="Ruta" value={detail.event.route || "n/a"} mono />
                      <Detail label="Metodo" value={detail.event.method || "n/a"} />
                      <Detail label="Duracion" value={duration(detail.event.durationMs)} />
                      <Detail label="Entidad" value={detail.event.entityType || "n/a"} />
                      <Detail label="Entidad ID" value={detail.event.entityId || "n/a"} mono />
                      <Detail label="Fecha" value={dateTime(detail.event.createdAt)} />
                    </div>
                  </CardContent>
                </Card>
                <JsonCard title="Changes" data={detail.event.changes} />
                <JsonCard title="Metadata" data={detail.event.metadata} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline del request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.timeline.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-zinc-200 px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{event.kind}</Badge>
                          <Badge className={`border ${tone(event.status)}`}>{event.status}</Badge>
                          <span className="text-sm font-medium text-zinc-900">{event.eventName}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600">{event.summary}</p>
                        <div className="mt-2 text-xs text-zinc-500">{dateTime(event.createdAt)} · {duration(event.durationMs)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-600">{label}</p>
          <div className="text-3xl font-bold tracking-tight text-zinc-950">{value}</div>
          <p className="text-sm text-zinc-500">{note}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <Icon className="h-5 w-5 text-zinc-800" />
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</div>
      <div className={`break-all text-zinc-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function JsonCard({ title, data }: { title: string; data: Record<string, any> | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <pre className="overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-zinc-100">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p className="text-sm text-zinc-500">Sin datos.</p>
        )}
      </CardContent>
    </Card>
  );
}
