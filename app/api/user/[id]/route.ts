import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handler for PATCH requests to update a user by ID (specifically roleId for now)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } // Destructure params to get the user ID
) {
  let numberRoleId: number | undefined; // Declare here
  try {
    const { id } = params; // The user ID from the URL (e.g., '4')
    const { roleId } = await request.json(); // Get the new roleId from the request body

    // Validate roleId
    if (roleId === undefined || roleId === null) {
      return NextResponse.json({ message: 'roleId is required in the request body' }, { status: 400 });
    }

    // Validate and parse the user ID from the URL
    const numberUserId = parseInt(id, 10);
    if (isNaN(numberUserId)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Validate and parse roleId (assuming it should be a number)
    numberRoleId = parseInt(roleId, 10); // Assign value inside try
     if (isNaN(numberRoleId)) {
       return NextResponse.json({ message: 'Invalid roleId format, expected a number' }, { status: 400 });
     }

    // Update the user's roleId in the database
    const updatedUser = await prisma.user.update({
      where: {
        id: numberUserId, // Find user by their ID
      },
      data: {
        roleId: numberRoleId, // Update the roleId field
      },
       include: { // Optionally include the updated role info in the response
         role: true, 
       },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error('Error updating user role:', error);
    
    // Handle specific Prisma error for record not found
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
     // Handle foreign key constraint error (if roleId doesn't exist in roles table)
     if (error.code === 'P2003') {
         // Now numberRoleId should be accessible (if parsing succeeded before error)
         // Use numberRoleId if available, otherwise fallback to original roleId from request json if needed
        return NextResponse.json({ message: `Role with ID ${numberRoleId ?? '(unknown)'} does not exist.` }, { status: 400 }); 
    }

    return NextResponse.json({ message: 'Error updating user role' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// You could add GET (by ID) or DELETE handlers for users here as well
// export async function GET(request: NextRequest, { params }: { params: { id: string } }) { ... }
// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { ... } 