// Tipos para las respuestas de la API de encuestas

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface EncuestasData {
  encuestas: EncuestaVecinal[]
  total: number
  page: number
  totalPages: number
}

export interface EstadisticasData {
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
    obrasUrgentesOtro: any[]
    serviciosMejorarOtro: any[]
    espaciosYPropuestas?: {
      espacioMejorar: any[]
      propuestas: any[]
    }
  }
}

export interface EncuestaVecinal {
  id: number
  dni: string
  barrio: string
  obrasUrgentes: string[]
  obrasUrgentesOtro?: string
  serviciosMejorar: string[]
  serviciosMejorarOtro?: string
  espacioMejorar?: string
  propuesta?: string
  quiereContacto: boolean
  nombreCompleto?: string
  telefono?: string
  email?: string
  estado: string
  fechaCreacion: string
  fechaActualizacion: string
}

export interface ComentarioOtro {
  encuestaId: number
  comentario: string
}
