import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2)[0]; // Extraer el ID desde la URL correctamente

    if (!id) {
      throw new Error('No se proporcionó un ID válido');
    }

    const { estado } = await request.json();

    // Actualizar el estado en RegistroReclamo
    const updatedReclamo = await prisma.registroReclamo.update({
      where: { id: parseInt(id, 10) },
      data: {
        estado: estado,
        fechaSolucion: new Date()
      }
    });

    console.log('Updated RegistroReclamo:', updatedReclamo);

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

    // Filtrar los reclamos asignados para eliminar el reclamo completado
    const updatedReclamosAsignados = cuadrilla.reclamosAsignados.filter(r => r !== reclamoId);

    // Actualizar la cuadrilla con los nuevos reclamos asignados y el estado de disponibilidad
    const updatedCuadrilla = await prisma.cuadrilla.update({
      where: { id: cuadrillaId },
      data: {
        reclamosAsignados: { set: updatedReclamosAsignados },
        disponible: updatedReclamosAsignados.length < cuadrilla.limiteReclamosSimultaneos // Establecer disponible si hay menos reclamos que el límite
      }
    });

    console.log('Updated Cuadrilla:', updatedCuadrilla);

    // Actualizar el estado del reclamo en la API externa
    const response = await fetch(`https://api.ceres.gob.ar/api/api/reclamos/${reclamoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'COMPLETADO' }),
    });

    if (response.ok) {
      console.log('External API response:', await response.json());
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
