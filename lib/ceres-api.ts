import { randomUUID } from "crypto";

const DEFAULT_CORE_API_V1_BASE_URL = "https://api.ceres.gob.ar/api/v1";
const DEFAULT_PUBLIC_QR_ORIGIN = "https://link.ceres.gob.ar";

export type QrTrackingRecord = {
  id: string;
  slug: string;
  name: string;
  targetUrl: string;
  redirectUrl: string;
  scanCount: number;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CeresApiEnvelope<T> = {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
};

export async function createQrTracking(input: {
  name: string;
  targetUrl: string;
}) {
  const tracking = await ceresApiRequest<QrTrackingRecord>("/qr-tracking", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeQrTrackingRecord(tracking);
}

export async function deleteQrTracking(id: string) {
  await ceresApiRequest(`/qr-tracking/${id}`, {
    method: "DELETE",
  });
}

export async function listQrTrackingsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [] satisfies QrTrackingRecord[];
  }

  const params = new URLSearchParams({
    ids: ids.join(","),
  });

  const trackings = await ceresApiRequest<QrTrackingRecord[]>(
    `/qr-tracking?${params.toString()}`,
  );

  return trackings.map(normalizeQrTrackingRecord);
}

async function ceresApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const requestId = randomUUID();
  const response = await fetch(buildCeresApiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      "x-api-key": getCeresApiKey(),
      "x-public-origin": resolvePublicQrOrigin(),
      "x-request-id": requestId,
      ...init.headers,
    },
  });

  const payload = (await parseJsonResponse(response)) as CeresApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `ceres-api respondio con estado ${response.status}`,
    );
  }

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload.data ?? null) as T;
  }

  return payload as T;
}

function buildCeresApiUrl(path: string) {
  const baseUrl = resolveCoreApiV1BaseUrl();

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBaseUrl.endsWith("/api/v1")) {
    if (normalizedPath.startsWith("/api/v1/")) {
      return `${normalizedBaseUrl}${normalizedPath.slice("/api/v1".length)}`;
    }

    if (normalizedPath.startsWith("/v1/")) {
      return `${normalizedBaseUrl}${normalizedPath.slice("/v1".length)}`;
    }

    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  if (normalizedBaseUrl.endsWith("/v1")) {
    if (normalizedPath.startsWith("/api/v1/")) {
      return `${normalizedBaseUrl}${normalizedPath.slice("/api/v1".length)}`;
    }

    if (normalizedPath.startsWith("/v1/")) {
      return `${normalizedBaseUrl}${normalizedPath.slice("/v1".length)}`;
    }

    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/api/v1/")) {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/v1/")) {
    return `${normalizedBaseUrl}/api${normalizedPath}`;
  }

  return `${normalizedBaseUrl}/api/v1${normalizedPath}`;
}

function getCeresApiKey() {
  const apiKey =
    process.env.CORE_API_ADMIN_KEY ||
    process.env.OPS_API_KEY ||
    process.env.ADMIN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "CORE_API_ADMIN_KEY, OPS_API_KEY o ADMIN_API_KEY no estan configuradas",
    );
  }

  return apiKey;
}

function resolveCoreApiV1BaseUrl() {
  return (
    process.env.CORE_API_V1_BASE_URL ||
    process.env.CERES_API_URL ||
    process.env.NEXT_PUBLIC_CERES_API_URL ||
    DEFAULT_CORE_API_V1_BASE_URL
  );
}

function normalizeQrTrackingRecord(tracking: QrTrackingRecord): QrTrackingRecord {
  return {
    ...tracking,
    redirectUrl: buildPublicQrRedirectUrl(tracking.slug),
  };
}

function buildPublicQrRedirectUrl(slug: string) {
  return `${resolvePublicQrOrigin()}/${slug}`;
}

function resolvePublicQrOrigin() {
  const configuredOrigin = process.env.QR_TRACKING_PUBLIC_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/g, "");
  }

  const resolvedBaseUrl = resolveCoreApiV1BaseUrl();
  const parsedBaseUrl = new URL(resolvedBaseUrl);

  if (isInternalHostname(parsedBaseUrl.hostname)) {
    return DEFAULT_PUBLIC_QR_ORIGIN;
  }

  return DEFAULT_PUBLIC_QR_ORIGIN;
}

function isInternalHostname(hostname: string) {
  const normalizedHost = hostname.trim().toLowerCase();

  if (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1"
  ) {
    return true;
  }

  if (/^10\./.test(normalizedHost)) {
    return true;
  }

  if (/^192\.168\./.test(normalizedHost)) {
    return true;
  }

  const private172Match = normalizedHost.match(/^172\.(\d{1,3})\./);
  if (private172Match) {
    const secondOctet = Number.parseInt(private172Match[1], 10);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}
