"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  Download,
  Loader2,
  PlusCircle,
  QrCode,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isValidHttpUrl } from "@/lib/qr/utils";

const qrFormSchema = z.object({
  includeLogo: z.boolean().default(true),
  name: z
    .string()
    .trim()
    .max(120, "El nombre puede tener hasta 120 caracteres")
    .optional(),
  targetUrl: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .refine(isValidHttpUrl, "Ingresa una URL valida con http:// o https://"),
});

type QrFormValues = z.infer<typeof qrFormSchema>;

type QrCodeItem = {
  id: number;
  name: string;
  targetUrl: string;
  downloadFileName: string;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
  trackingEnabled: boolean;
  trackingRedirectUrl: string | null;
  scanCount: number | null;
  lastScannedAt: string | null;
};

async function parseApiError(response: Response) {
  try {
    const data = await response.json();

    if (data?.details) {
      const detailMessages = Object.values(data.details)
        .flat()
        .filter(Boolean)
        .join(" ");

      if (detailMessages) {
        return detailMessages;
      }
    }

    return data?.error || "Ocurrio un error inesperado";
  } catch {
    return "Ocurrio un error inesperado";
  }
}

export function QrDashboardClient() {
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qrCodeToDelete, setQrCodeToDelete] = useState<QrCodeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: {
      includeLogo: true,
      name: "",
      targetUrl: "",
    },
  });

  const loadQrCodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/qr-codes", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const data = (await response.json()) as QrCodeItem[];
      setQrCodes(data);
    } catch (error) {
      console.error("Error loading qr codes:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la lista de QR",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQrCodes();
  }, []);

  const onSubmit = async (values: QrFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const createdQrCode = (await response.json()) as QrCodeItem;
      setQrCodes((previousQrCodes) => [createdQrCode, ...previousQrCodes]);
      form.reset({
        includeLogo: true,
        name: "",
        targetUrl: "",
      });
      toast.success("Codigo QR generado y guardado correctamente");
    } catch (error) {
      console.error("Error creating qr code:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear el codigo QR",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (qrCode: QrCodeItem) => {
    setQrCodeToDelete(qrCode);
    setIsDeleteDialogOpen(true);
  };

  const handleCopyTrackingLink = async (qrCode: QrCodeItem) => {
    if (!qrCode.trackingRedirectUrl) {
      toast.error("Este QR todavia no tiene un link trackeado para copiar");
      return;
    }

    try {
      await copyTextToClipboard(qrCode.trackingRedirectUrl);
      toast.success("Link trackeado copiado al portapapeles");
    } catch (error) {
      console.error("Error copying tracking link:", error);
      toast.error("No se pudo copiar el link trackeado");
    }
  };

  const handleConfirmDelete = async () => {
    if (!qrCodeToDelete) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/qr-codes/${qrCodeToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      setQrCodes((previousQrCodes) =>
        previousQrCodes.filter((qrCode) => qrCode.id !== qrCodeToDelete.id),
      );
      toast.success("QR eliminado de la lista correctamente");
      setIsDeleteDialogOpen(false);
      setQrCodeToDelete(null);
    } catch (error) {
      console.error("Error deleting qr code:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el codigo QR",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR</h1>
          <p className="text-sm text-muted-foreground">
            Genera codigos QR persistentes a partir de links y descargalos
            cuando los necesites. Los nuevos incluyen tracking y link corto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar nuevo QR</CardTitle>
          <CardDescription>
            Guarda el link, el PNG y su link corto trackeado para mantenerlo
            disponible en el dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto]"
            >
              <FormField
                control={form.control}
                name="includeLogo"
                render={({ field }) => (
                  <FormItem className="md:col-span-3 flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel>Integrar logo municipal</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Si esta activo, el QR se genera con una ventana central
                        limpia para el logo.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Landing abril" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://ceres.gob.ar/..."
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Generar QR
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR generados</CardTitle>
          <CardDescription>
            Lista global de codigos QR guardados para descargar. Los QR
            anteriores a este tracking quedan marcados como sin estadisticas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Todavia no hay codigos QR generados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Preview</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-[220px]">Escaneos</TableHead>
                  <TableHead className="w-[190px]">Creado</TableHead>
                  <TableHead className="w-[320px] text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qrCode) => (
                  <TableRow key={qrCode.id}>
                    <TableCell>
                      <div className="h-20 w-20 overflow-hidden rounded-md border bg-white p-2">
                        <img
                          alt={`Preview del QR ${qrCode.name}`}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          src={qrCode.previewUrl}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{qrCode.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {qrCode.downloadFileName}
                      </div>
                      {qrCode.trackingRedirectUrl ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDisplayUrl(qrCode.trackingRedirectUrl)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <a
                        className="line-clamp-2 break-all text-sm text-primary underline-offset-4 hover:underline"
                        href={qrCode.targetUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {qrCode.targetUrl}
                      </a>
                    </TableCell>
                    <TableCell>
                      {!qrCode.trackingEnabled ? (
                        <div className="text-sm text-muted-foreground">
                          Sin tracking
                        </div>
                      ) : qrCode.scanCount === null ? (
                        <div className="text-sm text-muted-foreground">
                          Tracking sin datos ahora
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {qrCode.scanCount} escaneos
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {qrCode.lastScannedAt
                              ? `Ultimo: ${new Date(qrCode.lastScannedAt).toLocaleString(
                                  "es-AR",
                                )}`
                              : "Sin lecturas todavia"}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(qrCode.createdAt).toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={qrCode.downloadUrl}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </a>
                        </Button>
                        <Button
                          disabled={!qrCode.trackingRedirectUrl}
                          onClick={() => void handleCopyTrackingLink(qrCode)}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar link
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(qrCode)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open && !isDeleting) {
            setQrCodeToDelete(null);
          }
        }}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar QR de la lista</AlertDialogTitle>
            <AlertDialogDescription>
              {qrCodeToDelete ? (
                <>
                  Vas a quitar <strong>{qrCodeToDelete.name}</strong> del
                  listado del dashboard. El QR ya compartido seguira activo y
                  redirigiendo al link configurado, pero dejara de aparecer aca
                  y no podra descargarse nuevamente desde este panel.
                </>
              ) : (
                "Vas a quitar este QR del listado del dashboard."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Si, eliminar de la lista"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function formatDisplayUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return `${parsedUrl.host}${parsedUrl.pathname}`;
  } catch {
    return value;
  }
}
