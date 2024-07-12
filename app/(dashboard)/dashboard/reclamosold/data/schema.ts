import { z } from 'zod';

export const reclamoSchema = z.object({
  id: z.number(),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  nombre: z.string().nullable(),
  reclamo: z.string().nullable(),
  ubicacion: z.string().nullable(),
  barrio: z.string().nullable(),
  telefono: z.string().nullable(),
  estado: z.string().nullable(),
  detalle: z.string().nullable(),
  prioridad: z.string().nullable(),
  latitud: z.string().nullable(),
  longitud: z.string().nullable(),
  cuadrillaid: z.number().nullable(),
});

export const cuadrillaSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  telefono: z.string(),
  disponible: z.boolean(),
  ultimaAsignacion: z.string().nullable(),
  limiteReclamosSimultaneos: z.number(),
  reclamosAsignados: z.array(z.any()),
  tipo: z.array(z.object({
    id: z.number(),
    nombre: z.string(),
  })),
});

export type Cuadrilla = z.infer<typeof cuadrillaSchema>
export type Task = z.infer<typeof reclamoSchema>;
