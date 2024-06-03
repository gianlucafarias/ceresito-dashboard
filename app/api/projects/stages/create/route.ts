import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, projectId } = data;

    const stage = await prisma.stage.create({
      data: {
        name,
        description,
        projectId,
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json({ error: 'Error creating stage' }, { status: 500 });
  }
}
