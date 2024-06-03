import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const reclamoSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  nombre: z.string(),
  reclamo: z.string(),
  ubicacion: z.string(),
  barrio: z.string(),
  telefono: z.string(),
  estado: z.string(),
  detalle: z.string().nullable(), 
  prioridad: z.string().nullable(), // Permitir que "prioridad" sea una cadena o null
  latitud: z.string().nullable(), 
  longitud: z.string().nullable(),
  cuadrillaid: z.number().nullable(), 

});

export type Task = z.infer<typeof reclamoSchema>