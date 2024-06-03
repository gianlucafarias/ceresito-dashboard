import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma';


export async function POST(request: Request) {
    const {nombre} = await request.json();
    const newTipoReclamo = await prisma.tipoReclamo.create({
         data: {
             nombre,
         },
    });
    
    return NextResponse.json(newTipoReclamo)
 }

 export async function GET() {
    const obtenerTipoReclamo = await prisma.tipoReclamo.findMany();
    return NextResponse.json(obtenerTipoReclamo)
 }

 export async function DELETE(request: Request) {
    try {
      const { id } = await request.json();
      const deleteById = await prisma.tipoReclamo.delete({
        where: {
          id: Number(id),
        },
      });
      return NextResponse.json({ deleteById });
    } catch (error) {
      console.error('Error al eliminar el tipo de reclamo:', error);
      return NextResponse.error();
    }
  }

