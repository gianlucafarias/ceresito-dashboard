import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';

// GET /api/users
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Opcional: Obtener el ID del usuario actual para excluirlo si se desea
    // const currentUserId = parseInt(session.user.id, 10);

    const users = await prisma.user.findMany({
      // Opcional: Excluir al usuario actual de la lista
      // where: {
      //   id: { not: currentUserId }
      // },
      select: { // Seleccionar solo los campos necesarios
        id: true,
        username: true,
        email: true,
        // Podríamos incluir el rol si fuera necesario
        // role: { select: { name: true } }
      },
      orderBy: {
        username: 'asc', // Ordenar alfabéticamente
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 