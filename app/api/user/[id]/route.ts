import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  let numberRoleId: number | undefined;

  try {
    const { roleId } = await request.json();

    if (roleId === undefined || roleId === null) {
      return NextResponse.json(
        { message: "roleId is required in the request body" },
        { status: 400 },
      );
    }

    const numberUserId = Number.parseInt(params.id, 10);
    if (Number.isNaN(numberUserId)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 },
      );
    }

    numberRoleId = Number.parseInt(roleId, 10);
    if (Number.isNaN(numberRoleId)) {
      return NextResponse.json(
        { message: "Invalid roleId format, expected a number" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: numberUserId,
      },
      data: {
        roleId: numberRoleId,
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

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user role:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          message: `Role with ID ${
            numberRoleId ?? "(unknown)"
          } does not exist.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Error updating user role" },
      { status: 500 },
    );
  }
}
