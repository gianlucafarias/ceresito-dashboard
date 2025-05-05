import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const userCreateSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  username: z.string().min(4, { message: "Nombre de usuario requiere al menos 4 caracteres." }),
  password: z.string().min(8, { message: "Contraseña requiere al menos 8 caracteres." }),
  roleId: z.string().refine(val => !isNaN(parseInt(val, 10)), { message: "ID de rol inválido" }),
});

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

// POST /api/users
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Podrías añadir una verificación de rol aquí, si solo ciertos roles pueden crear usuarios
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validar el cuerpo de la solicitud (opcional)
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, username, password, roleId } = validation.data;

    // Verificar si el email o username ya existen
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 }); // 409 Conflict
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10); // 10 es el número de rondas de salt

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: parseInt(roleId, 10), // Convertir roleId a número
      },
      select: { // Devolver solo los datos necesarios (sin contraseña)
        id: true,
        username: true,
        email: true,
        roleId: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) { // Manejo específico para errores de Zod
         return NextResponse.json({ error: 'Invalid input', details: error.flatten().fieldErrors }, { status: 400 });
     }
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 