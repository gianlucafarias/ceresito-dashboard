import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import type { GetEncuestasSchema } from "./validations"
import type { EncuestasResponse, EstadisticasEncuestas } from "@/types"

// Sin caché para datos que deben ser instantáneos
const CACHE_TIME = 0 // Sin caché - datos frescos siempre

export async function getEncuestas(input: GetEncuestasSchema) {
  // Solo desactivamos el caché si se solicita explícitamente
  if (input.no_cache) {
    noStore()
  }
  
  const { page, per_page, sort, barrio, estado, desde, hasta, search } = input

  try {
    const fromDay = desde ? new Date(desde).toISOString() : undefined
    const toDay = hasta ? new Date(hasta).toISOString() : undefined

    // Construir la URL base de la API con los parámetros de paginación
    let apiUrl = `https://api.ceres.gob.ar/api/api/encuestaobras/todas?page=${page}&per_page=${per_page}`

    // Si no se especifica un orden, el backend aplicará el orden por defecto (ID descendente)
    if (sort) {
      const [column, order] = sort.split(".")
      apiUrl += `&sort=${column}&order=${order}`
    }

    // Parámetros de búsqueda
    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`
    }
    
    // Filtro de barrio - NUEVO: usar el parámetro del backend
    if (barrio && barrio !== "todos") {
      apiUrl += `&barrio=${encodeURIComponent(barrio)}`
    }
    
    // Filtro de estado
    if (estado) {
      apiUrl += `&estado=${encodeURIComponent(estado)}`
    }
    
    // Fechas
    if (fromDay) apiUrl += `&desde=${fromDay}`
    if (toDay) apiUrl += `&hasta=${toDay}`

    // Sin caché para datos de tabla - deben ser instantáneos
    const fetchOptions: RequestInit = {
      cache: 'no-store' // Siempre datos frescos
    }

    const response = await fetch(apiUrl, fetchOptions)
    if (!response.ok) {
      throw new Error("Error al obtener las encuestas de la API externa")
    }

    const result: EncuestasResponse = await response.json()
    
    if (!result.success) {
      throw new Error("La API devolvió un error")
    }

    const { encuestas, total, page: currentPage, totalPages } = result.data
    
    // Calcular pageCount basándose en el total real, no en totalPages del backend
    // Esto asegura que siempre tengamos la paginación correcta
    const calculatedPageCount = Math.ceil(total / per_page)
    const pageCount = Math.max(calculatedPageCount, 1) // Mínimo 1 página
    
    console.log("📊 Paginación calculada (queries):", {
      total,
      per_page,
      calculatedPageCount,
      backendTotalPages: totalPages,
      finalPageCount: pageCount
    })
    
    return { 
      data: encuestas, 
      pageCount: pageCount,
      total: total 
    }
  } catch (err) {
    console.error("Error al obtener encuestas:", err)
    throw new Error("Error al obtener las encuestas de la API externa")
  }
}

export async function getEstadisticasEncuestas(barrio?: string) {
  try {
    // Sin caché para estadísticas - deben reflejar nuevas encuestas inmediatamente
    const fetchOptions: RequestInit = {
      cache: 'no-store' // Siempre datos frescos
    }

    // Construir URL con filtro de barrio si se especifica
    let apiUrl = "https://api.ceres.gob.ar/api/api/encuestaobras/estadisticas"
    if (barrio && barrio !== "todos") {
      apiUrl += `?barrio=${encodeURIComponent(barrio)}`
    }

    const response = await fetch(apiUrl, fetchOptions)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de respuesta:", errorText)
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Adaptar los datos al formato esperado por los componentes
    if (result.success && result.data) {
      const apiData = result.data
      
      // Mapear los campos a los nombres esperados
      const mappedData = {
        totalEncuestas: apiData.totalEncuestas || 0,
        totalBarrios: apiData.porBarrio ? apiData.porBarrio.length : 0,
        // Mapear porBarrio: cambiar 'barrio' a 'nombre' y convertir cantidad a number
        encuestasPorBarrio: (apiData.porBarrio || []).map((item: any) => ({
          nombre: item.barrio || 'Sin nombre',
          cantidad: parseInt(item.cantidad) || 0
        })),
        // Mapear obrasMasVotadas: cambiar 'obra' a 'nombre'
        obrasUrgentesTop: (apiData.obrasMasVotadas || []).map((item: any) => ({
          nombre: item.obra || 'Sin nombre',
          cantidad: item.cantidad || 0
        })),
        // Mapear serviciosMasVotados: cambiar 'servicio' a 'nombre'
        serviciosMejorarTop: (apiData.serviciosMasVotados || []).map((item: any) => ({
          nombre: item.servicio || 'Sin nombre',
          cantidad: item.cantidad || 0
        })),
        // Mapear datos de contacto desde la API
        participacionContacto: {
          quieren: apiData.contacto?.personasDejaronContacto || 0,
          noQuieren: (apiData.totalEncuestas || 0) - (apiData.contacto?.personasDejaronContacto || 0)
        },
        // Mapear comentarios otros
        otrosComentarios: {
          obrasUrgentesOtro: apiData.otrosComentarios?.obrasUrgentesOtro || [],
          serviciosMejorarOtro: apiData.otrosComentarios?.serviciosMejorarOtro || [],
          espaciosYPropuestas: {
            espacioMejorar: apiData.otrosComentarios?.espaciosYPropuestas?.espacioMejorar || [],
            propuestas: apiData.otrosComentarios?.espaciosYPropuestas?.propuestas || []
          }
        },
        ultimasEncuestas: [] // TODO: Obtener las últimas encuestas
      }
      
      return mappedData
    } else {
      // Si no hay success, intentar usar los datos directamente
      console.warn("API no devuelve 'success: true', usando datos directamente")
      return result
    }
    
  } catch (err) {
    console.error("Error al obtener estadísticas de encuestas:", err)
    
    // Devolver datos por defecto para evitar que la app se rompa
    return {
      totalEncuestas: 0,
      totalBarrios: 0,
      encuestasPorBarrio: [],
      obrasUrgentesTop: [],
      serviciosMejorarTop: [],
      participacionContacto: { quieren: 0, noQuieren: 0 },
      ultimasEncuestas: []
    }
  }
}

// Query específica para obtener una encuesta por ID (futuro)
export async function getEncuestaById(id: number) {
  try {
    const fetchOptions: RequestInit = {
      cache: 'no-store' // Datos específicos deben ser frescos
    }

    const response = await fetch(`https://api.ceres.gob.ar/api/api/encuestaobras/${id}`, fetchOptions)
    if (!response.ok) {
      throw new Error("Error al obtener la encuesta de la API")
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error("La API devolvió un error al obtener la encuesta")
    }

    return result.data
  } catch (err) {
    console.error("Error al obtener encuesta por ID:", err)
    throw new Error("Error al obtener la encuesta de la API")
  }
}

// Query para obtener datos de Redis (cache de estadísticas)
export async function getEstadisticasRedis() {
  try {
    const fetchOptions: RequestInit = {
      next: {
        revalidate: 5 // Redis puede tener un cache muy corto
      }
    }

    const response = await fetch("https://api.ceres.gob.ar/api/api/encuestaobras/estadisticas-redis", fetchOptions)
    if (!response.ok) {
      throw new Error("Error al obtener las estadísticas de Redis")
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error("La API devolvió un error al obtener estadísticas de Redis")
    }

    return result.data
  } catch (err) {
    console.error("Error al obtener estadísticas de Redis:", err)
    // En caso de error con Redis, devolver null para usar datos directos
    return null
  }
}