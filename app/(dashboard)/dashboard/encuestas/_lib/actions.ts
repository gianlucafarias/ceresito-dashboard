"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getErrorMessage } from "@/lib/handle-error"
import type { UpdateEncuestaSchema } from "./validations"
import type { EncuestaVecinal } from "@/types"

function resolveInternalOrigin() {
  try {
    const requestHeaders = headers()
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http")

    if (host) {
      return `${protocol}://${host}`
    }
  } catch {
    // Fallback for contexts without request headers
  }

  return "http://localhost:3000"
}
// Función para obtener una respuesta específica de encuesta
export async function getEncuestaById(id: number) {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/encuestaobras/respuesta/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener la encuesta de la API")
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error("Error en la respuesta de la API")
    }

    return {
      data: result.data as EncuestaVecinal,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

// Función para actualizar una encuesta
export async function updateEncuesta(input: UpdateEncuestaSchema) {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/encuestaobras/editar/${input.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input,
        id: undefined, // Remover id del body
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar la encuesta en la API")
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error("Error en la respuesta de la API")
    }

    revalidatePath("/dashboard/encuestas")

    return {
      data: result.data,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

// Función para eliminar una encuesta
export async function deleteEncuesta(id: number) {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/encuestaobras/eliminar/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al eliminar la encuesta de la API")
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error("Error en la respuesta de la API")
    }

    revalidatePath("/dashboard/encuestas")

    return {
      data: result.data,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}


