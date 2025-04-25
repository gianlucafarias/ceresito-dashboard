import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Necesario para TransactionClient

// POST /api/kanban/tasks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creatorId = parseInt(session.user.id, 10);
    if (isNaN(creatorId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      boardId,
      status, // Columna inicial (ej: 'TODO')
      description,
      order,
      assigneeId, // Opcional: ID numérico del usuario a asignar
    } = body;

    // --- Validaciones básicas ---
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    if (boardId === undefined || typeof boardId !== 'number') {
      return NextResponse.json({ error: 'Valid board ID is required' }, { status: 400 });
    }
    if (!status || typeof status !== 'string' || status.trim().length === 0) {
      return NextResponse.json({ error: 'Task status (column) is required' }, { status: 400 });
    }
    if (assigneeId !== undefined && typeof assigneeId !== 'number') {
        return NextResponse.json({ error: 'Invalid assignee ID format' }, { status: 400 });
    }

    // --- Lógica de Creación y Verificación --- 
    const newTask = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verificar que el creador es miembro del tablero
      const creatorMembership = await tx.boardMembership.findUnique({
        where: { userId_boardId: { userId: creatorId, boardId: boardId } },
      });
      if (!creatorMembership) {
        throw new Error('Forbidden: You are not a member of this board');
      }

      // 2. Determinar el orden si no se proporciona
      let taskOrder = order;
      if (taskOrder === undefined || typeof taskOrder !== 'number') {
        const lastTask = await tx.kanbanTask.findFirst({
          where: { boardId: boardId, status: status },
          orderBy: { order: 'desc' },
        });
        taskOrder = lastTask ? lastTask.order + 1 : 1;
      }

      // 3. Manejar asignación y membresía automática
      let assigneeExists = true;
      let addAssigneeToBoard = false;
      if (assigneeId !== undefined) {
        // Verificar si el usuario asignado existe
        const assigneeUser = await tx.user.findUnique({ where: { id: assigneeId } });
        if (!assigneeUser) {
          assigneeExists = false; // No lanzar error, simplemente no asignar
          // O podríamos lanzar un error: throw new Error('Assignee user not found');
        }

        if(assigneeExists){
           // Verificar si el asignado ya es miembro del tablero
            const assigneeMembership = await tx.boardMembership.findUnique({
                where: { userId_boardId: { userId: assigneeId, boardId: boardId } },
            });
            if (!assigneeMembership) {
                addAssigneeToBoard = true;
            }
        }
      }

      // 4. Crear la tarea
      const createdTask = await tx.kanbanTask.create({
        data: {
          title: title.trim(),
          description: description || null,
          status: status.trim(),
          order: taskOrder,
          boardId: boardId,
          creatorId: creatorId,
          // Asignar solo si el assigneeId fue proporcionado y el usuario existe
          assigneeId: assigneeExists && assigneeId !== undefined ? assigneeId : null, 
        },
      });

      // 5. Añadir al asignado al tablero si es necesario
      if (addAssigneeToBoard && assigneeId !== undefined) {
        await tx.boardMembership.create({
          data: {
            userId: assigneeId,
            boardId: boardId,
          },
          // Ignorar si ya existe (por concurrencia, aunque ya lo verificamos)
          // Esto requiere una versión más reciente de Prisma o manejar el error P2002
          // skipDuplicates: true 
        }).catch(e => {
          // Manejar posible error de duplicado (P2002) si no usamos skipDuplicates
          if ((e as any).code === 'P2002') {
            console.log(`User ${assigneeId} is already a member of board ${boardId}.`);
          } else {
            throw e; // Re-lanzar otros errores
          }
        });
      }

      return createdTask;
    }, {
      // Definir nivel de aislamiento si es necesario, especialmente por la lógica del order
      // isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof Error) {
        // Devolver 403 si el error fue de permisos
        if (error.message.startsWith('Forbidden:')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        // Devolver 404 si el asignado no existe (si elegimos lanzar error)
        // if (error.message === 'Assignee user not found') {
        //     return NextResponse.json({ error: error.message }, { status: 404 });
        // }
      return NextResponse.json({ error: 'Failed to create task', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
