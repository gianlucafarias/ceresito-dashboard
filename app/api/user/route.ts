import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export async function POST(request: NextRequest) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const { email, username, password, roleId } = await request.json();

    if (!email || !username || !password || !roleId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: Number.parseInt(roleId, 10),
      },
      select: {
        id: true,
        email: true,
        username: true,
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            menuPermissions: true,
          },
        },
      },
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 },
    );
  }
}
