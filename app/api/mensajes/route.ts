import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma';

export default async function POST(request: Request) {
    const { cuadrillaId, contenido, remitente } = await request.json();
    
    try {
      const mensaje = await prisma.mensaje.create({
        data: {
          cuadrillaId: parseInt(cuadrillaId),
          contenido,
          remitente,
        },
      });
      return NextResponse.json(mensaje)
    } catch (error) {
      return NextResponse.json({ message: 'Error al enviar el mensajer' }, { status: 500 });

    }
  
}