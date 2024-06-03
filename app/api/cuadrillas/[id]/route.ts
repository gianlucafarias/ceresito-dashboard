import prisma from '@/lib/prisma';
import {NextResponse} from 'next/server'

export async function GET(request: Request) {
    try {
        // Obtener la cuadrilla por ID
        const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Extraer el ID de la URL
        const cuadrilla = await prisma.cuadrilla.findUnique({
          where: { id: Number(id) },
          include: { tipo: true }, // Incluir los tipos asociados si es necesario
        });

        if (!cuadrilla) {
            return NextResponse.json({ error: 'No se encuentra la cuadrilla' }, { status: 404 });
        }

        return NextResponse.json(cuadrilla);
      } catch (error) {
        return NextResponse.json({ error: 'Error al buscar la cuadrilla' }, { status: 500 });
    }
  }
  

  export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const cuadrillaId = params.id;
    const data = await request.json();
  
    const updateData: { [key: string]: any } = {};
  
    // Solo agregamos los campos que están presentes en la solicitud
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.limiteReclamosSimultaneos !== undefined) updateData.limiteReclamosSimultaneos = data.limiteReclamosSimultaneos;
    if (data.tipos !== undefined) {
      updateData.tipo = {
        set: data.tipos.map((id: string) => ({ id })),
      };
    }
  
    try {
      const updatedCuadrilla = await prisma.cuadrilla.update({
        where: { id: Number(cuadrillaId) },
        data: updateData,
        include: {
          tipo: true, // Para incluir los tipos de cuadrilla actualizados
        },
      });
      return NextResponse.json(updatedCuadrilla);
    } catch (error) {
      console.error('Error al actualizar la cuadrilla:', error);
      return NextResponse.json({ error: 'Error al actualizar la cuadrilla' }, { status: 500 });
    }
  }
