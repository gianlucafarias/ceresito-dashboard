import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: {
    taskId: string;
  };
}

// PUT /api/kanban/tasks/[taskId]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const taskId = parseInt(params.taskId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID format' }, { status: 400 });
    }

    const body = await request.json();

    // Primero, obtener la tarea para verificar permisos y datos
    const task = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: { board: { select: { ownerId: true, memberships: { where: { userId } } } } } // Incluir datos para permisos
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verificar si el usuario es miembro del tablero asociado a la tarea
    // (Asumimos que para modificar una tarea, debes ser miembro del tablero)
    if (task.board.memberships.length === 0 && task.board.ownerId !== userId) {
       return NextResponse.json({ error: 'Forbidden: User not member of the board' }, { status: 403 });
    }

    // --- Lógica de Reordenamiento --- 
    if (body.orderedTaskIds && Array.isArray(body.orderedTaskIds) && typeof body.status === 'string') {
      const orderedTaskIds = body.orderedTaskIds as number[];
      const columnStatus = body.status;

      // Validar que todos los IDs sean números (podría hacerse más robusto)
      if (!orderedTaskIds.every((id: unknown) => typeof id === 'number')) {
          return NextResponse.json({ error: 'Invalid orderedTaskIds format' }, { status: 400 });
      }

      console.log(`Reordering tasks in column ${columnStatus} with order:`, orderedTaskIds);

      try {
        // Usar transacción para actualizar todos los órdenes atómicamente
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < orderedTaskIds.length; i++) {
            const idToUpdate = orderedTaskIds[i];
            // Actualizar el 'order' de cada tarea en la lista para la columna específica
            await tx.kanbanTask.updateMany({ // updateMany por si acaso, aunque el ID debería ser único
              where: {
                 id: idToUpdate,
                 status: columnStatus, // Asegurar que solo se actualicen tareas de la columna correcta
                 boardId: task.boardId // Doble chequeo de seguridad
              },
              data: { order: i }, // El nuevo orden es el índice en la lista
            });
          }
        });
        
        // Devolver éxito (quizás devolver la tarea actualizada como referencia?)
        // Por ahora, solo éxito
        return NextResponse.json({ message: 'Tasks reordered successfully' });

      } catch (transactionError) {
        console.error("Transaction failed during reorder:", transactionError);
        return NextResponse.json({ error: 'Failed to reorder tasks due to transaction error' }, { status: 500 });
      }

    } else {
      // --- Lógica Existente (Mover entre columnas / Editar detalles) --- 
      const { title, description, status, assigneeId } = body;
      const dataToUpdate: Prisma.KanbanTaskUpdateInput = {};

      if (typeof title === 'string') dataToUpdate.title = title;
      if (typeof description === 'string' || description === null) dataToUpdate.description = description;
      if (typeof status === 'string') dataToUpdate.status = status;
      if (typeof assigneeId === 'number' || assigneeId === null) {
          dataToUpdate.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
      }
      // Añadir más campos editables si es necesario (priority, dueDate, etc.)

      if (Object.keys(dataToUpdate).length === 0) {
          return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
      }

      // Si se está cambiando el status, resetear el order (o calcularlo mejor)
      // Por ahora, si cambia status, pongámoslo al final (order alto)
      if (status && status !== task.status) {
          // Contar tareas en la columna destino para ponerla al final
          const countInTargetColumn = await prisma.kanbanTask.count({ where: { boardId: task.boardId, status: status } });
          dataToUpdate.order = countInTargetColumn; // Simplista, podría colisionar.
      }

      const updatedTask = await prisma.kanbanTask.update({
        where: { id: taskId },
        data: dataToUpdate,
        include: { assignee: { select: { id: true, username: true, email: true } } } // Devolver asignado actualizado
      });
      return NextResponse.json(updatedTask);
    }

  } catch (error) {
    console.error(`Error updating task ${params.taskId}:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Failed to update task', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

// DELETE /api/kanban/tasks/[taskId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const taskId = parseInt(params.taskId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID format' }, { status: 400 });
    }

    // --- Lógica de Eliminación ---
    // Usar transacción para asegurar que la verificación y eliminación ocurran juntas
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Buscar la tarea y su tablero
      const task = await tx.kanbanTask.findUnique({
        where: { id: taskId },
        select: { boardId: true, creatorId: true }, // Obtener boardId y creatorId
      });

      if (!task) {
        throw new Error('Task not found'); // Será 404
      }

      // 2. Verificar que el usuario es miembro del tablero
      const membership = await tx.boardMembership.findUnique({
        where: { userId_boardId: { userId: userId, boardId: task.boardId } },
        select: { board: { select: { ownerId: true } } } // Incluir ownerId del tablero
      });

      if (!membership) {
        throw new Error('Forbidden: You are not a member of this board'); // Será 403
      }

      // 3. (Opcional) Lógica de permisos más estricta:
      // Solo permitir eliminar al creador de la tarea o al propietario del tablero?
      // if (task.creatorId !== userId && membership.board.ownerId !== userId) {
      //     throw new Error('Forbidden: Only the task creator or board owner can delete this task');
      // }

      // 4. Eliminar la tarea
      await tx.kanbanTask.delete({
        where: { id: taskId },
      });
    });

    // Devolver éxito
    // return new Response(null, { status: 204 });
    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error(`Error deleting task ${params.taskId}:`, error);
    if (error instanceof Error) {
      if (error.message === 'Task not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.startsWith('Forbidden:')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      // Manejar errores específicos de Prisma (ej. P2025)
       if ((error as any).code === 'P2025') { // Record to delete does not exist.
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
       } 
      return NextResponse.json({ error: 'Failed to delete task', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
