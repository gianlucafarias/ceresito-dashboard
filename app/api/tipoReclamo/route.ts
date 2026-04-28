import { NextRequest, NextResponse } from "next/server";

import { requestTiposReclamoCore } from "@/lib/reclamos-tipos-core";
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

    const response = await requestTiposReclamoCore("/reclamos/tipos", {
      method: "POST",
      body: JSON.stringify({ nombre: nombre.trim() }),
    });
    return NextResponse.json(response.body, { status: response.status });
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
    const response = await requestTiposReclamoCore("/reclamos/tipos", {
      method: "GET",
    });
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    console.error("Error fetching tipos reclamo:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de reclamo" },
      { status: 500 },
    );
  }
}
