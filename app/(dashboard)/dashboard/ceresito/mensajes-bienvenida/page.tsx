'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Importaciones necesarias para useReactTable
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel, // Si quieres paginación
  getSortedRowModel,     // Si quieres ordenación
  getFilteredRowModel,   // Si quieres filtrado
  ColumnFiltersState,    // Para estado de filtros
  SortingState,          // Para estado de ordenación
  PaginationState,       // Para estado de paginación
  // VisibilityState,       // Para visibilidad de columnas (opcional)
} from "@tanstack/react-table";

// Importar Tabla, Input, Switch, DatePicker, etc. cuando se implementen
import { DataTable } from '@/components/data-table/data-table'; // Importar DataTable
import { getColumns } from './columns'; // Importar getColumns en lugar de columns
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons"; // O un icono similar de lucide-react
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils"; // Necesario para el botón del DatePicker
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Definición del tipo (se moverá a un archivo de tipos más adelante)
interface MensajeBienvenida {
  id: string | number; 
  clave: string;
  valor: string;
  activo: boolean;
  fecha_actualizacion: string; // Usar string por ahora, se puede parsear a Date
  fecha_expiracion?: string | null; // Usar string por ahora
}

// Esquema de validación Zod
const formSchema = z.object({
  clave: z.string().min(1, { message: "La clave no puede estar vacía." }).regex(/^\S*$/, "La clave no puede contener espacios."),
  valor: z.string().min(1, { message: "El mensaje no puede estar vacío." }).max(500, { message: "El mensaje no puede exceder los 500 caracteres." }),
  activo: z.boolean().default(true),
  fecha_expiracion: z.date().optional().nullable(), // fecha_expiracion es opcional y puede ser null
});

type FormSchemaType = z.infer<typeof formSchema>;

// Función para obtener los mensajes de bienvenida
async function fetchMensajesBienvenida(): Promise<MensajeBienvenida[]> {
  const response = await fetch('https://api.ceres.gob.ar/api/api/config');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  // Asegurarse de devolver SIEMPRE un array
  if (Array.isArray(data)) {
      // Si la API devuelve un array, lo usamos
      return data as MensajeBienvenida[]; 
  } else if (data && typeof data === 'object') {
      // Si la API devuelve un solo objeto (y no es null), lo envolvemos en un array
      return [data as MensajeBienvenida];
  } else {
      // Si la API devuelve algo inesperado (null, string, etc.), devolvemos array vacío
      console.warn("Respuesta inesperada de GET /api/config, se esperaba array u objeto:", data);
      return [];
  }
}

