import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, startDate, endDate, budget, ownerId } = data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        status: 'PENDING', // Valor predeterminado para el status
        ownerId: ownerId ?? 1, // Asegúrate de tener un valor predeterminado válido para ownerId
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Error creating project' }, { status: 500 });
  }
}
