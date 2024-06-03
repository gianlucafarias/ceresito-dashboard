import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Obtener la URL y extraer el ID del tipo de los parámetros
    const url = new URL(request.url);
    const tipoId = url.pathname.split('/').pop(); // Extraer el ID del tipo de la URL

    if (!tipoId) {
      return NextResponse.json({ error: 'ID del tipo no proporcionado' }, { status: 400 });
    }

    // Buscar las cuadrillas que tienen el tipo especificado
    const cuadrillas = await prisma.cuadrilla.findMany({
      where: {
        tipo: {
          some: {
            id: Number(tipoId)
          }
        }
      },
      include: { tipo: true }, // Incluir los tipos asociados si es necesario
    });

    if (cuadrillas.length === 0) {
      return NextResponse.json({ error: 'No se encuentran cuadrillas para este tipo' }, { status: 404 });
    }

    return NextResponse.json(cuadrillas);
  } catch (error) {
    console.error('Error al buscar las cuadrillas:', error);
    return NextResponse.json({ error: 'Error al buscar las cuadrillas' }, { status: 500 });
  }
}