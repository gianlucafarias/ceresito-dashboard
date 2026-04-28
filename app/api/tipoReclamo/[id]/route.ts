import { NextRequest, NextResponse } from "next/server";

import { requestTiposReclamoCore } from "@/lib/reclamos-tipos-core";
import { requireMenuAccess } from "@/lib/route-access";

type RouteParams = { id: string };

async function resolveId(
  params: RouteParams | Promise<RouteParams>,
): Promise<number> {
  const resolved = await Promise.resolve(params);
  return Number.parseInt(resolved.id, 10);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams | Promise<RouteParams> },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const tipoId = await resolveId(params);
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
  { params }: { params: RouteParams | Promise<RouteParams> },
) {
  const access = await requireMenuAccess("ajustes");
  if (!access.ok) {
    return access.response;
  }

  try {
    const tipoId = await resolveId(params);
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
