import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";

const updateRoleSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
});

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
        { message: "Invalid role ID format" },
        { status: 400 },
      );
    }

    const payload = updateRoleSchema.parse(await request.json());

    const updatedRole = await prisma.role.update({
      where: {
        id: roleId,
      },
      data: {
        name: payload.name,
      },
    });

    return NextResponse.json(updatedRole, { status: 200 });
  } catch (error: any) {
    console.error("Error updating role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid role payload",
          details: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Error updating role" },
      { status: 500 },
    );
  }
}
