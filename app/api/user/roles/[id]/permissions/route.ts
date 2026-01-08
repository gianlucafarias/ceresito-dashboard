import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Obtener permisos de un rol específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        menuPermissions: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos del rol" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar permisos de un rol
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { menuPermissions } = body;

    if (!Array.isArray(menuPermissions)) {
      return NextResponse.json(
        { error: "menuPermissions debe ser un array" },
        { status: 400 }
      );
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: { menuPermissions },
      select: {
        id: true,
        name: true,
        menuPermissions: true,
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Error al actualizar permisos del rol:", error);
    return NextResponse.json(
      { error: "Error al actualizar permisos del rol" },
      { status: 500 }
    );
  }
}

