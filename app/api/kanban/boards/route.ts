import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const newBoard = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          name: name.trim(),
          ownerId: userId,
        },
      });

      await tx.boardMembership.create({
        data: {
          userId: userId,
          boardId: board.id,
        },
      });

      return board;
    });

    return NextResponse.json(newBoard, { status: 201 });

  } catch (error) {
    console.error('Error creating board:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to create board', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

// Función GET para obtener los tableros del usuario
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Buscar los tableros donde el usuario es miembro
    const boards = await prisma.board.findMany({
      where: {
        memberships: {
          some: {
            userId: userId,
          },
        },
      },
      // Opcional: Ordenar los tableros, por ejemplo por fecha de creación
      orderBy: {
        createdAt: 'desc',
      },
      // Opcional: Incluir el propietario o el número de miembros/tareas si es necesario
      // include: {
      //   owner: {
      //     select: { id: true, username: true, email: true } // Seleccionar solo campos necesarios
      //   },
      //   _count: { // Contar relaciones
      //     select: { members: true, tasks: true }
      //   }
      // }
    });

    return NextResponse.json(boards);

  } catch (error) {
    console.error('Error fetching boards:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch boards', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
