import { labelEnum, priorityEnum, statusEnum } from "@/db/schema"
import * as z from "zod"

// Esquema de parámetros de búsqueda simplificado
export const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(10),
  sort: z.string().optional(),
  estado: z.string().optional(),
  prioridad: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  no_cache: z.coerce.boolean().optional().default(false),
})

export const getTasksSchema = searchParamsSchema

export type GetTasksSchema = z.infer<typeof getTasksSchema>

export const createTaskSchema = z.object({
  nombre: z.string().nullable(),
  reclamo: z.enum(labelEnum).nullable(),
  ubicacion: z.string().nullable(),
  barrio: z.string().nullable(),
  telefono: z.string().nullable(),
  estado: z.enum(statusEnum).nullable().default("PENDIENTE"),
  detalle: z.string().nullable(),
  prioridad: z.enum(priorityEnum).nullable().default("MEDIA"),
})

export type CreateTaskSchema = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z.object({
  nombre: z.string().nullable(),
  reclamo: z.enum(labelEnum).nullable(),
  ubicacion: z.string().nullable(),
  barrio: z.string().nullable(),
  telefono: z.string().nullable(),
  estado: z.enum(statusEnum).nullable().default("PENDIENTE"),
  detalle: z.string().nullable(),
  prioridad: z.enum(priorityEnum).nullable().default("MEDIA"),
})

export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>