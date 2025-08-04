import { z } from "zod"

// Schema para filtros y búsqueda de encuestas
export const getEncuestasSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(10),
  sort: z.string().optional(),
  barrio: z.string().optional(),
  estado: z.string().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  search: z.string().optional(),
  no_cache: z.boolean().optional().default(false)
})

export type GetEncuestasSchema = z.infer<typeof getEncuestasSchema>

// Schema para crear encuesta (futuro)
export const createEncuestaSchema = z.object({
  dni: z.string().min(7, "DNI debe tener al menos 7 dígitos").max(8, "DNI debe tener máximo 8 dígitos"),
  barrio: z.string().min(1, "Barrio es requerido"),
  obrasUrgentes: z.array(z.string()).min(1, "Debe seleccionar al menos una obra urgente").max(3, "Máximo 3 opciones"),
  obrasUrgentesOtro: z.string().optional(),
  serviciosMejorar: z.array(z.string()).min(1, "Debe seleccionar al menos un servicio").max(2, "Máximo 2 opciones"),
  serviciosMejorarOtro: z.string().optional(),
  espacioMejorar: z.string().optional(),
  propuesta: z.string().optional(),
  quiereContacto: z.boolean(),
  nombreCompleto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal(""))
})

export type CreateEncuestaSchema = z.infer<typeof createEncuestaSchema>

// Schema para actualizar encuesta (futuro)
export const updateEncuestaSchema = createEncuestaSchema.partial().extend({
  id: z.number()
})

export type UpdateEncuestaSchema = z.infer<typeof updateEncuestaSchema>