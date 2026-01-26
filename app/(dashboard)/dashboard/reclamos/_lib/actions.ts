"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { getErrorMessage } from "@/lib/handle-error"
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations"

// Función para crear una nueva tarea en la API externa
export async function createTask(input: CreateTaskSchema) {
  noStore()
  try {
    const response = await fetch("https://api.ceres.gob.ar/api/api/reclamo/crear", {
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
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${input.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
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
        const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${id}`, {
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


export async function updateReclamoEstado(id: string, estado: string, notificar: boolean = true) {
  noStore();
  try {
    // Primero obtenemos los datos del reclamo para tener el teléfono del usuario y otros detalles
    const reclamoResponse = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!reclamoResponse.ok) {
      throw new Error(`Error al obtener los datos del reclamo: ${await reclamoResponse.text()}`);
    }

    const reclamoData = await reclamoResponse.json();
    
    // Actualizamos el estado del reclamo
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${id}`, {
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

    // Intentamos enviar la notificación siempre que el usuario tenga un teléfono
    if (reclamoData.telefono) {
      // Seleccionar el template según el estado
      let templateName = "";
      
      // Fecha actual formateada para Argentina
      const fechaActual = new Date().toLocaleDateString('es-AR');
      // Nombre del usuario que realizó el reclamo
      const nombreUsuario = reclamoData.nombre || "Usuario";
      
      // Asegurarnos que el número de teléfono tenga el formato correcto (agregando 54 al inicio si es necesario)
      let phoneNumber = reclamoData.telefono;
      if (phoneNumber.startsWith("+")) {
        phoneNumber = phoneNumber.substring(1); // Removemos el + si existe
      }
      if (!phoneNumber.startsWith("54")) {
        phoneNumber = "54" + phoneNumber; // Añadimos el código de país si no lo tiene
      }
      
      // Usar solo las plantillas disponibles: r_asignado y r_completado
      switch (estado) {
        case "PENDIENTE":
          templateName = "r_asignado";
          break;
        case "ASIGNADO":
          templateName = "r_asignado";
          break;
        case "EN_PROCESO":
          templateName = "r_asignado";
          break;
        case "COMPLETADO":
          templateName = "r_completado";
          break;
        default:
          templateName = "r_asignado";
      }

      // Componentes en el formato exacto requerido
      const components = [
        {
          "type": "HEADER",
          "parameters": [
            {
              "type": "text",
              "text": reclamoData.id.toString()
            }
          ]
        },
        {
          "type": "BODY",
          "parameters": [
            {
              "type": "text",
              "text": nombreUsuario
            },
            {
              "type": "text",
              "text": fechaActual
            }
          ]
        }
      ];
      
      
      // Llamar al endpoint de notificación
      try {
        const notificationPayload = {
          number: phoneNumber,
          template: templateName,
          languageCode: "es_AR",
          components: components
        };
        
        
        const notificationResponse = await fetch("https://api.ceres.gob.ar/v1/template", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(notificationPayload),
        });

        
        if (!notificationResponse.ok) {
          const errorText = await notificationResponse.text();
          console.error(`Error al enviar notificación: ${errorText}`);
        } 
      } catch (notifyError) {
        console.error("Error al enviar la notificación:", notifyError);
        // No interrumpimos el flujo si falla la notificación
      }
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
  noStore()
  try {
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${input.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al eliminar el reclamo en la API externa")
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

export async function deleteTasks(input: { ids: string[] }) {
  noStore()
  try {
    await Promise.all(
      input.ids.map(async (id) => {
        const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamo/${id}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          throw new Error(`Error al eliminar el reclamo con id ${id}`)
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
