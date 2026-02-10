import { NextRequest, NextResponse } from "next/server";

const PHARMACY_PATH = "/pharmacy";
const DEFAULT_LEGACY_BASE_URL = "https://api.ceres.gob.ar/api/api";
const DEFAULT_V1_BASE_URL = "https://api.ceres.gob.ar/api/v1";

type Target = "legacy" | "v1";
type AllowedMethod = "GET" | "PUT";

interface RouteContext {
  params: {
    code: string;
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

function buildUrl(baseUrl: string, code: string, request: NextRequest): string {
  const query = request.nextUrl.search || "";
  return `${normalizeBaseUrl(baseUrl)}${PHARMACY_PATH}/${encodeURIComponent(
    code,
  )}${query}`;
}

function logPharmacy(meta: {
  method: AllowedMethod;
  target: Target;
  source: string;
  status: number;
  url: string;
  code: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log("[core-api/pharmacy/:code]", JSON.stringify(meta));
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
  code: string,
  body: string | null,
): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), code, request);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

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
  code: string,
  body: string | null,
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  const isMutation = request.method === "PUT";
  if (isMutation && !adminKey) return null;

  const url = buildUrl(resolveV1BaseUrl(), code, request);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

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

  const code = context.params.code?.trim().toUpperCase();
  if (!code) {
    return jsonWithSource(
      {
        error: "validation_error",
        message: "Pharmacy code is required",
      },
      400,
      "validation_error",
    );
  }

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
    const failover = shouldFailover();
    const legacyUrl = buildUrl(resolveLegacyBaseUrl(), code, request);
    const v1Url = buildUrl(resolveV1BaseUrl(), code, request);

    if (target === "legacy") {
      const legacyResponse = await fetchLegacy(request, code, body);
      const legacyPayload = await safeJson(legacyResponse);

      if (legacyResponse.ok) {
        logPharmacy({
          method: request.method,
          target,
          source: "legacy",
          status: 200,
          url: legacyUrl,
          code,
        });
        return jsonWithSource(legacyPayload, 200, "legacy");
      }

      // Legacy currently does not expose /pharmacy/:code in production.
      const canFallbackToV1 =
        failover &&
        (legacyResponse.status === 404 || legacyResponse.status === 501);
      if (!canFallbackToV1) {
        logPharmacy({
          method: request.method,
          target,
          source: "legacy_error",
          status: legacyResponse.status,
          url: legacyUrl,
          code,
        });
        return jsonWithSource(
          legacyPayload || { error: "legacy_request_failed" },
          legacyResponse.status,
          "legacy_error",
        );
      }

      const v1FallbackResponse = await fetchV1(request, code, body);
      if (!v1FallbackResponse) {
        logPharmacy({
          method: request.method,
          target,
          source: "v1_fallback_config_error",
          status: 500,
          url: v1Url,
          code,
          fallback: true,
        });
        return jsonWithSource(
          {
            error: "configuration_error",
            message:
              "CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 pharmacy PUT operations",
          },
          500,
          "v1_fallback_config_error",
        );
      }

      const v1FallbackPayload = await safeJson(v1FallbackResponse);
      const fallbackSource = v1FallbackResponse.ok
        ? "v1_fallback"
        : "v1_fallback_error";

      logPharmacy({
        method: request.method,
        target,
        source: fallbackSource,
        status: v1FallbackResponse.ok ? 200 : v1FallbackResponse.status,
        url: v1Url,
        code,
        fallback: true,
      });

      return jsonWithSource(
        v1FallbackPayload || { error: "v1_request_failed_after_legacy_miss" },
        v1FallbackResponse.ok ? 200 : v1FallbackResponse.status,
        fallbackSource,
        v1FallbackResponse.ok ? { "x-core-api-fallback": "v1" } : undefined,
      );
    }

    const v1Response = await fetchV1(request, code, body);
    if (!v1Response) {
      logPharmacy({
        method: request.method,
        target,
        source: "v1_config_error",
        status: 500,
        url: v1Url,
        code,
      });
      return jsonWithSource(
        {
          error: "configuration_error",
          message:
            "CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 pharmacy PUT operations",
        },
        500,
        "v1_config_error",
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      logPharmacy({
        method: request.method,
        target,
        source: "v1",
        status: 200,
        url: v1Url,
        code,
      });
      return jsonWithSource(v1Payload, 200, "v1");
    }

    const canFallbackToLegacy =
      failover && (v1Response.status === 404 || v1Response.status === 501);
    if (!canFallbackToLegacy) {
      logPharmacy({
        method: request.method,
        target,
        source: "v1_error",
        status: v1Response.status,
        url: v1Url,
        code,
      });
      return jsonWithSource(
        v1Payload || { error: "v1_request_failed" },
        v1Response.status,
        "v1_error",
      );
    }

    const legacyResponse = await fetchLegacy(request, code, body);
    const legacyPayload = await safeJson(legacyResponse);
    const source = legacyResponse.ok
      ? "legacy_fallback"
      : "legacy_fallback_error";

    logPharmacy({
      method: request.method,
      target,
      source,
      status: legacyResponse.ok ? 200 : legacyResponse.status,
      url: legacyUrl,
      code,
      fallback: true,
    });

    return jsonWithSource(
      legacyPayload || {
        error: legacyResponse.ok
          ? "invalid_legacy_payload"
          : "legacy_request_failed_after_fallback",
      },
      legacyResponse.ok ? 200 : legacyResponse.status,
      source,
      legacyResponse.ok ? { "x-core-api-fallback": "legacy" } : undefined,
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