// Ajustar createMensajeBienvenida para que coincida o realizar la conversión en onSubmit
async function createMensajeBienvenida(nuevoMensaje: {
    clave: string;
    valor: string;
    activo: boolean;
    fecha_expiracion: string | null; // La API espera string o null
}): Promise<MensajeBienvenida> {
    const { clave, ...bodyData } = nuevoMensaje; 
    const response = await fetch(`https://api.ceres.gob.ar/api/api/config/${clave}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorBody = await response.json();
            errorMessage += `: ${JSON.stringify(errorBody)}`;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    const createdData = await response.json();
    return createdData as MensajeBienvenida;
}

// Función para actualizar un mensaje de bienvenida
async function updateMensajeBienvenida(
    datosActualizados: { 
        clave: string;
        valor: string; 
        activo: boolean; 
        fecha_expiracion: string | null; 
    }
): Promise<MensajeBienvenida> {
    // Extraer clave para la URL, el resto va en el body
    const { clave, ...bodyData } = datosActualizados;
    const response = await fetch(`https://api.ceres.gob.ar/api/api/config/${clave}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorBody = await response.json();
            errorMessage += `: ${JSON.stringify(errorBody)}`;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    const updatedData = await response.json();
    // Asumimos que la API devuelve el objeto completo actualizado
    return updatedData as MensajeBienvenida;
}

export default function MensajesBienvenidaPage() {
  const [mensajes, setMensajes] = useState<MensajeBienvenida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Estado para saber qué mensaje estamos editando
  const [editingMensaje, setEditingMensaje] = useState<MensajeBienvenida | null>(null);

  // Estado para el formulario del dialogo
  const [nuevoValor, setNuevoValor] = useState("");
  const [nuevoActivo, setNuevoActivo] = useState(true);
  const [nuevaFechaExpiracion, setNuevaFechaExpiracion] = useState<Date | undefined>(undefined);

  // Estados para la tabla (ordenación, filtros, paginación, etc.)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10, // O el tamaño de página que prefieras
  });
  // const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({}) // Opcional
  // const [rowSelection, setRowSelection] = useState({}) // Opcional para selección de filas

  // Inicializar react-hook-form
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    // Los defaultValues se usarán al crear o al resetear sin datos
    defaultValues: {
      clave: "",
      valor: "",
      activo: true,
      fecha_expiracion: null, 
    },
  });

  const cargarMensajes = async () => {
    setLoading(true);
    setError(null);
    // Asegurarse de empezar con un array vacío si hay recarga por error previo
    setMensajes([]); 
    try {
      const data = await fetchMensajesBienvenida();
      // Verificar que la API devolvió un array
      if (Array.isArray(data)) {
          setMensajes(data);
      } else {
          console.error("Error: La API /api/config no devolvió un array.", data);
          setError("Error al procesar la respuesta del servidor (formato inesperado).");
          // Ya establecimos [] al inicio del try, así que el estado es consistente.
      }
    } catch (err) {
      setError(`Error al cargar los mensajes: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
      // Asegurar que mensajes sea un array vacío en caso de error de fetch
      // (Ya se hizo al inicio del try, pero es bueno tenerlo explícito si se quita lo anterior)
      // setMensajes([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  // Función para abrir el diálogo en modo edición
  const handleOpenEditDialog = (mensaje: MensajeBienvenida) => {
    setEditingMensaje(mensaje);
    // Poblar el formulario con los datos del mensaje
    // Convertir fecha_expiracion string a Date si existe
    const fechaExpiracionDate = mensaje.fecha_expiracion ? new Date(mensaje.fecha_expiracion) : null;
    form.reset({
        clave: mensaje.clave,
        valor: mensaje.valor,
        activo: mensaje.activo,
        fecha_expiracion: fechaExpiracionDate,
    });
    setIsDialogOpen(true);
  };

  // Función onSubmit ahora maneja creación y edición
  async function onSubmit(values: FormSchemaType) {
    const apiData = {
        clave: values.clave,
        valor: values.valor,
        activo: values.activo,
        fecha_expiracion: values.fecha_expiracion ? values.fecha_expiracion.toISOString() : null,
    };

    try {
      if (editingMensaje) {
        // --- Modo Edición ---
        const actualizado = await updateMensajeBienvenida(apiData);
        // Actualizar el estado local
        setMensajes(prev => prev.map(m => m.clave === actualizado.clave ? actualizado : m));
      } else {
        // --- Modo Creación ---
        const creado = await createMensajeBienvenida(apiData);
        setMensajes(prev => [creado, ...prev]);
      }
      setIsDialogOpen(false);
      setEditingMensaje(null); // Asegurar que se limpia el estado de edición
      form.reset(); // Resetear a valores por defecto
    } catch (err) {
        alert(`Error al ${editingMensaje ? 'actualizar' : 'crear'} la configuración: ${err instanceof Error ? err.message : String(err)}`);
        console.error(err);
        // Opcional: podríamos no cerrar el diálogo si hay error
        // O usar form.setError para errores específicos
    }
  }

  // Obtener columnas pasando la función para editar
  const columns = getColumns(handleOpenEditDialog);

  // Inicializar la instancia de la tabla usando las columnas generadas
  const table = useReactTable({
    data: mensajes, 
    columns,       // Usar las columnas generadas
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mensajes de Bienvenida</h1>
        
        {/* Botón para abrir diálogo en modo CREAR */}
        <Button onClick={() => {
            setEditingMensaje(null); // Asegurar que no estamos en modo edición
            form.reset(); // Resetear a valores por defecto
            setIsDialogOpen(true);
        }}>Crear Nuevo Mensaje</Button>

      </div>

        {/* El Dialog ahora se controla completamente por isDialogOpen */}
        <Dialog open={isDialogOpen} modal={false} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Si se cierra, limpiar estado de edición y resetear form
            setEditingMensaje(null);
            form.reset(); 
          }
        }
        
        }>
            {/* No necesitamos DialogTrigger si el botón está fuera */}
            <DialogContent 
                className="sm:max-w-[425px]"
            >
                <DialogHeader>
                    {/* Título dinámico */}
                    <DialogTitle>{editingMensaje ? 'Editar Mensaje' : 'Crear Mensaje'} de Bienvenida</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                     {/* El contenido del formulario (<form>, FormFields, etc.) no necesita cambios */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* --- FormField para clave --- */}
                        <FormField
                            control={form.control}
                            name="clave"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clave</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ejemplo_bienvenida" {...field} />
                                    </FormControl>
                                    <FormDescription>Identificador único sin espacios.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ... FormField para valor ... */}
                        <FormField
                            control={form.control}
                            name="valor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mensaje</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Escribe aquí el mensaje de bienvenida..." rows={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ... FormField para activo ... */}
                         <FormField
                            control={form.control}
                            name="activo"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                   <div className="space-y-0.5">
                                        <FormLabel>Activo</FormLabel>
                                        <FormDescription>Marcar si este mensaje debe mostrarse.</FormDescription>
                                   </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {/* ... FormField para fecha_expiracion ... */}
                        <FormField
                            control={form.control}
                            name="fecha_expiracion"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Expiración (Opcional)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                            className="w-auto p-0" 
                                            align="start"
                                        >
                                            <Calendar 
                                                mode="single" 
                                                selected={field.value ?? undefined}
                                                onSelect={field.onChange} 
                                                locale={es} 
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>El mensaje dejará de mostrarse después de esta fecha.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ... Botón de envío ... */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Guardando...' : (editingMensaje ? 'Guardar Cambios' : 'Crear Mensaje')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

      {/* ... (Mensajes de carga/error) ... */}
      {loading && <p className="text-center py-4">Cargando mensajes...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {!loading && !error && (
        <div>
          {mensajes.length > 0 ? (
            <DataTable table={table} />
          ) : (
            <p className="text-center text-gray-600 py-4">No hay mensajes de bienvenida configurados.</p>
          )}
        </div>
      )}
    </div>
  );
} 