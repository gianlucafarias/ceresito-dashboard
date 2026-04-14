import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { requireMenuAccess } from "@/lib/route-access";

export async function GET(request: Request) {
  const access = await requireMenuAccess("obras");
  if (!access.ok) {
    return access.response;
  }

  try {
    const cuadrillas = await prisma.cuadrilla.findMany({
      include: { tipo: true },
    });
    return NextResponse.json(cuadrillas);
  } catch (error) {
    console.error("Error al obtener las cuadrillas:", error);
    return NextResponse.json(
      { error: "Error al obtener las cuadrillas" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const access = await requireMenuAccess("obras");
  if (!access.ok) {
    return access.response;
  }

  const { id } = await request.json();
  try {
    await prisma.cuadrilla.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Cuadrilla eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cuadrilla:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuadrilla" },
      { status: 500 },
    );
  }
}
