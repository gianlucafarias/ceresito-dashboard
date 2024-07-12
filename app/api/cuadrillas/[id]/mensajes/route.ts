import {  NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = {
    id: any
  }

export async function GET(context: { params: Params }) {
  const { id } = context.params;
  const cuadrillaId = parseInt(id, 10);

  if (isNaN(cuadrillaId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid cuadrillaId' }), { status: 400 });
  }

  try {
    const mensajes = await prisma.mensaje.findMany({
      where: {
        cuadrillaId: cuadrillaId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    return new NextResponse(JSON.stringify(mensajes), { status: 200 });
  } catch (error) {
    console.error('Error al obtener los mensajes:', error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener los mensajes' }), { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Params }) {
  const { id } = context.params;
  const cuadrillaId = parseInt(id, 10);
  const { contenido, remitente } = await request.json();

  if (isNaN(cuadrillaId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid cuadrillaId' }), { status: 400 });
  }

  try {
    const nuevoMensaje = await prisma.mensaje.create({
      data: {
        contenido,
        remitente,
        cuadrillaId: cuadrillaId,
        leido: false,
      },
    });
    return new NextResponse(JSON.stringify(nuevoMensaje), { status: 201 });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return new NextResponse(JSON.stringify({ error: 'Error al enviar el mensaje' }), { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Params }) {
  const { id } = context.params;
  const cuadrillaId = parseInt(id, 10);

  if (isNaN(cuadrillaId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid cuadrillaId' }), { status: 400 });
  }

  try {
    await prisma.mensaje.updateMany({
      where: {
        cuadrillaId: cuadrillaId,
      },
      data: {
        leido: true,
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al marcar los mensajes como leídos:', error);
    return new NextResponse(JSON.stringify({ error: 'Error al marcar los mensajes como leídos' }), { status: 500 });
  }
}
