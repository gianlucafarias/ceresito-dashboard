import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";
import { normalizeMenuPermissions } from "@/types/menu-permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const roleId = Number.parseInt(params.id, 10);

    if (Number.isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol invalido" },
        { status: 400 },
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
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos del rol" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const roleId = Number.parseInt(params.id, 10);

    if (Number.isNaN(roleId)) {
      return NextResponse.json(
        { error: "ID de rol invalido" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as { menuPermissions?: string[] };

    if (!Array.isArray(body.menuPermissions)) {
      return NextResponse.json(
        { error: "menuPermissions debe ser un array" },
        { status: 400 },
      );
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        menuPermissions: normalizeMenuPermissions(body.menuPermissions),
      },
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
      { status: 500 },
    );
  }
}
