import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2)[0]; // Extraer el ID desde la URL correctamente

    if (!id) {
      throw new Error('No se proporcionó un ID válido');
    }

    const { estado, notificar = false } = await request.json();

    // Actualizar el estado en RegistroReclamo
    const updatedReclamo = await prisma.registroReclamo.update({
      where: { id: parseInt(id, 10) },
      data: {
        estado: estado,
        fechaSolucion: new Date()
      }
    });

    // Obtener el reclamoId y cuadrillaId para actualizar la cuadrilla y la API externa
    const { reclamoId, cuadrillaId } = updatedReclamo;

    // Obtener los reclamos asignados actuales y el límite de reclamos simultáneos de la cuadrilla
    const cuadrilla = await prisma.cuadrilla.findUnique({
      where: { id: cuadrillaId },
      select: { reclamosAsignados: true, limiteReclamosSimultaneos: true }
    });

    if (!cuadrilla) {
      throw new Error('Cuadrilla no encontrada');
    }

    // Actualizar el estado del reclamo en la API externa
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${reclamoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'COMPLETADO' }),
    });

    // Si se solicitó notificar al usuario
    if (notificar) {
      try {
        // Obtener los detalles completos del reclamo incluyendo el número de teléfono
        const reclamoResponse = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${reclamoId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (reclamoResponse.ok) {
          const reclamoData = await reclamoResponse.json();
          
          if (reclamoData.telefono) {
            // Fecha actual formateada para Argentina
            const fechaActual = new Date().toLocaleDateString('es_AR');
            // Nombre del usuario que realizó el reclamo
            const nombreUsuario = reclamoData.nombre || "Usuario";
            
            // Asegurarnos que el número de teléfono tenga el formato correcto
            let phoneNumber = reclamoData.telefono;
            if (phoneNumber.startsWith("+")) {
              phoneNumber = phoneNumber.substring(1); // Removemos el + si existe
            }
            if (!phoneNumber.startsWith("54")) {
              phoneNumber = "54" + phoneNumber; // Añadimos el código de país si no lo tiene
            }
            
            // Preparar plantilla y componentes para WhatsApp
            const templateName = "r_completado";
            const components = [
              {
                "type": "HEADER",
                "parameters": [
                  {
                    "type": "text",
                    "text": reclamoId.toString()
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

            // Payload completo para la notificación
            const notificationPayload = {
              number: phoneNumber,
              template: templateName,
              languageCode: "es_AR",
              components: components
            };
            
            console.log("Enviando notificación:", JSON.stringify(notificationPayload, null, 2));

            // Llamar al endpoint de notificación
            const notificationResponse = await fetch("https://api.ceres.gob.ar/v1/template", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(notificationPayload),
            });
            
            console.log("Respuesta de notificación status:", notificationResponse.status);

            if (!notificationResponse.ok) {
              const errorText = await notificationResponse.text();
              console.error(`Error al enviar notificación: ${errorText}`);
            } else {
              console.log("Notificación enviada correctamente");
            }
          }
        }
      } catch (notifyError) {
        console.error("Error al enviar la notificación:", notifyError);
        // No interrumpimos el flujo si falla la notificación
      }
    }

    if (response.ok) {
      return NextResponse.json({ message: 'Reclamo completado correctamente', updatedReclamo });
    } else {
      const errorResponse = await response.json();
      console.error('Error al actualizar el estado del reclamo en la API externa:', errorResponse);
      return NextResponse.json({ error: 'Error al actualizar el estado del reclamo en la API externa' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al completar el reclamo:', error);
    return NextResponse.json({ error: 'Error al completar el reclamo' }, { status: 500 });
  }
}
