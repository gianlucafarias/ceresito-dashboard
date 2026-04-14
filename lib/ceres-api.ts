import { randomUUID } from "crypto";

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
  return ceresApiRequest<QrTrackingRecord>("/v1/qr-tracking", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteQrTracking(id: string) {
  await ceresApiRequest(`/v1/qr-tracking/${id}`, {
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

  return ceresApiRequest<QrTrackingRecord[]>(
    `/v1/qr-tracking?${params.toString()}`,
  );
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
  const baseUrl =
    process.env.CERES_API_URL || process.env.NEXT_PUBLIC_CERES_API_URL;

  if (!baseUrl) {
    throw new Error(
      "CERES_API_URL o NEXT_PUBLIC_CERES_API_URL no estan configuradas",
    );
  }

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const resolvedPath =
    normalizedBaseUrl.endsWith("/v1") && normalizedPath.startsWith("/v1/")
      ? normalizedPath.slice(3)
      : normalizedPath;

  return `${normalizedBaseUrl}${resolvedPath}`;
}

function getCeresApiKey() {
  const apiKey = process.env.OPS_API_KEY || process.env.ADMIN_API_KEY;

  if (!apiKey) {
    throw new Error("OPS_API_KEY o ADMIN_API_KEY no estan configuradas");
  }

  return apiKey;
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
