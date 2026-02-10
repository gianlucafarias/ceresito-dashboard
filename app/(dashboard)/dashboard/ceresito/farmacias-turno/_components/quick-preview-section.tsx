"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pharmacy, QuickPreviewItem } from "../_types";
import { parseISODateOnly } from "../_lib/utils";

interface QuickPreviewSectionProps {
  isLoadingQuickPreview: boolean;
  quickPreview: QuickPreviewItem[];
  pharmacyMap: Record<string, Pharmacy>;
}

export function QuickPreviewSection({
  isLoadingQuickPreview,
  quickPreview,
  pharmacyMap,
}: QuickPreviewSectionProps) {
  const showSkeletonCards = isLoadingQuickPreview && quickPreview.length === 0;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {showSkeletonCards
        ? Array.from({ length: 3 }).map((_, index) => (
            <Card key={`quick-preview-skeleton-${index}`}>
              <CardHeader className="pb-3 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </CardContent>
            </Card>
          ))
        : quickPreview.map((item) => {
            const day = parseISODateOnly(item.date);
            const pharmacy =
              item.pharmacy ||
              (item.schedule?.pharmacyCode
                ? pharmacyMap[item.schedule.pharmacyCode.toUpperCase()]
                : undefined);
            const manualEditLabel =
              item.schedule?.source === "manual-override"
                ? (() => {
                    const referenceDate =
                      item.schedule.updatedAt || item.schedule.createdAt;
                    if (!referenceDate) return "Editado manualmente";

                    const parsed = new Date(referenceDate);
                    if (Number.isNaN(parsed.getTime()))
                      return "Editado manualmente";

                    return `Editado el ${format(parsed, "Pp", { locale: es })}`;
                  })()
                : null;

            return (
              <Card key={`${item.key}-${item.date}`}>
                <CardHeader className="pb-3">
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-base">
                    {format(day, "EEEE d 'de' MMMM", { locale: es })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.schedule ? (
                    <>
                      <p className="font-semibold">
                        {pharmacy?.name || item.schedule.pharmacyCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pharmacy?.address || "Direccion no disponible"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>
                          {pharmacy?.phone || "Telefono no disponible"}
                        </span>
                      </div>
                      {manualEditLabel && (
                        <Badge variant="default">{manualEditLabel}</Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin turno asignado.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
    </section>
  );
}
