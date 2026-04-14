import { NextResponse } from "next/server";

import { getMenuPermissionAccess } from "@/lib/menu-access";
import prisma from "@/lib/prisma";
import { qrFileStorage } from "@/lib/qr/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  request: Request,
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

    await prisma.qrCode.delete({
      where: {
        id: qrCodeId,
      },
    });

    try {
      await qrFileStorage.remove(qrCode.storagePath);
    } catch (storageError) {
      console.error("Error removing qr file from storage:", storageError);
    }

    return NextResponse.json({
      success: true,
      id: qrCodeId,
    });
  } catch (error) {
    console.error("Error deleting qr code:", error);
    return NextResponse.json(
      { error: "Error al eliminar el codigo QR" },
      { status: 500 },
    );
  }
}
