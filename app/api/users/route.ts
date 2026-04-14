import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";

const userCreateSchema = z.object({
  email: z.string().email({ message: "Correo electronico invalido." }),
  username: z
    .string()
    .min(4, { message: "Nombre de usuario requiere al menos 4 caracteres." }),
  password: z
    .string()
    .min(8, { message: "Contrasena requiere al menos 8 caracteres." }),
  roleId: z
    .string()
    .refine((value) => !Number.isNaN(Number.parseInt(value, 10)), {
      message: "ID de rol invalido",
    }),
});

export async function GET() {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await request.json();
    const validation = userCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, username, password, roleId } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: Number.parseInt(roleId, 10),
      },
      select: {
        id: true,
        username: true,
        email: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            menuPermissions: true,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
