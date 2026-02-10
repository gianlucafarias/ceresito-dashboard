import { NextRequest, NextResponse } from "next/server";

const DUTY_BASE_PATH = "/farmaciadeturno";
const DEFAULT_LEGACY_BASE_URL = "https://api.ceres.gob.ar/api/api";
const DEFAULT_V1_BASE_URL = "https://api.ceres.gob.ar/api/v1";

type Target = "legacy" | "v1";
type AllowedMethod = "GET" | "PUT";

interface RouteContext {
  params: {
    path?: string[];
  };
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveTarget(): Target {
  const value = (process.env.CORE_API_TARGET || "legacy").toLowerCase();
  return value === "v1" ? "v1" : "legacy";
}

function shouldFailover(): boolean {
  if (process.env.CORE_API_FAILOVER_TO_LEGACY === undefined) return true;
  return process.env.CORE_API_FAILOVER_TO_LEGACY.toLowerCase() !== "false";
}

function resolveLegacyBaseUrl(): string {
  return process.env.CORE_API_LEGACY_BASE_URL || DEFAULT_LEGACY_BASE_URL;
}

function resolveV1BaseUrl(): string {
  return process.env.CORE_API_V1_BASE_URL || DEFAULT_V1_BASE_URL;
}

function resolveCoreAdminKey(): string | undefined {
  return process.env.CORE_API_ADMIN_KEY || process.env.ADMIN_API_KEY;
}

function shouldLogDebug(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CORE_API_DEBUG === "true"
  );
}

function isAllowedMethod(method: string): method is AllowedMethod {
  return method === "GET" || method === "PUT";
}

function buildPath(pathSegments?: string[]): string {
  if (!pathSegments || pathSegments.length === 0) return DUTY_BASE_PATH;
  const encodedPath = pathSegments.map((segment) =>
    encodeURIComponent(segment),
  );
  return `${DUTY_BASE_PATH}/${encodedPath.join("/")}`;
}

function buildUrl(
  baseUrl: string,
  request: NextRequest,
  pathSegments?: string[],
): string {
  const query = request.nextUrl.search || "";
  return `${normalizeBaseUrl(baseUrl)}${buildPath(pathSegments)}${query}`;
}

function logDuty(meta: {
  method: AllowedMethod;
  target: Target;
  source: string;
  status: number;
  url: string;
  path: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log("[core-api/farmaciadeturno/*]", JSON.stringify(meta));
}

function jsonWithSource(
  body: unknown,
  status: number,
  source: string,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "x-core-api-source": source,
      ...(extraHeaders || {}),
    },
  });
}

function emptyWithSource(
  status: number,
  source: string,
  extraHeaders?: Record<string, string>,
) {
  return new NextResponse(null, {
    status,
    headers: {
      "x-core-api-source": source,
      ...(extraHeaders || {}),
    },
  });
}

function pickCacheHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  const names = ["etag", "cache-control", "last-modified", "vary"] as const;

  names.forEach((name) => {
    const value = response.headers.get(name);
    if (value) headers[name] = value;
  });

  return headers;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readRequestBody(request: NextRequest): Promise<string | null> {
  if (request.method !== "PUT") return null;
  const raw = await request.text();
  return raw.length > 0 ? raw : null;
}

