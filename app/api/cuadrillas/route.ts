import prisma from '@/lib/prisma';
import {NextResponse} from 'next/server'

export async function GET(request: Request) {
    try {
      const cuadrillas = await prisma.cuadrilla.findMany({
        include: { tipo: true }, 
      });
      return NextResponse.json(cuadrillas);
    } catch (error) {
      console.error('Error al obtener las cuadrillas:', error);
      return NextResponse.json({ error: 'Error al obtener las cuadrillas' }, { status: 500 });
    }
  }

export async function DELETE(request: Request) {
    const { id } = await request.json();
    try {
      await prisma.cuadrilla.delete({
        where: { id },
      });
      return NextResponse.json({ message: 'Cuadrilla eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar la cuadrilla:', error);
      return NextResponse.json({ error: 'Error al eliminar la cuadrilla' }, { status: 500 });
    }
  }