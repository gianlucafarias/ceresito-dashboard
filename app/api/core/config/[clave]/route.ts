import { NextRequest, NextResponse } from 'next/server';

const CONFIG_PATH = '/config';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';
type RouteParams = { clave: string };

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

function logConfigByKey(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  method: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/config/:clave]', JSON.stringify(meta));
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

function buildPath(params: RouteParams): string {
  const clave = encodeURIComponent(params.clave);
  return `${CONFIG_PATH}/${clave}`;
}

function buildLegacyUrl(request: NextRequest, params: RouteParams): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${buildPath(params)}${query}`;
}

function buildV1Url(request: NextRequest, params: RouteParams): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveV1BaseUrl())}${buildPath(params)}${query}`;
}

function normalizeCreateOrUpdatePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const obj = payload as Record<string, unknown>;

  // v1 returns { message, config } for POST/PUT.
  if (obj.config && typeof obj.config === 'object') {
    return obj.config;
  }

  return payload;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchLegacyConfigByKey(
  request: NextRequest,
  params: RouteParams,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>
): Promise<Response> {
  const url = buildLegacyUrl(request, params);

  try {
    return await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1ConfigByKey(
  request: NextRequest,
  params: RouteParams,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(request, params);

  try {
    return await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': adminKey,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

async function handleMutation(
  request: NextRequest,
  params: RouteParams,
  method: 'POST' | 'PUT'
) {
  const body = await readJsonBody(request);
  if (!body) {
    return jsonWithSource(
      {
        error: 'invalid_body',
        message: 'Request body must be valid JSON',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(request, params);
    const v1Url = buildV1Url(request, params);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacyConfigByKey(request, params, method, body);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logConfigByKey({
          target,
          source: 'legacy_error',
          status: legacyResponse.status,
          url: legacyUrl,
          method,
        });
        return jsonWithSource(
          legacyPayload || { error: 'legacy_request_failed' },
          legacyResponse.status,
          'legacy_error'
        );
      }

      const normalizedLegacy = normalizeCreateOrUpdatePayload(legacyPayload);
      logConfigByKey({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
        method,
      });
      return jsonWithSource(normalizedLegacy, 200, 'legacy');
    }

    const v1Response = await fetchV1ConfigByKey(request, params, method, body);
    if (!v1Response) {
      logConfigByKey({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
        method,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 config/:clave',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      const normalizedV1 = normalizeCreateOrUpdatePayload(v1Payload);
      logConfigByKey({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
        method,
      });
      return jsonWithSource(normalizedV1, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logConfigByKey({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
        method,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyConfigByKey(request, params, method, body);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logConfigByKey({
        target,
        source: 'legacy_fallback_error',
        status: legacyResponse.status,
        url: legacyUrl,
        method,
        fallback: true,
      });
      return jsonWithSource(
        legacyPayload || { error: 'legacy_request_failed_after_fallback' },
        legacyResponse.status,
        'legacy_fallback_error'
      );
    }

    const normalizedLegacy = normalizeCreateOrUpdatePayload(legacyPayload);
    logConfigByKey({
      target,
      source: 'legacy_fallback',
      status: 200,
      url: legacyUrl,
      method,
      fallback: true,
    });
    return jsonWithSource(normalizedLegacy, 200, 'legacy_fallback', {
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

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return handleMutation(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return handleMutation(request, params, 'PUT');
}
