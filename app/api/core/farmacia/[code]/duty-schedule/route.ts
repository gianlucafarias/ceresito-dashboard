import { NextRequest, NextResponse } from "next/server";

const PHARMACY_DUTY_PATH = "/farmacia";
const DEFAULT_LEGACY_BASE_URL = "https://api.ceres.gob.ar/api/api";
const DEFAULT_V1_BASE_URL = "https://api.ceres.gob.ar/api/v1";

type Target = "legacy" | "v1";

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

function buildUrl(baseUrl: string, code: string, request: NextRequest): string {
  const query = request.nextUrl.search || "";
  return `${normalizeBaseUrl(
    baseUrl,
  )}${PHARMACY_DUTY_PATH}/${encodeURIComponent(code)}/duty-schedule${query}`;
}

function logPharmacyDuty(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  code: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log("[core-api/farmacia/:code/duty-schedule]", JSON.stringify(meta));
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

async function fetchLegacy(
  request: NextRequest,
  code: string,
): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), code, request);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1(request: NextRequest, code: string): Promise<Response> {
  const url = buildUrl(resolveV1BaseUrl(), code, request);
  const adminKey = resolveCoreAdminKey();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (adminKey) {
    headers["x-api-key"] = adminKey;
  }

  try {
    return await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
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

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildUrl(resolveLegacyBaseUrl(), code, request);
    const v1Url = buildUrl(resolveV1BaseUrl(), code, request);

    if (target === "legacy") {
      const legacyResponse = await fetchLegacy(request, code);
      const legacyPayload = await safeJson(legacyResponse);
      const source = legacyResponse.ok ? "legacy" : "legacy_error";

      logPharmacyDuty({
        target,
        source,
        status: legacyResponse.ok ? 200 : legacyResponse.status,
        url: legacyUrl,
        code,
      });

      return jsonWithSource(
        legacyPayload || {
          error: legacyResponse.ok
            ? "invalid_legacy_payload"
            : "legacy_request_failed",
        },
        legacyResponse.ok ? 200 : legacyResponse.status,
        source,
      );
    }

    const v1Response = await fetchV1(request, code);
    const v1Payload = await safeJson(v1Response);

    if (v1Response.ok) {
      logPharmacyDuty({
        target,
        source: "v1",
        status: 200,
        url: v1Url,
        code,
      });
      return jsonWithSource(v1Payload, 200, "v1");
    }

    const canFallback =
      failoverToLegacy &&
      (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logPharmacyDuty({
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

    const legacyResponse = await fetchLegacy(request, code);
    const legacyPayload = await safeJson(legacyResponse);
    const source = legacyResponse.ok
      ? "legacy_fallback"
      : "legacy_fallback_error";

    logPharmacyDuty({
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
