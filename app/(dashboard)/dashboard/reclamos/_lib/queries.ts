import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import type { GetTasksSchema } from "./validations"

export async function getTasks(input: GetTasksSchema) {
  noStore()
  const { page, per_page, sort, detalle, estado, prioridad, operator, from, to } =
    input

  try {
 

    const fromDay = from ? new Date(from).toISOString() : undefined
    const toDay = to ? new Date(to).toISOString() : undefined

    let apiUrl = `https://api.ceres.gob.ar/api/api/reclamos?page=${page}&per_page=${per_page}`

    if (sort) {
      const [column, order] = sort.split(".")
      apiUrl += `&sort=${column}&order=${order}`
    }

    if (detalle) apiUrl += `&title=${detalle}`
    if (estado) apiUrl += `&status=${estado}`
    if (prioridad) apiUrl += `&priority=${prioridad}`
    if (fromDay) apiUrl += `&from=${fromDay}`
    if (toDay) apiUrl += `&to=${toDay}`
    if (operator) apiUrl += `&operator=${operator}`

    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error("Error al obtener los reclamos de la API externa")
    }

    const { data, total } = await response.json()

    const pageCount = Math.ceil(total / per_page)
    return { data, pageCount }
  } catch (err) {
    return { data: [], pageCount: 0 }
  }
}


export async function getTaskCountByStatus() {
  noStore()
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamos/count-by-status")
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por estado")
    }
    return await response.json()
  } catch (err) {
    return []
  }
}

export async function getTaskCountByPriority() {
  noStore()
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamos/count-by-priority")
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por prioridad")
    }
    return await response.json()
  } catch (err) {
    return []
  }
}
