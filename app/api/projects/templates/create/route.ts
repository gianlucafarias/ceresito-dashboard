import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, tasks, stages } = data;

    const template = await prisma.template.create({
      data: {
        name,
        description,
        tasks,
        stages,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Error creating template' }, { status: 500 });
  }
}
