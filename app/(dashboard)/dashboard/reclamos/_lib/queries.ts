import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import type { GetTasksSchema } from "./validations"

// Constante para el tiempo de caché en segundos
const CACHE_TIME = 60 // 1 minuto

export async function getTasks(input: GetTasksSchema) {
  // Solo desactivamos el caché si se solicita explícitamente
  if (input.no_cache) {
    noStore()
  }
  
  const { page, per_page, sort, estado, prioridad, from, to, search } = input

  try {
    const fromDay = from ? new Date(from).toISOString() : undefined
    const toDay = to ? new Date(to).toISOString() : undefined

    // Construir la URL base de la API con los parámetros de paginación
    let apiUrl = `https://api.ceres.gob.ar/api/api/reclamos?page=${page}&per_page=${per_page}`

    // Si no se especifica un orden, el backend aplicará el orden por defecto (ID descendente)
    if (sort) {
      const [column, order] = sort.split(".")
      apiUrl += `&sort=${column}&order=${order}`
    }

    // Parámetros de búsqueda
    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`
    }
    
    // Filtro de estado
    if (estado) {
      apiUrl += `&estado=${encodeURIComponent(estado)}`
    }
    
    // Filtro de prioridad
    if (prioridad) {
      apiUrl += `&prioridad=${encodeURIComponent(prioridad)}`
    }
    
    // Fechas
    if (fromDay) apiUrl += `&from=${fromDay}`
    if (toDay) apiUrl += `&to=${toDay}`

    console.log("URL API: ", apiUrl); // Log para debugging

    // Opciones de caché para la petición fetch
    const fetchOptions: RequestInit = {
      next: {
        revalidate: input.no_cache ? 0 : CACHE_TIME // Revalidar cada minuto si no se desactiva el caché
      }
    }

    const response = await fetch(apiUrl, fetchOptions)
    if (!response.ok) {
      throw new Error("Error al obtener los reclamos de la API externa")
    }

    const { data, total } = await response.json()
    
    const pageCount = Math.ceil(total / per_page)
    return { data, pageCount }
  } catch (err) {
    console.error("Error al obtener reclamos:", err)
    return { data: [], pageCount: 0 }
  }
}

export async function getTaskCountByStatus() {
  // Usamos caché para esta función ya que no necesita actualizarse tan frecuentemente
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamos/count-by-status", {
      next: { revalidate: CACHE_TIME * 5 } // Revalidar cada 5 minutos
    })
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por estado")
    }
    return await response.json()
  } catch (err) {
    console.error("Error al obtener conteo por estado:", err)
    return []
  }
}

export async function getTaskCountByPriority() {
  // Usamos caché para esta función ya que no necesita actualizarse tan frecuentemente
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamos/count-by-priority", {
      next: { revalidate: CACHE_TIME * 5 } // Revalidar cada 5 minutos
    })
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por prioridad")
    }
    return await response.json()
  } catch (err) {
    console.error("Error al obtener conteo por prioridad:", err)
    return []
  }
}
