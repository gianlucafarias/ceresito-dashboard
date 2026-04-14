import { NextRequest, NextResponse } from "next/server";

import { getMenuPermissionAccess } from "@/lib/menu-access";
import prisma from "@/lib/prisma";
import { qrFileStorage } from "@/lib/qr/storage";
import { buildContentDisposition } from "@/lib/qr/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const access = await getMenuPermissionAccess("qr");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const qrCodeId = Number.parseInt(params.id, 10);
  if (Number.isNaN(qrCodeId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    const qrCode = await prisma.qrCode.findUnique({
      where: {
        id: qrCodeId,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "Codigo QR no encontrado" },
        { status: 404 },
      );
    }

    const fileExists = await qrFileStorage.exists(qrCode.storagePath);
    if (!fileExists) {
      return NextResponse.json(
        { error: "El archivo QR no existe en storage" },
        { status: 404 },
      );
    }

    const fileBuffer = await qrFileStorage.read(qrCode.storagePath);
    const requestedDisposition =
      request.nextUrl.searchParams.get("disposition");
    const disposition =
      requestedDisposition === "inline" ? "inline" : "attachment";

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": buildContentDisposition(
          qrCode.downloadFileName,
          disposition,
        ),
        "Content-Length": fileBuffer.byteLength.toString(),
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error downloading qr code:", error);
    return NextResponse.json(
      { error: "Error al descargar el codigo QR" },
      { status: 500 },
    );
  }
}
