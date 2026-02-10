"use client";

import { Loader2, Pencil, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pharmacy } from "../_types";

interface PharmaciesTabContentProps {
  pharmacySearch: string;
  setPharmacySearch: (value: string) => void;
  pharmacyLookupCode: string;
  setPharmacyLookupCode: (value: string) => void;
  isLookupLoading: boolean;
  handleLookupPharmacy: () => Promise<void>;
  filteredPharmacies: Pharmacy[];
  openEditPharmacyDialog: (pharmacy: Pharmacy) => void;
}

export function PharmaciesTabContent({
  pharmacySearch,
  setPharmacySearch,
  pharmacyLookupCode,
  setPharmacyLookupCode,
  isLookupLoading,
  handleLookupPharmacy,
  filteredPharmacies,
  openEditPharmacyDialog,
}: PharmaciesTabContentProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Farmacias</CardTitle>
          <CardDescription>
            Busca por codigo o nombre, carga una farmacia puntual y edita sus
            datos para mantener actualizado el calendario de turnos.
          </CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <div className="relative w-full md:w-[320px]">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={pharmacySearch}
              onChange={(event) => setPharmacySearch(event.target.value)}
              placeholder="Buscar por codigo, nombre, direccion..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={pharmacyLookupCode}
              onChange={(event) =>
                setPharmacyLookupCode(event.target.value.toUpperCase())
              }
              placeholder="Codigo (ej: CERUTTI)"
              className="w-full md:w-[200px]"
            />
            <Button
              variant="outline"
              onClick={handleLookupPharmacy}
              disabled={isLookupLoading}
            >
              {isLookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cargar"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPharmacies.map((pharmacy) => (
                <TableRow key={pharmacy.code}>
                  <TableCell className="font-medium">{pharmacy.code}</TableCell>
                  <TableCell>{pharmacy.name}</TableCell>
                  <TableCell>{pharmacy.address}</TableCell>
                  <TableCell>{pharmacy.phone}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p>
                        {pharmacy.lat ?? "-"}, {pharmacy.lng ?? "-"}
                      </p>
                      <p className="truncate">
                        {pharmacy.googleMapsAddress || "Sin Google Maps URL"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditPharmacyDialog(pharmacy)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredPharmacies.length === 0 && (
          <p className="pt-4 text-sm text-muted-foreground">
            No hay farmacias cargadas para mostrar. Usa "Cargar" por codigo para
            traer una.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
