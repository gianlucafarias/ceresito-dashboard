import { NextRequest, NextResponse } from 'next/server';

const INTERACTIONS_LAST_WEEK_BASE_PATH = '/interactions/last-week/count';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';

type RouteParams = {
  start_date: string;
  end_date: string;
  group_by: string;
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

function logInteractionsLastWeek(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/interactions/last-week/count]', JSON.stringify(meta));
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

function sanitizeSegment(value: string): string {
  return encodeURIComponent(decodeURIComponent(value));
}

function buildPath(params: RouteParams): string {
  const startDate = sanitizeSegment(params.start_date);
  const endDate = sanitizeSegment(params.end_date);
  const groupBy = sanitizeSegment(params.group_by);
  return `${INTERACTIONS_LAST_WEEK_BASE_PATH}/${startDate}/${endDate}/${groupBy}`;
}

function buildLegacyUrl(params: RouteParams): string {
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${buildPath(params)}`;
}

function buildV1Url(params: RouteParams): string {
  return `${normalizeBaseUrl(resolveV1BaseUrl())}${buildPath(params)}`;
}

function isValidGroupBy(groupBy: string): boolean {
  return groupBy === 'day' || groupBy === 'hour' || groupBy === 'keyword';
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacy(params: RouteParams): Promise<Response> {
  const url = buildLegacyUrl(params);

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

async function fetchV1(params: RouteParams): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(params);

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

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  if (!isValidGroupBy(params.group_by)) {
    return jsonWithSource(
      {
        error: 'invalid_group_by',
        message: 'group_by must be one of: day, hour, keyword',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(params);
    const v1Url = buildV1Url(params);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacy(params);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logInteractionsLastWeek({
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

      if (legacyPayload === null) {
        logInteractionsLastWeek({
          target,
          source: 'legacy_invalid_payload',
          status: 502,
          url: legacyUrl,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy payload is not valid JSON',
          },
          502,
          'legacy_invalid_payload'
        );
      }

      logInteractionsLastWeek({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(legacyPayload, 200, 'legacy');
    }

    const v1Response = await fetchV1(params);
    if (!v1Response) {
      logInteractionsLastWeek({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message:
            'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 interactions/last-week/count',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      if (v1Payload === null) {
        logInteractionsLastWeek({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
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

      logInteractionsLastWeek({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
      });
      return jsonWithSource(v1Payload, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logInteractionsLastWeek({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacy(params);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logInteractionsLastWeek({
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

    if (legacyPayload === null) {
      logInteractionsLastWeek({
        target,
        source: 'legacy_fallback_invalid_payload',
        status: 502,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback payload is not valid JSON',
        },
        502,
        'legacy_fallback_invalid_payload'
      );
    }

    logInteractionsLastWeek({
      target,
      source: 'legacy_fallback',
      status: 200,
      url: legacyUrl,
      fallback: true,
    });
    return jsonWithSource(legacyPayload, 200, 'legacy_fallback', {
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
