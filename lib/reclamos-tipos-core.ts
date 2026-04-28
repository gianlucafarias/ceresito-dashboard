import { randomUUID } from "crypto";

const DEFAULT_CORE_API_V1_BASE_URL = "https://api.ceres.gob.ar/api/v1";

type CoreResponse = {
  ok: boolean;
  status: number;
  body: any;
};

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveCoreApiV1BaseUrl() {
  return (
    process.env.CORE_API_V1_BASE_URL ||
    process.env.CERES_API_URL ||
    process.env.NEXT_PUBLIC_CERES_API_URL ||
    DEFAULT_CORE_API_V1_BASE_URL
  );
}

function resolveCoreAdminKey() {
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

function buildCoreV1Url(path: string) {
  const baseUrl = normalizeBaseUrl(resolveCoreApiV1BaseUrl());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl.endsWith("/api/v1")) {
    if (normalizedPath.startsWith("/api/v1/")) {
      return `${baseUrl}${normalizedPath.slice("/api/v1".length)}`;
    }
    if (normalizedPath.startsWith("/v1/")) {
      return `${baseUrl}${normalizedPath.slice("/v1".length)}`;
    }
    return `${baseUrl}${normalizedPath}`;
  }

  if (baseUrl.endsWith("/v1")) {
    if (normalizedPath.startsWith("/api/v1/")) {
      return `${baseUrl}${normalizedPath.slice("/api/v1".length)}`;
    }
    if (normalizedPath.startsWith("/v1/")) {
      return `${baseUrl}${normalizedPath.slice("/v1".length)}`;
    }
    return `${baseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/api/v1/")) {
    return `${baseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/v1/")) {
    return `${baseUrl}/api${normalizedPath}`;
  }

  return `${baseUrl}/api/v1${normalizedPath}`;
}

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function requestTiposReclamoCore(
  path: string,
  init: RequestInit = {},
): Promise<CoreResponse> {
  const response = await fetch(buildCoreV1Url(path), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      "x-api-key": resolveCoreAdminKey(),
      "x-request-id": randomUUID(),
      ...init.headers,
    },
  });

  const body = await parseBody(response);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}
