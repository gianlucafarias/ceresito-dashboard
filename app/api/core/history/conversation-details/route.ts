import { NextRequest, NextResponse } from 'next/server';

const LEGACY_PATH = '/conversation-details';
const V1_PATH = '/history/conversation-details';
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

function logConversationDetails(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/history/conversation-details]', JSON.stringify(meta));
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

function parsePositiveInteger(
  value: string | null,
  fallback: number,
): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function buildEmptyConversationDetailsPayload(request: NextRequest) {
  const currentPage = parsePositiveInteger(
    request.nextUrl.searchParams.get('page'),
    1,
  );

  return {
    messages: [],
    totalMessages: 0,
    currentPage,
    totalPages: 0,
  };
}

function buildLegacyUrl(request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${LEGACY_PATH}${query}`;
}

function buildV1Url(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const params = new URLSearchParams();

  const contactId = request.nextUrl.searchParams.get('contactId');
  const conversationId = request.nextUrl.searchParams.get('conversationId');
  const page = request.nextUrl.searchParams.get('page');
  const limit = request.nextUrl.searchParams.get('limit');

  if (contactId) params.set('contactId', contactId);
  if (conversationId) params.set('conversationId', conversationId);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  if (!query) return `${baseUrl}${V1_PATH}`;

  return `${baseUrl}${V1_PATH}?${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacyConversationDetails(request: NextRequest): Promise<Response> {
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

async function fetchV1ConversationDetails(request: NextRequest): Promise<Response | null> {
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
      const legacyResponse = await fetchLegacyConversationDetails(request);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logConversationDetails({
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
        logConversationDetails({
          target,
          source: 'legacy_empty_payload',
          status: 200,
          url: legacyUrl,
        });
        return jsonWithSource(
          buildEmptyConversationDetailsPayload(request),
          200,
          'legacy_empty_payload'
        );
      }

      logConversationDetails({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(legacyPayload, 200, 'legacy');
    }

    const v1Response = await fetchV1ConversationDetails(request);
    if (!v1Response) {
      logConversationDetails({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message:
            'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 history/conversation-details',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      if (v1Payload === null) {
        logConversationDetails({
          target,
          source: 'v1_empty_payload',
          status: 200,
          url: v1Url,
        });
        return jsonWithSource(
          buildEmptyConversationDetailsPayload(request),
          200,
          'v1_empty_payload'
        );
      }

      logConversationDetails({
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
      logConversationDetails({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyConversationDetails(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logConversationDetails({
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
      logConversationDetails({
        target,
        source: 'legacy_fallback_empty_payload',
        status: 200,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        buildEmptyConversationDetailsPayload(request),
        200,
        'legacy_fallback_empty_payload'
      );
    }

    logConversationDetails({
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
