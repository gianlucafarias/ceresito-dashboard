import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { nombre, telefono, tipos, limiteReclamosSimultaneos } = await request.json();

    // Crear la nueva cuadrilla
    const nuevaCuadrilla = await prisma.cuadrilla.create({
      data: {
        nombre,
        telefono,
        limiteReclamosSimultaneos,
        tipo: {
          connect: tipos.map((tipoId: number) => ({ id: tipoId }))
        }
      },
      include: { tipo: true }
    });

    return NextResponse.json(nuevaCuadrilla);
  } catch (error) {
    console.error('Error al crear la cuadrilla:', error);
    return NextResponse.json({ error: 'Error al crear la cuadrilla' }, { status: 500 });
  }
}