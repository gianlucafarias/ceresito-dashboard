type SerializableQrCode = {
  id: number;
  name: string;
  targetUrl: string;
  downloadFileName: string;
  createdAt: Date;
  trackingId?: string | null;
  trackingRedirectUrl?: string | null;
};

type SerializableQrTracking = {
  id: string;
  redirectUrl: string;
  scanCount: number;
  lastScannedAt: string | null;
};

export function isValidHttpUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildQrName(targetUrl: string, providedName?: string | null) {
  const trimmedName = providedName?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const parsedUrl = new URL(targetUrl);
  return parsedUrl.hostname.replace(/^www\./i, "") || "QR";
}

export function slugifyFileName(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "qr-code";
}

export function buildQrDownloadFileName(name: string) {
  return `${slugifyFileName(name).slice(0, 80)}.png`;
}

export function toQrCodeResponse(
  qrCode: SerializableQrCode,
  tracking?: SerializableQrTracking | null,
) {
  return {
    id: qrCode.id,
    name: qrCode.name,
    targetUrl: qrCode.targetUrl,
    downloadFileName: qrCode.downloadFileName,
    createdAt: qrCode.createdAt.toISOString(),
    downloadUrl: `/api/qr-codes/${qrCode.id}/download`,
    previewUrl: `/api/qr-codes/${qrCode.id}/download?disposition=inline`,
    trackingEnabled: Boolean(qrCode.trackingId),
    trackingRedirectUrl:
      tracking?.redirectUrl ?? qrCode.trackingRedirectUrl ?? null,
    scanCount: tracking?.scanCount ?? null,
    lastScannedAt: tracking?.lastScannedAt ?? null,
  };
}

export function buildContentDisposition(
  fileName: string,
  disposition: "attachment" | "inline",
) {
  const safeFileName = fileName.trim().toLowerCase().endsWith(".png")
    ? fileName.trim()
    : `${fileName.trim()}.png`;
  const asciiFallback = `${slugifyFileName(
    safeFileName.replace(/\.png$/i, ""),
  )}.png`;
  const encodedFileName = encodeURIComponent(safeFileName);

  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`;
}
