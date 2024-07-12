import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const cuadrillaId = searchParams.get('cuadrillaId');

    const whereCondition = cuadrillaId
      ? { cuadrillaId: parseInt(cuadrillaId, 10) }
      : {};

    const reclamos = await prisma.registroReclamo.findMany({
      where: whereCondition,
      orderBy: {
        fecha: 'desc',
      },
    });

    return NextResponse.json(reclamos);
  } catch (error) {
    console.error('Error al obtener los registros de reclamo:', error);
    return NextResponse.json({ error: 'Error al obtener los registros de reclamo' }, { status: 500 });
  }
}