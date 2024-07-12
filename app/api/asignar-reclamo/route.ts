import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { reclamoId, cuadrillaId, reclamoDetalles } = await request.json();


    if (!reclamoId) {
      console.error('reclamoId es nulo o indefinido');
      return NextResponse.json({ error: 'reclamoId no puede ser nulo o indefinido' }, { status: 400 });
    }

    const cuadrilla = await prisma.cuadrilla.findUnique({
      where: { id: parseInt(cuadrillaId, 10) },
      include: { RegistroReclamo: true }
    });

    if (!cuadrilla) {
      console.error('Cuadrilla no encontrada:', cuadrillaId);
      return NextResponse.json({ error: 'Cuadrilla no encontrada' }, { status: 404 });
    }

    const reclamosActuales = cuadrilla.RegistroReclamo.filter(
      (reclamo) => reclamo.estado !== 'SOLUCIONADO'
    ).length;

    if (reclamosActuales >= cuadrilla.limiteReclamosSimultaneos) {
      console.error('La cuadrilla ha alcanzado su límite de reclamos simultáneos y no puede aceptar el reclamo.');
      return NextResponse.json(
        { error: 'La cuadrilla ha alcanzado su límite de reclamos simultaneos y no puede aceptar el reclamo.' },
        { status: 400 }
      );
    }

    const nuevoRegistroReclamo = await prisma.registroReclamo.create({
      data: {
        cuadrillaId: parseInt(cuadrillaId, 10),
        reclamoId: parseInt(reclamoId, 10),
        reclamo: reclamoDetalles.reclamo,
        fecha: new Date(reclamoDetalles.fecha),
        estado: 'ASIGNADO',
        prioridad: reclamoDetalles.prioridad,
        detalle: reclamoDetalles.detalle,
        direccion: reclamoDetalles.ubicacion,
        barrio: reclamoDetalles.barrio,
      }
    });

    const nuevaDisponibilidad = reclamosActuales + 1 < cuadrilla.limiteReclamosSimultaneos;

    const updatedCuadrilla = await prisma.cuadrilla.update({
      where: { id: parseInt(cuadrillaId, 10) },
      data: {
        disponible: nuevaDisponibilidad,
        ultimaAsignacion: new Date(),
        reclamosAsignados: {
          push: parseInt(reclamoId, 10)
        }
      },
      include: { RegistroReclamo: true }
    });

    // Actualizar el reclamo en la API externa
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${reclamoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'ASIGNADO', cuadrillaid: cuadrillaId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al actualizar el estado del reclamo en la API externa:', errorText);
      return NextResponse.json({ error: 'Error al actualizar el estado del reclamo en la API externa' }, { status: 500 });
    }


    await prisma.mensaje.create({
      data: {
        contenido: `Reclamo #${reclamoId} ha sido asignado a la cuadrilla.`,
        remitente: 'Sistema',
        cuadrillaId: parseInt(cuadrillaId, 10),
      },
    });

    return NextResponse.json({ 
      message: 'Reclamo asignado y registrado correctamente', 
      updatedCuadrilla,
      nuevoRegistroReclamo
    });
  } catch (error) {
    console.error('Error al asignar el reclamo a la cuadrilla:', error);
    return NextResponse.json({ error: 'Error al asignar el reclamo a la cuadrilla' }, { status: 500 });
  }
}
