"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DutyAssignment, Pharmacy } from "../_types";

interface DutyTabContentProps {
  selectedDutyDate: Date | undefined;
  setSelectedDutyDate: (value: Date | undefined) => void;
  selectedDutyPharmacyCode: string;
  setSelectedDutyPharmacyCode: (value: string) => void;
  availablePharmacyCodes: string[];
  pharmacyMap: Record<string, Pharmacy>;
  isLoadingPharmacies: boolean;
  handleApplyDutyChange: () => Promise<void>;
  isSavingDuty: boolean;
  isLoadingSelectedDuty: boolean;
  selectedDutyDetail: DutyAssignment | null;
  selectedDateTitle: string;
  currentSelectedPharmacy: Pharmacy | undefined;
}

export function DutyTabContent({
  selectedDutyDate,
  setSelectedDutyDate,
  selectedDutyPharmacyCode,
  setSelectedDutyPharmacyCode,
  availablePharmacyCodes,
  pharmacyMap,
  isLoadingPharmacies,
  handleApplyDutyChange,
  isSavingDuty,
  isLoadingSelectedDuty,
  selectedDutyDetail,
  selectedDateTitle,
  currentSelectedPharmacy,
}: DutyTabContentProps) {
  const selectedDutyManualEditLabel =
    selectedDutyDetail?.source === "manual-override"
      ? (() => {
          const referenceDate =
            selectedDutyDetail.updatedAt || selectedDutyDetail.createdAt;
          if (!referenceDate) return "Editado manualmente";

          const parsed = new Date(referenceDate);
          if (Number.isNaN(parsed.getTime())) return "Editado manualmente";

          return `Editado el ${format(parsed, "Pp", { locale: es })}`;
        })()
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Reasignar farmacia por fecha</CardTitle>
          <CardDescription>
            Selecciona un dia y asigna la farmacia que debe quedar de turno. Al
            guardar, el calendario se actualiza con el nuevo turno.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDutyDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDutyDate
                    ? format(selectedDutyDate, "PPP", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDutyDate}
                  onSelect={setSelectedDutyDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Farmacia</Label>
            <Select
              value={selectedDutyPharmacyCode}
              onValueChange={setSelectedDutyPharmacyCode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una farmacia" />
              </SelectTrigger>
              <SelectContent>
                {availablePharmacyCodes.map((code) => {
                  const pharmacy = pharmacyMap[code];
                  return (
                    <SelectItem key={code} value={code}>
                      {pharmacy ? `${code} - ${pharmacy.name}` : code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {isLoadingPharmacies && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando datos de farmacias...
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleApplyDutyChange}
            disabled={isSavingDuty}
          >
            {isSavingDuty ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              "Guardar cambio de turno"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de la fecha seleccionada</CardTitle>
          <CardDescription>
            Muestra el estado actual del dia elegido para validar la farmacia,
            direccion y contacto antes de guardar cambios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedDutyDate ? (
            <p className="text-sm text-muted-foreground">
              Selecciona una fecha para ver su turno.
            </p>
          ) : isLoadingSelectedDuty ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando turno...
            </div>
          ) : selectedDutyDetail ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{selectedDateTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Farmacia asignada
                </p>
                <p className="font-medium">
                  {selectedDutyDetail.pharmacyCode}
                  {currentSelectedPharmacy?.name
                    ? ` - ${currentSelectedPharmacy.name}`
                    : ""}
                </p>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {currentSelectedPharmacy?.address ||
                    "Direccion no disponible"}
                </p>
                <p>
                  {currentSelectedPharmacy?.phone || "Telefono no disponible"}
                </p>
                <p>
                  Coordenadas: {currentSelectedPharmacy?.lat ?? "-"},{" "}
                  {currentSelectedPharmacy?.lng ?? "-"}
                </p>
              </div>
              {selectedDutyManualEditLabel && (
                <Badge variant="default">{selectedDutyManualEditLabel}</Badge>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay turno asignado para esta fecha. Puedes asignarlo desde el
              formulario.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
