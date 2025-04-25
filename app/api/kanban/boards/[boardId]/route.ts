import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Sigue siendo necesaria para el tipo TransactionClient si se usa

interface RouteParams {
  params: {
    boardId: string;
  };
}

// GET /api/kanban/boards/[boardId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const boardId = parseInt(params.boardId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    if (isNaN(boardId)) {
      return NextResponse.json({ error: 'Invalid board ID format' }, { status: 400 });
    }

    // 1. Verificar si el usuario es miembro del tablero
    const membership = await prisma.boardMembership.findUnique({
      where: {
        userId_boardId: { // Usando el índice único definido en el schema
          userId: userId,
          boardId: boardId,
        },
      },
    });

    if (!membership) {
      // Si no es miembro, no tiene permiso para ver este tablero
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Obtener el tablero y sus tareas (ordenadas)
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
        // Podríamos re-validar la membresía aquí también por seguridad extra
        // memberships: {
        //   some: { userId: userId }
        // }
      },
      include: {
        tasks: { // Incluir las tareas asociadas
          orderBy: {
            order: 'asc', // Ordenar tareas por su campo 'order'
          },
          include: {
            assignee: { // Incluir el usuario asignado
              select: { // Seleccionar solo los campos necesarios del asignado
                id: true,
                username: true, 
                email: true 
                // Podríamos añadir más campos si los necesitamos en la UI (ej: avatar)
              }
            }
            // Podríamos incluir también al creador si fuera necesario
            // creator: { select: { id: true, username: true } }
          },
          // Opcional: Incluir detalles del creador/asignado de la tarea si es necesario
          // include: {
          //   creator: { select: { id: true, username: true } },
          //   assignee: { select: { id: true, username: true } }
          // }
        },
        // Opcional: Incluir propietario o miembros
        // owner: { select: { id: true, username: true } },
        // memberships: { include: { user: { select: { id: true, username: true } } } }
      },
    });

    if (!board) {
      // Esto no debería pasar si la membresía existe, pero es bueno verificar
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);

  } catch (error) {
    console.error(`Error fetching board ${params.boardId}:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch board', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

// PUT /api/kanban/boards/[boardId]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const boardId = parseInt(params.boardId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    if (isNaN(boardId)) {
      return NextResponse.json({ error: 'Invalid board ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'New board name is required' }, { status: 400 });
    }

    // 1. Buscar el tablero para verificar propiedad
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // 2. Verificar si el usuario es el propietario del tablero
    if (board.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only the owner can update the board' }, { status: 403 });
    }

    // 3. Actualizar el tablero
    const updatedBoard = await prisma.board.update({
      where: {
        id: boardId,
        // Podemos añadir la condición de propietario aquí también como doble chequeo
        // ownerId: userId, 
      },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedBoard);

  } catch (error) {
    console.error(`Error updating board ${params.boardId}:`, error);
    // Manejar errores específicos de Prisma si es necesario (ej. P2025 Record not found)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to update board', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

// DELETE /api/kanban/boards/[boardId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const boardId = parseInt(params.boardId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    if (isNaN(boardId)) {
      return NextResponse.json({ error: 'Invalid board ID format' }, { status: 400 });
    }

    // 1. Buscar el tablero para verificar propiedad
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      // Si el tablero no existe, podemos considerar que ya está eliminado (éxito idempotente)
      // o devolver 404. Devolver 404 es más explícito.
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // 2. Verificar si el usuario es el propietario del tablero
    if (board.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only the owner can delete the board' }, { status: 403 });
    }

    // 3. Eliminar el tablero
    // Las membresías y tareas asociadas se eliminarán en cascada debido al schema
    await prisma.board.delete({
      where: {
        id: boardId,
        // ownerId: userId, // Condición extra opcional
      },
    });

    // Devolver una respuesta vacía con estado 204 o un JSON de éxito
    // return new Response(null, { status: 204 }); 
    return NextResponse.json({ message: 'Board deleted successfully' });

  } catch (error) {
    console.error(`Error deleting board ${params.boardId}:`, error);
    // Manejar errores específicos de Prisma si es necesario (ej. P2025 Record to delete does not exist)
    if (error instanceof Error) { // Podríamos refinar el manejo de errores específicos de Prisma
        return NextResponse.json({ error: 'Failed to delete board', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
