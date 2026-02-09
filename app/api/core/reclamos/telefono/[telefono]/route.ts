import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveTarget(): Target {
  const value = (process.env.CORE_API_TARGET || 'legacy').toLowerCase();
  return value === 'v1' ? 'v1' : 'legacy';
}

function shouldFailover(): boolean {
  if (process.env.CORE_API_FAILOVER_TO_LEGACY === undefined) return true;
  return process.env.CORE_API_FAILOVER_TO_LEGACY.toLowerCase() !== 'false';
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
  return process.env.NODE_ENV !== 'production' || process.env.CORE_API_DEBUG === 'true';
}

function logReclamosByTelefono(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  telefono: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/reclamos/telefono/:telefono]', JSON.stringify(meta));
}

function jsonWithSource(
  body: unknown,
  status: number,
  source: string,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'x-core-api-source': source,
      ...(extraHeaders || {}),
    },
  });
}

function buildLegacyPrimaryUrl(baseUrl: string, telefono: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamos/telefono/${encodeURIComponent(telefono)}${query}`;
}

function buildLegacyCompatUrl(baseUrl: string, telefono: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamo/telefono/${encodeURIComponent(telefono)}${query}`;
}

function buildV1Url(baseUrl: string, telefono: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamos/telefono/${encodeURIComponent(telefono)}${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacy(request: NextRequest, telefono: string): Promise<Response> {
  const url = buildLegacyPrimaryUrl(resolveLegacyBaseUrl(), telefono, request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

interface LegacyFetchResult {
  response: Response;
  url: string;
  usedCompat: boolean;
}

async function fetchLegacyWithCompatibility(
  request: NextRequest,
  telefono: string
): Promise<LegacyFetchResult> {
  const primaryUrl = buildLegacyPrimaryUrl(resolveLegacyBaseUrl(), telefono, request);
  const primaryResponse = await fetchLegacy(request, telefono);

  if (primaryResponse.status !== 404) {
    return {
      response: primaryResponse,
      url: primaryUrl,
      usedCompat: false,
    };
  }

  const compatUrl = buildLegacyCompatUrl(resolveLegacyBaseUrl(), telefono, request);

  try {
    const compatResponse = await fetch(compatUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    return {
      response: compatResponse,
      url: compatUrl,
      usedCompat: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${compatUrl}:${message}`);
  }
}

async function fetchV1(request: NextRequest, telefono: string): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(resolveV1BaseUrl(), telefono, request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-api-key': adminKey,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

interface RouteContext {
  params: {
    telefono: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const telefono = context.params.telefono?.trim();
  if (!telefono) {
    return jsonWithSource(
      {
        error: 'validation_error',
        message: 'Telefono is required',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const v1Url = buildV1Url(resolveV1BaseUrl(), telefono, request);

    if (target === 'legacy') {
      const { response: legacyResponse, url: resolvedLegacyUrl, usedCompat } =
        await fetchLegacyWithCompatibility(request, telefono);
      const legacyPayload = await safeJson(legacyResponse);
      const successSource = usedCompat ? 'legacy_compat' : 'legacy';
      const errorSource = usedCompat ? 'legacy_compat_error' : 'legacy_error';
      const invalidPayloadSource = usedCompat
        ? 'legacy_compat_invalid_payload'
        : 'legacy_invalid_payload';

      if (!legacyResponse.ok) {
        logReclamosByTelefono({
          target,
          source: errorSource,
          status: legacyResponse.status,
          url: resolvedLegacyUrl,
          telefono,
        });
        return jsonWithSource(
          legacyPayload || { error: 'legacy_request_failed' },
          legacyResponse.status,
          errorSource
        );
      }

      if (legacyPayload === null) {
        logReclamosByTelefono({
          target,
          source: invalidPayloadSource,
          status: 502,
          url: resolvedLegacyUrl,
          telefono,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy payload is not valid JSON',
          },
          502,
          invalidPayloadSource
        );
      }

      logReclamosByTelefono({
        target,
        source: successSource,
        status: 200,
        url: resolvedLegacyUrl,
        telefono,
      });
      return jsonWithSource(legacyPayload, 200, successSource);
    }

    const v1Response = await fetchV1(request, telefono);
    if (!v1Response) {
      logReclamosByTelefono({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
        telefono,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 reclamos/telefono/:telefono',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      if (v1Payload === null) {
        logReclamosByTelefono({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
          telefono,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 payload is not valid JSON',
          },
          502,
          'v1_invalid_payload'
        );
      }

      logReclamosByTelefono({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
        telefono,
      });
      return jsonWithSource(v1Payload, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logReclamosByTelefono({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
        telefono,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const { response: legacyResponse, url: resolvedLegacyUrl, usedCompat } =
      await fetchLegacyWithCompatibility(request, telefono);
    const legacyPayload = await safeJson(legacyResponse);
    const fallbackSuccessSource = usedCompat ? 'legacy_fallback_compat' : 'legacy_fallback';
    const fallbackErrorSource = usedCompat
      ? 'legacy_fallback_compat_error'
      : 'legacy_fallback_error';
    const fallbackInvalidPayloadSource = usedCompat
      ? 'legacy_fallback_compat_invalid_payload'
      : 'legacy_fallback_invalid_payload';

    if (!legacyResponse.ok) {
      logReclamosByTelefono({
        target,
        source: fallbackErrorSource,
        status: legacyResponse.status,
        url: resolvedLegacyUrl,
        telefono,
        fallback: true,
      });
      return jsonWithSource(
        legacyPayload || { error: 'legacy_request_failed_after_fallback' },
        legacyResponse.status,
        fallbackErrorSource
      );
    }

    if (legacyPayload === null) {
      logReclamosByTelefono({
        target,
        source: fallbackInvalidPayloadSource,
        status: 502,
        url: resolvedLegacyUrl,
        telefono,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback payload is not valid JSON',
        },
        502,
        fallbackInvalidPayloadSource
      );
    }

    logReclamosByTelefono({
      target,
      source: fallbackSuccessSource,
      status: 200,
      url: resolvedLegacyUrl,
      telefono,
      fallback: true,
    });
    return jsonWithSource(legacyPayload, 200, fallbackSuccessSource, {
      'x-core-api-fallback': 'legacy',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error';
    return jsonWithSource(
      {
        error: 'upstream_unreachable',
        message,
      },
      502,
      'upstream_unreachable'
    );
  }
}
