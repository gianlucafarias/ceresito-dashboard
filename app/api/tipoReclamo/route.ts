import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export async function POST(request: NextRequest) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { message: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const newTipoReclamo = await prisma.tipoReclamo.create({
      data: {
        nombre: nombre.trim(),
      },
    });

    return NextResponse.json(newTipoReclamo);
  } catch (error) {
    console.error("Error creating tipo reclamo:", error);
    return NextResponse.json(
      { error: "Error al crear el tipo de reclamo" },
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
    const obtenerTipoReclamo = await prisma.tipoReclamo.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(obtenerTipoReclamo);
  } catch (error) {
    console.error("Error fetching tipos reclamo:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de reclamo" },
      { status: 500 },
    );
  }
}
