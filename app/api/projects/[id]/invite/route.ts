import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { projectId, userEmail } = await request.json();

  // Buscar al usuario por email
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Añadir el usuario al proyecto
  const projectUser = await prisma.project.update({
    where: { id: projectId },
    data: {
      users: {
        connect: { id: user.id },
      },
    },
  });

  return NextResponse.json(projectUser);
}
