"use client";

import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseNullableNumber } from "../_lib/utils";
import { Pharmacy } from "../_types";

interface EditPharmacyDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  editingPharmacy: Pharmacy | null;
  updateEditingPharmacy: (partial: Partial<Pharmacy>) => void;
  handleSavePharmacy: () => Promise<void>;
  isSavingPharmacy: boolean;
}

export function EditPharmacyDialog({
  isOpen,
  setIsOpen,
  editingPharmacy,
  updateEditingPharmacy,
  handleSavePharmacy,
  isSavingPharmacy,
}: EditPharmacyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Editar farmacia</DialogTitle>
          <DialogDescription>
            Actualiza la informacion de contacto y ubicacion de la farmacia.
            Estos cambios se reflejan en el calendario y en el detalle diario.
          </DialogDescription>
        </DialogHeader>

        {editingPharmacy && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pharmacy-code">Codigo</Label>
              <Input id="pharmacy-code" value={editingPharmacy.code} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pharmacy-name">Nombre</Label>
              <Input
                id="pharmacy-name"
                value={editingPharmacy.name}
                onChange={(event) =>
                  updateEditingPharmacy({ name: event.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pharmacy-address">Direccion</Label>
              <Input
                id="pharmacy-address"
                value={editingPharmacy.address}
                onChange={(event) =>
                  updateEditingPharmacy({ address: event.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pharmacy-phone">Telefono</Label>
              <Input
                id="pharmacy-phone"
                value={editingPharmacy.phone}
                onChange={(event) =>
                  updateEditingPharmacy({ phone: event.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pharmacy-lat">Latitud</Label>
                <Input
                  id="pharmacy-lat"
                  type="number"
                  step="any"
                  value={editingPharmacy.lat ?? ""}
                  onChange={(event) =>
                    updateEditingPharmacy({
                      lat: parseNullableNumber(event.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pharmacy-lng">Longitud</Label>
                <Input
                  id="pharmacy-lng"
                  type="number"
                  step="any"
                  value={editingPharmacy.lng ?? ""}
                  onChange={(event) =>
                    updateEditingPharmacy({
                      lng: parseNullableNumber(event.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pharmacy-gmaps">Direccion en Google Maps</Label>
              <Input
                id="pharmacy-gmaps"
                value={editingPharmacy.googleMapsAddress ?? ""}
                onChange={(event) =>
                  updateEditingPharmacy({
                    googleMapsAddress: event.target.value || null,
                  })
                }
              />
            </div>

            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Donde se usan estos datos</span>
              </div>
              <p>
                Nombre, direccion, telefono y ubicacion se muestran en el
                calendario, la vista rapida y el detalle por fecha.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePharmacy} disabled={isSavingPharmacy}>
                {isSavingPharmacy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
