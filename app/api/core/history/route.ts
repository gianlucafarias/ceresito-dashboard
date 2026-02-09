import { NextRequest, NextResponse } from 'next/server';

const HISTORY_PATH = '/history';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';

type NormalizedHistoryPayload = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

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

function logHistory(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/history]', JSON.stringify(meta));
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

function parsePositiveInt(value: string | null, defaultValue: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  const rounded = Math.floor(parsed);
  if (rounded < 1) return defaultValue;
  return rounded;
}

function buildLegacyUrl(request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${HISTORY_PATH}${query}`;
}

function buildV1Url(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const params = new URLSearchParams();

  const phone = request.nextUrl.searchParams.get('phone');
  const page = request.nextUrl.searchParams.get('page');
  const limit = request.nextUrl.searchParams.get('limit');

  if (phone) params.set('phone', phone);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  if (!query) return `${baseUrl}${HISTORY_PATH}`;

  return `${baseUrl}${HISTORY_PATH}?${query}`;
}

function normalizeHistoryPayload(
  payload: unknown,
  request: NextRequest
): NormalizedHistoryPayload | null {
  if (!payload || typeof payload !== 'object') return null;

  const obj = payload as Record<string, unknown>;

  // Legacy shape expected by UI.
  if (Array.isArray(obj.items)) {
    const total = Number(obj.total);
    const page = Number(obj.page);
    const pageSize = Number(obj.pageSize);

    if (
      Number.isFinite(total) &&
      Number.isFinite(page) &&
      Number.isFinite(pageSize) &&
      page > 0 &&
      pageSize > 0
    ) {
      return {
        items: obj.items,
        total,
        page,
        pageSize,
      };
    }
  }

  // v1 shape: { data, total, currentPage, pageCount }
  if (Array.isArray(obj.data)) {
    const items = obj.data;
    const total = Number(obj.total);
    const currentPage = Number(obj.currentPage);
    const pageSize = parsePositiveInt(request.nextUrl.searchParams.get('limit'), 20);

    if (Number.isFinite(total) && Number.isFinite(currentPage) && currentPage > 0) {
      return {
        items,
        total,
        page: currentPage,
        pageSize,
      };
    }
  }

  return null;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacyHistory(request: NextRequest): Promise<Response> {
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

async function fetchV1History(request: NextRequest): Promise<Response | null> {
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
      const legacyResponse = await fetchLegacyHistory(request);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logHistory({
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

      const normalizedLegacy = normalizeHistoryPayload(legacyPayload, request);
      if (!normalizedLegacy) {
        logHistory({
          target,
          source: 'legacy_invalid_payload',
          status: 502,
          url: legacyUrl,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy history payload does not match expected shape',
          },
          502,
          'legacy_invalid_payload'
        );
      }

      logHistory({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(normalizedLegacy, 200, 'legacy');
    }

    const v1Response = await fetchV1History(request);
    if (!v1Response) {
      logHistory({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 history',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      const normalizedV1 = normalizeHistoryPayload(v1Payload, request);
      if (!normalizedV1) {
        logHistory({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 history payload does not match expected shape',
          },
          502,
          'v1_invalid_payload'
        );
      }

      logHistory({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
      });
      return jsonWithSource(normalizedV1, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logHistory({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyHistory(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logHistory({
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

    const normalizedLegacy = normalizeHistoryPayload(legacyPayload, request);
    if (!normalizedLegacy) {
      logHistory({
        target,
        source: 'legacy_fallback_invalid_payload',
        status: 502,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback history payload does not match expected shape',
        },
        502,
        'legacy_fallback_invalid_payload'
      );
    }

    logHistory({
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
