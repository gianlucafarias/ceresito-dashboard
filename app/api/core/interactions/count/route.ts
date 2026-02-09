import { NextRequest, NextResponse } from 'next/server';

const INTERACTIONS_COUNT_PATH = '/interactions/count';
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

function logInteractionsCount(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/interactions/count]', JSON.stringify(meta));
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

function readQueryDate(dateValue: string | null): string | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildLegacyUrl(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveLegacyBaseUrl());
  const from = readQueryDate(request.nextUrl.searchParams.get('from'));
  const to = readQueryDate(request.nextUrl.searchParams.get('to'));

  if (from && to) {
    return `${baseUrl}${INTERACTIONS_COUNT_PATH}/${from}/${to}`;
  }

  return `${baseUrl}${INTERACTIONS_COUNT_PATH}`;
}

function buildV1Url(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const params = new URLSearchParams();
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const query = params.toString();
  if (!query) return `${baseUrl}${INTERACTIONS_COUNT_PATH}`;

  return `${baseUrl}${INTERACTIONS_COUNT_PATH}?${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeInteractionsPayload(payload: any): { count: number } | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return { count: payload };
  }

  if (payload && typeof payload === 'object') {
    const directCount = Number((payload as { count?: unknown }).count);
    if (Number.isFinite(directCount)) return { count: directCount };

    const directTotal = Number((payload as { total?: unknown }).total);
    if (Number.isFinite(directTotal)) return { count: directTotal };
  }

  if (Array.isArray(payload)) {
    let count = 0;
    for (const item of payload) {
      if (typeof item === 'number' && Number.isFinite(item)) {
        count += item;
        continue;
      }

      if (item && typeof item === 'object') {
        const itemCount = Number((item as { count?: unknown }).count);
        if (Number.isFinite(itemCount)) {
          count += itemCount;
          continue;
        }

        const itemTotal = Number((item as { total?: unknown }).total);
        if (Number.isFinite(itemTotal)) {
          count += itemTotal;
        }
      }
    }

    if (Number.isFinite(count)) {
      return { count };
    }
  }

  return null;
}

async function fetchLegacyInteractionsCount(request: NextRequest): Promise<Response> {
  const url = buildLegacyUrl(request);

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

async function fetchV1InteractionsCount(request: NextRequest): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(request);

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

export async function GET(request: NextRequest) {
  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(request);
    const v1Url = buildV1Url(request);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacyInteractionsCount(request);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logInteractionsCount({
          target,
          source: 'legacy_error',
          status: legacyResponse.status,
          url: legacyUrl,
        });
        return jsonWithSource(
          legacyPayload || { error: 'legacy_request_failed' },
          legacyResponse.status,
          'legacy_error'
        );
      }

      const normalized = normalizeInteractionsPayload(legacyPayload);
      if (!normalized) {
        logInteractionsCount({
          target,
          source: 'legacy_invalid_payload',
          status: 502,
          url: legacyUrl,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy payload does not contain a valid interactions count',
          },
          502,
          'legacy_invalid_payload'
        );
      }

      logInteractionsCount({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(normalized, 200, 'legacy');
    }

    const v1Response = await fetchV1InteractionsCount(request);
    if (!v1Response) {
      logInteractionsCount({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 interactions/count',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      const normalized = normalizeInteractionsPayload(v1Payload);
      if (!normalized) {
        logInteractionsCount({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 payload does not contain a valid interactions count',
          },
          502,
          'v1_invalid_payload'
        );
      }

      logInteractionsCount({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
      });
      return jsonWithSource(normalized, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logInteractionsCount({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(
        v1Payload || { error: 'v1_request_failed' },
        v1Response.status,
        'v1_error'
      );
    }

    const legacyResponse = await fetchLegacyInteractionsCount(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logInteractionsCount({
        target,
        source: 'legacy_fallback_error',
        status: legacyResponse.status,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        legacyPayload || { error: 'legacy_request_failed_after_fallback' },
        legacyResponse.status,
        'legacy_fallback_error'
      );
    }

    const normalizedLegacy = normalizeInteractionsPayload(legacyPayload);
    if (!normalizedLegacy) {
      logInteractionsCount({
        target,
        source: 'legacy_fallback_invalid_payload',
        status: 502,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback payload does not contain a valid interactions count',
        },
        502,
        'legacy_fallback_invalid_payload'
      );
    }

    logInteractionsCount({
      target,
      source: 'legacy_fallback',
      status: 200,
      url: legacyUrl,
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
