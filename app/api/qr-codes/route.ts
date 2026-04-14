import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import {
  createQrTracking,
  deleteQrTracking,
  listQrTrackingsByIds,
} from "@/lib/ceres-api";
import { getMenuPermissionAccess } from "@/lib/menu-access";
import prisma from "@/lib/prisma";
import { generateQrCodePng } from "@/lib/qr/generate";
import { qrFileStorage } from "@/lib/qr/storage";
import {
  buildQrDownloadFileName,
  buildQrName,
  isValidHttpUrl,
  toQrCodeResponse,
} from "@/lib/qr/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createQrCodeSchema = z.object({
  name: z.string().trim().max(120).optional(),
  includeLogo: z.boolean().optional().default(true),
  targetUrl: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .refine(isValidHttpUrl, "La URL debe comenzar con http:// o https://"),
});

export async function GET() {
  const access = await getMenuPermissionAccess("qr");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const qrCodes = await prisma.qrCode.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    const trackingIds = qrCodes.flatMap((qrCode) =>
      qrCode.trackingId ? [qrCode.trackingId] : [],
    );

    let trackingById = new Map<string, Awaited<ReturnType<typeof listQrTrackingsByIds>>[number]>();
    if (trackingIds.length > 0) {
      try {
        const trackingItems = await listQrTrackingsByIds(trackingIds);
        trackingById = new Map(
          trackingItems.map((trackingItem) => [trackingItem.id, trackingItem]),
        );
      } catch (trackingError) {
        console.error("Error fetching qr tracking stats:", trackingError);
      }
    }

    return NextResponse.json(
      qrCodes.map((qrCode) =>
        toQrCodeResponse(
          qrCode,
          qrCode.trackingId ? trackingById.get(qrCode.trackingId) ?? null : null,
        ),
      ),
    );
  } catch (error) {
    console.error("Error fetching qr codes:", error);
    const responseError = mapQrCodeApiError(
      error,
      "Error al obtener los codigos QR",
    );
    return NextResponse.json(
      { error: responseError.message },
      { status: responseError.status },
    );
  }
}

export async function POST(request: Request) {
  const access = await getMenuPermissionAccess("qr");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  let storagePath: string | null = null;
  let trackingId: string | null = null;

  try {
    const body = await request.json();
    const validation = createQrCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos invalidos",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { includeLogo, name, targetUrl } = validation.data;
    const qrName = buildQrName(targetUrl, name);
    const tracking = await createQrTracking({
      name: qrName,
      targetUrl,
    });
    trackingId = tracking.id;

    const qrBuffer = await generateQrCodePng(tracking.redirectUrl, {
      includeLogo,
    });

    const storageFileName = `${uuidv4()}.png`;
    storagePath = await qrFileStorage.save(storageFileName, qrBuffer);

    const qrCode = await prisma.qrCode.create({
      data: {
        name: qrName,
        targetUrl,
        storagePath,
        downloadFileName: buildQrDownloadFileName(qrName),
        trackingId: tracking.id,
        trackingRedirectUrl: tracking.redirectUrl,
      },
    });

    return NextResponse.json(toQrCodeResponse(qrCode, tracking), { status: 201 });
  } catch (error) {
    if (storagePath) {
      try {
        await qrFileStorage.remove(storagePath);
      } catch (cleanupError) {
        console.error("Error cleaning up qr file:", cleanupError);
      }
    }
    if (trackingId) {
      try {
        await deleteQrTracking(trackingId);
      } catch (trackingCleanupError) {
        console.error("Error cleaning up qr tracking:", trackingCleanupError);
      }
    }

    console.error("Error creating qr code:", error);
    const responseError = mapQrCodeApiError(
      error,
      "Error al crear el codigo QR",
    );
    return NextResponse.json(
      { error: responseError.message },
      { status: responseError.status },
    );
  }
}

function mapQrCodeApiError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    return {
      status: 500,
      message:
        "Falta aplicar la migracion QR en la base del dashboard. Ejecuta Prisma migrate deploy.",
    };
  }

  if (error instanceof Error) {
    if (
      error.message.includes("CORE_API_V1_BASE_URL") ||
      error.message.includes("CORE_API_ADMIN_KEY") ||
      error.message.includes("OPS_API_KEY") ||
      error.message.includes("ADMIN_API_KEY")
    ) {
      return {
        status: 500,
        message: error.message,
      };
    }

    if (
      error.message.includes("qr_tracking") ||
      error.message.includes("QR tracking no encontrado") ||
      error.message.includes("relation \"qr_tracking\"")
    ) {
      return {
        status: 500,
        message:
          "Falta aplicar la migracion QR en ceres-api. Ejecuta la migracion del backend.",
      };
    }

    if (error.message.trim()) {
      return {
        status: 500,
        message: error.message,
      };
    }
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
}
