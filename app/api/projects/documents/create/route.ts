import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, url, projectId } = data;

    const document = await prisma.document.create({
      data: {
        name,
        url,
        projectId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Error creating document' }, { status: 500 });
  }
}