async function fetchLegacy(
  request: NextRequest,
  pathSegments: string[] | undefined,
  body: string | null,
): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), request, pathSegments);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (request.method === "GET") {
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch) {
      headers["If-None-Match"] = ifNoneMatch;
    }
  }

  if (request.method === "PUT") {
    headers["Content-Type"] =
      request.headers.get("content-type") || "application/json";
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1(
  request: NextRequest,
  pathSegments: string[] | undefined,
  body: string | null,
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  const isMutation = request.method === "PUT";

  if (isMutation && !adminKey) return null;

  const url = buildUrl(resolveV1BaseUrl(), request, pathSegments);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (request.method === "GET") {
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch) {
      headers["If-None-Match"] = ifNoneMatch;
    }
  }

  if (request.method === "PUT") {
    headers["Content-Type"] =
      request.headers.get("content-type") || "application/json";
  }

  if (adminKey) {
    headers["x-api-key"] = adminKey;
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

async function handleRequest(request: NextRequest, context: RouteContext) {
  if (!isAllowedMethod(request.method)) {
    return jsonWithSource(
      {
        error: "method_not_allowed",
        message: `Method ${request.method} not allowed`,
      },
      405,
      "method_not_allowed",
    );
  }

  const pathSegments = context.params.path;
  const pathLabel = buildPath(pathSegments);
  const body = await readRequestBody(request);

  if (request.method === "PUT" && !body) {
    return jsonWithSource(
      {
        error: "invalid_body",
        message: "Request body must be valid JSON",
      },
      400,
      "validation_error",
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildUrl(resolveLegacyBaseUrl(), request, pathSegments);
    const v1Url = buildUrl(resolveV1BaseUrl(), request, pathSegments);

    if (target === "legacy") {
      const legacyResponse = await fetchLegacy(request, pathSegments, body);
      if (legacyResponse.status === 304) {
        logDuty({
          method: request.method,
          target,
          source: "legacy_not_modified",
          status: 304,
          url: legacyUrl,
          path: pathLabel,
        });
        return emptyWithSource(
          304,
          "legacy_not_modified",
          pickCacheHeaders(legacyResponse),
        );
      }

      const legacyPayload = await safeJson(legacyResponse);
      const source = legacyResponse.ok ? "legacy" : "legacy_error";

      logDuty({
        method: request.method,
        target,
        source,
        status: legacyResponse.status,
        url: legacyUrl,
        path: pathLabel,
      });

      return jsonWithSource(
        legacyPayload || {
          error: legacyResponse.ok
            ? "invalid_legacy_payload"
            : "legacy_request_failed",
        },
        legacyResponse.status,
        source,
        legacyResponse.ok ? pickCacheHeaders(legacyResponse) : undefined,
      );
    }

    const v1Response = await fetchV1(request, pathSegments, body);
    if (!v1Response) {
      logDuty({
        method: request.method,
        target,
        source: "v1_config_error",
        status: 500,
        url: v1Url,
        path: pathLabel,
      });
      return jsonWithSource(
        {
          error: "configuration_error",
          message:
            "CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 farmaciadeturno PUT operations",
        },
        500,
        "v1_config_error",
      );
    }

    if (v1Response.status === 304) {
      logDuty({
        method: request.method,
        target,
        source: "v1_not_modified",
        status: 304,
        url: v1Url,
        path: pathLabel,
      });
      return emptyWithSource(
        304,
        "v1_not_modified",
        pickCacheHeaders(v1Response),
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      logDuty({
        method: request.method,
        target,
        source: "v1",
        status: v1Response.status,
        url: v1Url,
        path: pathLabel,
      });
      return jsonWithSource(
        v1Payload,
        v1Response.status,
        "v1",
        pickCacheHeaders(v1Response),
      );
    }

    const canFallback =
      failoverToLegacy &&
      (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logDuty({
        method: request.method,
        target,
        source: "v1_error",
        status: v1Response.status,
        url: v1Url,
        path: pathLabel,
      });
      return jsonWithSource(
        v1Payload || { error: "v1_request_failed" },
        v1Response.status,
        "v1_error",
      );
    }

    const legacyResponse = await fetchLegacy(request, pathSegments, body);
    if (legacyResponse.status === 304) {
      logDuty({
        method: request.method,
        target,
        source: "legacy_fallback_not_modified",
        status: 304,
        url: legacyUrl,
        path: pathLabel,
        fallback: true,
      });
      return emptyWithSource(
        304,
        "legacy_fallback_not_modified",
        pickCacheHeaders(legacyResponse),
      );
    }

    const legacyPayload = await safeJson(legacyResponse);
    const source = legacyResponse.ok
      ? "legacy_fallback"
      : "legacy_fallback_error";

    logDuty({
      method: request.method,
      target,
      source,
      status: legacyResponse.status,
      url: legacyUrl,
      path: pathLabel,
      fallback: true,
    });

    return jsonWithSource(
      legacyPayload || {
        error: legacyResponse.ok
          ? "invalid_legacy_payload"
          : "legacy_request_failed_after_fallback",
      },
      legacyResponse.status,
      source,
      legacyResponse.ok
        ? {
            ...pickCacheHeaders(legacyResponse),
            "x-core-api-fallback": "legacy",
          }
        : undefined,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return jsonWithSource(
      {
        error: "upstream_unreachable",
        message,
      },
      502,
      "upstream_unreachable",
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}
