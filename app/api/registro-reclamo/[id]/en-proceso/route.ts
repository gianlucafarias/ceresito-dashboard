import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

type Params = {
    id: any
  }

export async function PATCH(request: Request, context: { params: Params }) {
  try {
    const { id } = context.params;
    const { estado } = await request.json();

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

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al actualizar el estado del reclamo en la API externa' }, { status: 500 });
    }

    return NextResponse.json(updatedReclamo);
  } catch (error) {
    console.error('Error al marcar el reclamo como en proceso:', error);
    return NextResponse.json({ error: 'Error al marcar el reclamo como en proceso' }, { status: 500 });
  }
}
