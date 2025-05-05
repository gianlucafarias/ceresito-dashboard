import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handler for PATCH requests to update a TipoReclamo by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } 
) {
  let numberId: number | undefined;
  try {
    const { id } = params; 
    const { nombre } = await request.json(); 

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json({ message: 'Nombre is required and must be at least 2 characters long' }, { status: 400 });
    }

    numberId = parseInt(id, 10);
    if (isNaN(numberId)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const updatedTipoReclamo = await prisma.tipoReclamo.update({
      where: { id: numberId },
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(updatedTipoReclamo, { status: 200 });

  } catch (error: any) {
    console.error('Error updating TipoReclamo:', error);
    
    if (error.code === 'P2025') { // Prisma code for Record to update not found.
        return NextResponse.json({ message: `TipoReclamo with ID ${numberId ?? params.id} not found` }, { status: 404 });
    }
    
    // Handle potential unique constraint violation if name must be unique
    if (error.code === 'P2002') {
         const body = await request.json().catch(() => ({ nombre: 'unknown' })); // Try to get name again for error message
         return NextResponse.json({ message: `TipoReclamo name '${body.nombre}' already exists.` }, { status: 409 }); // 409 Conflict
    }


    return NextResponse.json({ message: 'Error updating TipoReclamo' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// It's good practice to also move the DELETE logic here
export async function DELETE(
  request: NextRequest, // DELETE might not use request body, but it's good practice to include
  { params }: { params: { id: string } } 
) {
    let numberId: number | undefined;
    try {
        const { id } = params;
        numberId = parseInt(id, 10);
        if (isNaN(numberId)) {
            return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
        }

        await prisma.tipoReclamo.delete({
            where: { id: numberId },
        });

        return NextResponse.json({ message: 'TipoReclamo deleted successfully' }, { status: 200 }); // Or 204 No Content

    } catch (error: any) {
        console.error('Error deleting TipoReclamo:', error);
        if (error.code === 'P2025') { // Record to delete not found.
            return NextResponse.json({ message: `TipoReclamo with ID ${numberId ?? params.id} not found` }, { status: 404 });
        }
        // Handle other potential errors, e.g., foreign key constraints if Tipos are linked elsewhere
         if (error.code === 'P2003') { 
            return NextResponse.json({ message: 'Cannot delete TipoReclamo as it is still referenced elsewhere.' }, { status: 409 }); // Conflict
         }

        return NextResponse.json({ message: 'Error deleting TipoReclamo' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 