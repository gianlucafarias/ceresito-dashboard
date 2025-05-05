import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handler for PATCH requests to update a role by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } // Destructure params to get the ID from the URL
) {
  try {
    const { id } = params; // The ID from the URL (e.g., '2')
    const { name } = await request.json(); // Get the new name from the request body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ message: 'Name is required and must be at least 2 characters long' }, { status: 400 });
    }

    const numberId = parseInt(id, 10);
    if (isNaN(numberId)) {
      return NextResponse.json({ message: 'Invalid role ID format' }, { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: {
        id: numberId, // Use the numeric ID here
      },
      data: {
        name: name.trim(), // Update the name
      },
    });

    return NextResponse.json(updatedRole, { status: 200 });

  } catch (error: any) {
    console.error('Error updating role:', error);
    
    // Handle specific Prisma error for record not found
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Error updating role' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// You could also add GET (by ID) or DELETE handlers here later if needed
// export async function GET(request: NextRequest, { params }: { params: { id: string } }) { ... }
// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { ... } 