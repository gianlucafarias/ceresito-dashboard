import { NextRequest, NextResponse } from 'next/server';

const CONTACTS_BASE_PATH = '/contacts';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';
type RouteParams = { id: string };

type PaginatedConversationSummaries = {
  data: unknown[];
  total: number;
  pageCount: number;
  currentPage: number;
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

function logContactConversations(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/contacts/:id/conversations]', JSON.stringify(meta));
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
  const id = encodeURIComponent(params.id);
  return `${CONTACTS_BASE_PATH}/${id}/conversations`;
}

function buildLegacyUrl(request: NextRequest, params: RouteParams): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${buildPath(params)}${query}`;
}

function buildV1Url(request: NextRequest, params: RouteParams): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const requestParams = request.nextUrl.searchParams;
  const paramsForV1 = new URLSearchParams();

  const from = requestParams.get('from');
  const to = requestParams.get('to');
  const page = requestParams.get('page');
  const limit = requestParams.get('limit');

  if (from) paramsForV1.set('from', from);
  if (to) paramsForV1.set('to', to);
  if (page) paramsForV1.set('page', page);
  if (limit) paramsForV1.set('limit', limit);

  const query = paramsForV1.toString();
  if (!query) return `${baseUrl}${buildPath(params)}`;

  return `${baseUrl}${buildPath(params)}?${query}`;
}

function parsePositiveInt(value: string | null, defaultValue: number, maxValue: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  const rounded = Math.floor(parsed);
  if (rounded < 1) return defaultValue;
  return Math.min(rounded, maxValue);
}

function toPaginatedResponseFromArray(
  payload: unknown,
  request: NextRequest
): PaginatedConversationSummaries | null {
  if (!Array.isArray(payload)) return null;

  const page = parsePositiveInt(request.nextUrl.searchParams.get('page'), 1, 10_000);
  const limit = parsePositiveInt(request.nextUrl.searchParams.get('limit'), 10, 100);
  const total = payload.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = start >= total ? [] : payload.slice(start, end);

  return {
    data,
    total,
    pageCount,
    currentPage: page,
  };
}

function toPaginatedResponse(
  data: unknown[],
  totalValue: unknown,
  pageValue: unknown,
  pageSizeValue: unknown,
  request: NextRequest
): PaginatedConversationSummaries {
  const totalParsed = Number(totalValue);
  const pageParsed = Number(pageValue);
  const pageSizeParsed = Number(pageSizeValue);

  const fallbackPage = parsePositiveInt(request.nextUrl.searchParams.get('page'), 1, 10_000);
  const fallbackPageSize = parsePositiveInt(request.nextUrl.searchParams.get('limit'), 10, 100);

  const total = Number.isFinite(totalParsed) && totalParsed >= 0 ? totalParsed : data.length;
  const currentPage = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : fallbackPage;
  const pageSize = Number.isFinite(pageSizeParsed) && pageSizeParsed > 0 ? pageSizeParsed : fallbackPageSize;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    data,
    total,
    pageCount,
    currentPage,
  };
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacyContactConversations(
  request: NextRequest,
  params: RouteParams
): Promise<Response> {
  const url = buildLegacyUrl(request, params);

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

async function fetchV1ContactConversations(
  request: NextRequest,
  params: RouteParams
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(request, params);

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

function normalizeConversationsPayload(
  payload: unknown,
  request: NextRequest
): PaginatedConversationSummaries | null {
  if (payload === null || payload === undefined) return null;

  if (Array.isArray(payload)) {
    return toPaginatedResponseFromArray(payload, request);
  }

  if (typeof payload !== 'object') return null;

  const obj = payload as Record<string, unknown>;

  // Legacy normalized shape already used by UI.
  if (Array.isArray(obj.data)) {
    return toPaginatedResponse(
      obj.data,
      obj.total,
      obj.currentPage,
      obj.pageSize,
      request
    );
  }

  // New v1 shape: { items, total, page, pageSize }.
  if (Array.isArray(obj.items)) {
    return toPaginatedResponse(obj.items, obj.total, obj.page, obj.pageSize, request);
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(request, params);
    const v1Url = buildV1Url(request, params);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacyContactConversations(request, params);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logContactConversations({
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

      const normalizedLegacy = normalizeConversationsPayload(legacyPayload, request);
      if (normalizedLegacy === null) {
        logContactConversations({
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

      logContactConversations({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(normalizedLegacy, 200, 'legacy');
    }

    const v1Response = await fetchV1ContactConversations(request, params);
    if (!v1Response) {
      logContactConversations({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message:
            'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 contacts/:id/conversations',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      const normalizedV1 = normalizeConversationsPayload(v1Payload, request);
      if (normalizedV1 === null) {
        logContactConversations({
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

      logContactConversations({
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
      logContactConversations({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyContactConversations(request, params);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logContactConversations({
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

    const normalizedLegacy = normalizeConversationsPayload(legacyPayload, request);
    if (normalizedLegacy === null) {
      logContactConversations({
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

    logContactConversations({
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
