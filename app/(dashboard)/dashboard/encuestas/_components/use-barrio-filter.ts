import { useCallback, useState } from "react"
import { useBarrioFilter } from "./barrio-filter-context"
import { toast } from "sonner"
import type { ApiResponse } from "../_types/api"
import type { EncuestaVecinal, ComentarioOtro } from "@/types" // Import global types

// Define the expected structure for statistics data from the API
interface EstadisticasApiData {
  totalEncuestas: number
  porBarrio: Array<{
    barrio: string
    cantidad: string | number
  }>
  obrasMasVotadas: Array<{
    obra: string
    cantidad: number
  }>
  serviciosMasVotados: Array<{
    servicio: string
    cantidad: number
  }>
  contacto?: {
    personasDejaronContacto: number
  }
  otrosComentarios?: {
    obrasUrgentesOtro: ComentarioOtro[]
    serviciosMejorarOtro: ComentarioOtro[]
    espaciosYPropuestas?: {
      espacioMejorar: ComentarioOtro[]
      propuestas: ComentarioOtro[]
    }
  }
}

export function useBarrioFilterLogic() {
  const { selectedBarrio, isFiltered, setSelectedBarrio } = useBarrioFilter()
  const [isLoading, setIsLoading] = useState(false)

  // Función para obtener los parámetros de filtrado para la API
  const getFilterParams = useCallback(() => {
    if (!isFiltered) {
      return {} // Sin filtros si está seleccionado "Todos los barrios"
    }
    
    return {
      barrio: selectedBarrio,
      // Aquí se pueden agregar más parámetros de filtrado en el futuro
    }
  }, [selectedBarrio, isFiltered])

  // Función para obtener estadísticas filtradas desde la API (client-side)
  const getFilteredStats = useCallback(async (barrio?: string) => {
    try {
      let apiUrl = "/api/core/encuestaobras/estadisticas"
      if (barrio && barrio !== "todos") {
        apiUrl += `?barrio=${encodeURIComponent(barrio)}`
      }


      const response = await fetch(apiUrl, {
        cache: 'no-store'
      })


      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<EstadisticasApiData> = await response.json()

      if (result.success && result.data) {
        const apiData = result.data

        // Validar que los datos requeridos estén presentes
        if (!apiData.obrasMasVotadas || !apiData.serviciosMasVotados) {
          console.warn("⚠️ Datos incompletos de la API:", apiData)
        }

        // Si estamos filtrando por barrio, solo mostrar datos de ese barrio
        if (barrio && barrio !== "todos") {
          
          // El backend puede devolver dos formatos distintos según filtro:
          // - obrasUrgentesTop/serviciosMejorarTop/encuestasPorBarrio (ya mapeados)
          // - obrasMasVotadas/serviciosMasVotados/porBarrio (sin mapear)
          const obrasSource: any[] = (apiData as any).obrasUrgentesTop ?? (apiData as any).obrasMasVotadas ?? []
          const serviciosSource: any[] = (apiData as any).serviciosMejorarTop ?? (apiData as any).serviciosMasVotados ?? []
          const encuestasPorBarrioSource: any[] = (apiData as any).encuestasPorBarrio ?? (apiData as any).porBarrio ?? []

          const filteredStats = {
            totalEncuestas: apiData.totalEncuestas || 0,
            totalBarrios: 1, // Solo un barrio cuando se filtra
            encuestasPorBarrio: encuestasPorBarrioSource.map((item: any) => ({
              nombre: item.nombre ?? item.barrio ?? 'Sin nombre',
              cantidad: typeof item.cantidad === 'string' ? parseInt(item.cantidad) || 0 : item.cantidad || 0
            })),
            obrasUrgentesTop: obrasSource.map((item: any) => ({
              nombre: item.nombre ?? item.obra ?? 'Sin nombre',
              cantidad: item.cantidad || 0
            })), // No filtrar por cantidad > 0 para barrios específicos
            serviciosMejorarTop: serviciosSource.map((item: any) => ({
              nombre: item.nombre ?? item.servicio ?? 'Sin nombre',
              cantidad: item.cantidad || 0
            })), // No filtrar por cantidad > 0 para barrios específicos
            participacionContacto: {
              quieren: (apiData as any).contacto?.personasDejaronContacto || (apiData as any).participacionContacto?.quieren || 0,
              noQuieren: (apiData.totalEncuestas || 0) - ((apiData as any).contacto?.personasDejaronContacto || (apiData as any).participacionContacto?.quieren || 0)
            },
            otrosComentarios: {
              obrasUrgentesOtro: (apiData as any).otrosComentarios?.obrasUrgentesOtro || [],
              serviciosMejorarOtro: (apiData as any).otrosComentarios?.serviciosMejorarOtro || [],
              espaciosYPropuestas: {
                espacioMejorar: (apiData as any).otrosComentarios?.espaciosYPropuestas?.espacioMejorar || [],
                propuestas: (apiData as any).otrosComentarios?.espaciosYPropuestas?.propuestas || []
              }
            },
            ultimasEncuestas: []
          }
          
          return filteredStats
        } else {
          // Si no hay filtro, mostrar datos globales
          
          const globalStats = {
            totalEncuestas: apiData.totalEncuestas || 0,
            totalBarrios: apiData.porBarrio ? apiData.porBarrio.length : 0,
            encuestasPorBarrio: (apiData.porBarrio || []).map((item: any) => ({
              nombre: item.barrio || 'Sin nombre',
              cantidad: typeof item.cantidad === 'string' ? parseInt(item.cantidad) || 0 : item.cantidad || 0
            })),
            obrasUrgentesTop: (apiData.obrasMasVotadas || []).map((item: any) => {
              return {
                nombre: item.obra || 'Sin nombre',
                cantidad: item.cantidad || 0
              }
            }).filter(item => item.cantidad > 0), // Solo obras con votos
            serviciosMejorarTop: (apiData.serviciosMasVotados || []).map((item: any) => {
              return {
                nombre: item.servicio || 'Sin nombre',
                cantidad: item.cantidad || 0
              }
            }).filter(item => item.cantidad > 0), // Solo servicios con votos
            participacionContacto: {
              quieren: apiData.contacto?.personasDejaronContacto || 0,
              noQuieren: (apiData.totalEncuestas || 0) - (apiData.contacto?.personasDejaronContacto || 0)
            },
            otrosComentarios: {
              obrasUrgentesOtro: apiData.otrosComentarios?.obrasUrgentesOtro || [],
              serviciosMejorarOtro: apiData.otrosComentarios?.serviciosMejorarOtro || [],
              espaciosYPropuestas: {
                espacioMejorar: apiData.otrosComentarios?.espaciosYPropuestas?.espacioMejorar || [],
                propuestas: apiData.otrosComentarios?.espaciosYPropuestas?.propuestas || []
              }
            },
            ultimasEncuestas: []
          }
          
          return globalStats
        }
      } else {
        console.error("❌ La API no devolvió datos válidos:", result)
        throw new Error("La API no devolvió datos válidos")
      }
    } catch (error) {
      console.error("💥 Error al obtener estadísticas:", error)
      throw error
    }
  }, [])

  // Función para verificar si los datos deben ser filtrados
  const shouldFilterData = useCallback(() => {
    return isFiltered
  }, [isFiltered])

  // Función para obtener el barrio seleccionado para mostrar en la UI
  const getSelectedBarrioName = useCallback(() => {
    return selectedBarrio === "todos" ? "Todos los barrios" : selectedBarrio
  }, [selectedBarrio])

  // Función para recargar datos filtrados desde la API
  const reloadFilteredData = useCallback(async () => {
    if (!shouldFilterData()) {
      return null
    }

    setIsLoading(true)
    try {
      // Llamar a la API con el filtro de barrio
      const stats = await getFilteredStats(selectedBarrio)
      
      toast.success("Datos filtrados cargados", {
        description: `Mostrando estadísticas del barrio ${selectedBarrio}`,
      })
      
      return stats
    } catch (error) {
      console.error("💥 Error al recargar datos filtrados:", error)
      toast.error("Error al recargar datos filtrados")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [shouldFilterData, selectedBarrio, getFilteredStats])

  // Función para limpiar el filtro (volver a "Todos los barrios")
  const clearFilter = useCallback(async () => {
    try {
      // Recargar estadísticas globales
      const stats = await getFilteredStats()
      setSelectedBarrio("todos")
      
      toast.success("Filtro limpiado", {
        description: "Mostrando todas las estadísticas",
      })
      
      return stats
    } catch (error) {
      toast.error("Error al limpiar filtro", {
        description: "No se pudieron cargar las estadísticas globales",
      })
      return null
    }
  }, [setSelectedBarrio, getFilteredStats])

  return {
    selectedBarrio,
    isFiltered,
    setSelectedBarrio,
    isLoading,
    getSelectedBarrioName,
    getFilterParams,
    shouldFilterData,
    reloadFilteredData,
    clearFilter,
  }
}
