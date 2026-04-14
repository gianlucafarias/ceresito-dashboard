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

  try {
    const tipoId = Number.parseInt(params.id, 10);
    if (Number.isNaN(tipoId)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 },
      );
    }

    const { nombre } = await request.json();
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        {
          message: "Nombre is required and must be at least 2 characters long",
        },
        { status: 400 },
      );
    }

    const updatedTipoReclamo = await prisma.tipoReclamo.update({
      where: { id: tipoId },
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(updatedTipoReclamo, { status: 200 });
  } catch (error: any) {
    console.error("Error updating TipoReclamo:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "TipoReclamo not found" },
        { status: 404 },
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "TipoReclamo name already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Error updating TipoReclamo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const tipoId = Number.parseInt(params.id, 10);
    if (Number.isNaN(tipoId)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 },
      );
    }

    await prisma.tipoReclamo.delete({
      where: { id: tipoId },
    });

    return NextResponse.json(
      { message: "TipoReclamo deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting TipoReclamo:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "TipoReclamo not found" },
        { status: 404 },
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          message:
            "Cannot delete TipoReclamo as it is still referenced elsewhere.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Error deleting TipoReclamo" },
      { status: 500 },
    );
  }
}
