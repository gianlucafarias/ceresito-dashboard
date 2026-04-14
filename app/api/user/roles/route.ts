import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";
import { normalizeMenuPermissions } from "@/types/menu-permissions";

const createRoleSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  menuPermissions: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const payload = createRoleSchema.parse(await request.json());

    const role = await prisma.role.create({
      data: {
        name: payload.name,
        menuPermissions: normalizeMenuPermissions(payload.menuPermissions),
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos invalidos", details: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Error creating role" },
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
    const roles = await prisma.role.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { message: "Error fetching roles" },
      { status: 500 },
    );
  }
}
