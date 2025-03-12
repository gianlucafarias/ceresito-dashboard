import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

type Params = {
    id: any
  }

export async function PATCH(request: Request, context: { params: Params }) {
  try {
    const { id } = context.params;
    const { estado, notificar = false } = await request.json();

    if (estado !== 'EN_PROCESO') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const updatedReclamo = await prisma.registroReclamo.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'EN_PROCESO',
        fechaAsignacion: new Date(),
      },
    });

    await prisma.mensaje.create({
        data: {
          contenido: `Reclamo #${updatedReclamo.reclamoId} ha sido aceptado y está en proceso.`,
          remitente: 'Cuadrilla',
          cuadrillaId: updatedReclamo.cuadrillaId,
        },
      });

    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${updatedReclamo.reclamoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });

    // Si se solicitó notificar al usuario
    if (notificar) {
      try {
        // Obtener los detalles completos del reclamo incluyendo el número de teléfono
        const reclamoResponse = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${updatedReclamo.reclamoId}`, {
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
            const templateName = "r_asignado";
            const components = [
              {
                "type": "HEADER",
                "parameters": [
                  {
                    "type": "text",
                    "text": updatedReclamo.reclamoId.toString()
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

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al actualizar el estado del reclamo en la API externa' }, { status: 500 });
    }

    return NextResponse.json(updatedReclamo);
  } catch (error) {
    console.error('Error al marcar el reclamo como en proceso:', error);
    return NextResponse.json({ error: 'Error al marcar el reclamo como en proceso' }, { status: 500 });
  }
}
