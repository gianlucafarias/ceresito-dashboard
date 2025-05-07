"use client";

import { useState } from "react";
import { ContactDetail } from "@/types/contact-detail";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueDisplay } from "@/components/ui/key-value-display";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // Asumiendo que sonner está instalado y configurado

interface ContactInfoCardProps {
  contact: ContactDetail | null;
}

export function ContactInfoCard({ contact }: ContactInfoCardProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  // const [isBlocked, setIsBlocked] = useState(contact?.isBlocked || false); // Futuro: para manejar estado de bloqueo

  if (!contact) {
    return <p>No contact details available.</p>;
  }

  const generalInfo = {
    "ID": contact.id,
    "Nombre": contact.contact_name || "N/A",
    "Teléfono": contact.phone || "N/A",
    "Fecha Registro": new Date(contact.createdAt).toLocaleString(),
    "Última interacción": contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleString() : "N/A",
  };

  const handleBlockContact = async () => {
    if (!contact.phone) {
      toast.error("Error", { description: "No se puede bloquear un contacto sin teléfono." });
      return;
    }

    setIsBlocking(true);
    try {
      const response = await fetch('https://api.ceres.gob.ar/v1/blacklist', { // Usando URL completa como se proporcionó
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: contact.phone, 
          intent: 'add',
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'ok') {
        toast.success("Contacto Bloqueado", { description: `Contacto ${contact.phone} bloqueado exitosamente.` });
        // setIsBlocked(true); // Futuro: actualizar estado local
      } else {
        throw new Error(result.message || "Error al bloquear contacto");
      }
    } catch (error: any) {
      console.error("Error bloqueando contacto:", error);
      toast.error("Error al bloquear contacto", { description: error.message || "Ocurrió un error desconocido." });
    } finally {
      setIsBlocking(false);
    }
  };

  // Futuro: handleUnblockContact

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        {contact.phone && (
            <CardDescription>
                Teléfono: {contact.phone}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <KeyValueDisplay data={generalInfo} omitKeys={["Phone"]} />
        {contact.values && Object.keys(contact.values).length > 0 && (
          <div className="pt-3">
            <h4 className="text-md font-semibold mb-1">Valores Personalizados:</h4>
            <KeyValueDisplay data={contact.values} />
          </div>
        )}
      </CardContent>
      {contact.phone && ( // Solo mostrar si hay un número de teléfono
        <CardFooter className="border-t pt-4">
            {/* Futuro: if (isBlocked) ... else ... */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isBlocking}>
                  {isBlocking ? "Bloquear..." : "Bloquear Contacto"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción bloqueará el contacto con el número {contact.phone}. 
                    No podrán comunicarse con Ceresito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBlockContact} disabled={isBlocking}>
                    Bloquear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

// Modificación a KeyValueDisplay para omitir claves
// Esto debería estar en su propio archivo, pero por brevedad, lo pongo aquí conceptualmente
// O mejor, se modifica el componente KeyValueDisplay para aceptar una prop `omitKeys`
// En KeyValueDisplay.tsx:
/*
interface KeyValueDisplayProps {
  data: Record<string, any>;
  className?: string;
  omitKeys?: string[]; // Nueva prop
}

export function KeyValueDisplay({ data, className, omitKeys = [] }: KeyValueDisplayProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm ${className || ''}`}>
      {Object.entries(data).filter(([key]) => !omitKeys.includes(key)).map(([key, value]) => (
        // ... resto del map ...
      ))}
    </div>
  );
}
*/ 