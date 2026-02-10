"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DutyAssignment, Pharmacy } from "../_types";
import { toISODateOnly } from "../_lib/utils";

interface CalendarTabContentProps {
  monthTitle: string;
  isLoadingMonth: boolean;
  monthError: string | null;
  monthDays: Date[];
  assignmentMap: Record<string, DutyAssignment>;
  pharmacyMap: Record<string, Pharmacy>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onReload: () => void;
  onQuickEditDay: (day: Date, pharmacyCode?: string) => void;
}

export function CalendarTabContent({
  monthTitle,
  isLoadingMonth,
  monthError,
  monthDays,
  assignmentMap,
  pharmacyMap,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onReload,
  onQuickEditDay,
}: CalendarTabContentProps) {
  const todayKey = toISODateOnly(new Date());
  const showSkeletonRows = isLoadingMonth;
  const skeletonRowCount =
    monthDays.length > 0 ? Math.min(monthDays.length, 10) : 10;
  const isManuallyModified = (assignment?: DutyAssignment) => {
    if (!assignment) return false;
    if (assignment.source === "manual-override") return true;

    if (assignment.createdAt && assignment.updatedAt) {
      const created = new Date(assignment.createdAt).getTime();
      const updated = new Date(assignment.updatedAt).getTime();
      if (Number.isFinite(created) && Number.isFinite(updated)) {
        return updated > created;
      }
    }

    return false;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="capitalize">{monthTitle}</CardTitle>
          <CardDescription>Vista mensual de turnos.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Mes siguiente</span>
          </Button>
          <Button variant="secondary" onClick={onCurrentMonth}>
            Mes actual
          </Button>
          <Button variant="ghost" onClick={onReload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recargar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {monthError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {monthError}
          </div>
        )}

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Farmacia</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Modificado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showSkeletonRows
                ? Array.from({ length: skeletonRowCount }).map((_, index) => (
                    <TableRow key={`calendar-skeleton-row-${index}`}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-9 w-28 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : monthDays.map((day) => {
                    const dateKey = toISODateOnly(day);
                    const assignment = assignmentMap[dateKey];
                    const pharmacy = assignment
                      ? pharmacyMap[assignment.pharmacyCode.toUpperCase()] ||
                        assignment.pharmacy
                      : undefined;
                    const modified = isManuallyModified(assignment);

                    return (
                      <TableRow
                        key={dateKey}
                        className={cn(dateKey === todayKey && "bg-muted/40")}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(day, "EEE d", { locale: es })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {dateKey}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {pharmacy?.name || assignment.pharmacyCode}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {assignment.pharmacyCode}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline">Sin asignar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pharmacy?.address || "Sin direccion"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pharmacy?.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={modified ? "default" : "outline"}>
                            {modified ? "Si" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onQuickEditDay(day, assignment?.pharmacyCode)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar dia
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
