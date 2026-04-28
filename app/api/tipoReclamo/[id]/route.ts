import { NextRequest, NextResponse } from "next/server";

import { requestTiposReclamoCore } from "@/lib/reclamos-tipos-core";
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

    const response = await requestTiposReclamoCore(
      `/reclamos/tipos/${tipoId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ nombre: nombre.trim() }),
      },
    );

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    console.error("Error updating TipoReclamo:", error);

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

    const response = await requestTiposReclamoCore(
      `/reclamos/tipos/${tipoId}`,
      {
        method: "DELETE",
      },
    );

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    console.error("Error deleting TipoReclamo:", error);

    return NextResponse.json(
      { message: "Error deleting TipoReclamo" },
      { status: 500 },
    );
  }
}
