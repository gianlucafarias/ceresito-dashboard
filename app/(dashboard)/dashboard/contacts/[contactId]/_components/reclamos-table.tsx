"use client";

import { Reclamo } from "@/types/contact-detail";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Eye } from 'lucide-react';

interface ReclamosTableProps {
  reclamos: Reclamo[];
}

// Definición de columnas para la tabla de reclamos
const reclamoColumns: ColumnDef<Reclamo>[] = [
  { accessorKey: "id", header: "ID Reclamo" },
  { 
    accessorKey: "fecha", 
    header: "Fecha",
    cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString(),
  },
  { accessorKey: "reclamo", header: "Tipo Reclamo" },
  { accessorKey: "estado", header: "Estado" },
  { accessorKey: "ubicacion", header: "Ubicación", cell: ({row}) => row.original.ubicacion || "N/A" },
  {
    id: "actions",
    header: "Detalles",
    cell: ({ row }) => (
      <Link href={`/dashboard/reclamos/${row.original.id}`} passHref>
        <Button variant="outline" size="sm">
         <Eye className="h-4 w-4 mr-1" /> Ver
        </Button>
      </Link>
    ),
  },
];

export function ReclamosTable({ reclamos }: ReclamosTableProps) {
  if (!reclamos || reclamos.length === 0) {
    return <p>No se encontraron reclamos para este contacto.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reclamos ({reclamos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={reclamoColumns} 
          data={reclamos} 
          searchKey="reclamo" // O podrías querer buscar por 'estado' o 'id'
          // El ordenamiento y paginación serán del lado del cliente para esta tabla anidada por defecto
          // Si se necesita del lado del servidor, requeriría props adicionales y lógica.
        />
      </CardContent>
    </Card>
  );
} 