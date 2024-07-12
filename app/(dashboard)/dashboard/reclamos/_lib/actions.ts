"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { getErrorMessage } from "@/lib/handle-error"
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations"

// Función para crear una nueva tarea en la API externa
export async function createTask(input: CreateTaskSchema) {
  noStore()
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamos/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reclamo: input.reclamo,
        nombre: input.nombre,
        telefono: input.telefono,
        detalle: input.detalle,
        ubicacion: input.ubicacion,
        barrio: input.barrio,
        estado: input.estado,
        prioridad: input.prioridad,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al crear el reclamo en la API externa")
    }

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

// Función para actualizar una tarea existente en la API externa
export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  noStore();
  try {
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${input.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reclamo: input.reclamo,
        nombre: input.nombre,
        telefono: input.telefono,
        detalle: input.detalle,
        ubicacion: input.ubicacion,
        barrio: input.barrio,
        estado: input.estado,
        prioridad: input.prioridad,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); 
      throw new Error(`Error al actualizar el reclamo: ${errorText}`);
    }

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTasks(input: {
  ids: string[]
  estado?: string
  prioridad?: string
}) {
  noStore()
  try {
    await Promise.all(
      input.ids.map(async (id) => {
        const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: input.estado,
            prioridad: input.prioridad,
          }),
        })

        if (!response.ok) {
          throw new Error(`Error al actualizar el reclamo con id ${id} en la API externa`)
        }
      })
    )

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}


export async function updateReclamoEstado(id: string, estado: number) {
  noStore();
  try {
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado }),
    });

    const responseText = await response.text(); 
  

    if (!response.ok) {
      throw new Error(`Error al actualizar el estado del reclamo: ${responseText}`);
    }

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error(`Error updating estado: ${getErrorMessage(err)}`);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}


export async function deleteTask(input: { id: string }) {
  try {
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${input.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al eliminar el reclamo en la API externa")
    }

    revalidatePath("/")
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteTasks(input: { ids: string[] }) {
  try {
    await Promise.all(
      input.ids.map(async (id) => {
        const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Error al eliminar el reclamo con id ${id} en la API externa`)
        }
      })
    )

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}
