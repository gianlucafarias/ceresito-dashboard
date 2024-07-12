import { z } from 'zod';

export const statusEnum = [
  "COMPLETADO",
  "EN_PROCESO",
  "ASIGNADO",
  "PENDIENTE",
  "CANCELADO"
]

export const labelEnum =  [
  "Arboles", "Higiene Urbana", "Arreglos", "Animales", "Luminarias"
]

export const priorityEnum = [
  "BAJA",
  "MEDIA",
  "ALTA",
]


export const tasks = z.object({
  id: z.number(),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  nombre: z.string().nullable(),
  reclamo: z.enum(labelEnum).nullable(),
  ubicacion: z.string().nullable(),
  barrio: z.string().nullable(),
  telefono: z.string().nullable(),
  estado: z.enum(statusEnum).nullable().default("PENDIENTE"),
  detalle: z.string().nullable(),
  prioridad: z.enum(priorityEnum).nullable().default("MEDIA"),
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
export type Task = z.infer<typeof tasks>;
export type NewTask = z.infer<typeof tasks>;
