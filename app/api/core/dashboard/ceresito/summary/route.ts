import { NextRequest, NextResponse } from 'next/server';

const SUMMARY_PATH = '/dashboard/ceresito/summary';
const LEGACY_USERS_COUNT_PATH = '/users/count';
const LEGACY_CONVERSACIONES_PATH = '/conversaciones';
const LEGACY_INTERACTIONS_COUNT_PATH = '/interactions/count';
const LEGACY_RECLAMOS_PATH = '/reclamos';

const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';
const DEFAULT_TREATED_STATUS = 'ASIGNADO';
const DEFAULT_RANGE_DAYS = 90;

type Target = 'legacy' | 'v1';

type SummaryResponse = {
  uniqueUsers: number;
  conversations: number;
  sentMessages: number;
  claimsReceived: number;
  claimsHandled: number;
  generatedAt: string;
};

type SummaryQuery = {
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
  fromDay: string;
  toDay: string;
  treatedStatus: string;
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
  return (
    process.env.NODE_ENV !== 'production' || process.env.CORE_API_DEBUG === 'true'
  );
}

function logSummary(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/dashboard/ceresito/summary]', JSON.stringify(meta));
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
      'x-core-api-source': source,
      ...(extraHeaders || {}),
    },
  });
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function startOfDay(base: Date): Date {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(base: Date): Date {
  const date = new Date(base);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveSummaryQuery(request: NextRequest): {
  query: SummaryQuery | null;
  error: string | null;
} {
  const fromRaw = request.nextUrl.searchParams.get('from');
  const toRaw = request.nextUrl.searchParams.get('to');
  const treatedStatusRaw = request.nextUrl.searchParams.get('treatedStatus');
  const treatedStatus = (
    treatedStatusRaw?.trim().toUpperCase() || DEFAULT_TREATED_STATUS
  ).slice(0, 64);

  if (!treatedStatus) {
    return { query: null, error: 'treatedStatus must not be empty' };
  }

  const parsedFrom = parseDate(fromRaw);
  const parsedTo = parseDate(toRaw);

  if (fromRaw && !parsedFrom) {
    return { query: null, error: '"from" must be a valid ISO date' };
  }

  if (toRaw && !parsedTo) {
    return { query: null, error: '"to" must be a valid ISO date' };
  }

  const to = parsedTo ? endOfDay(parsedTo) : endOfDay(new Date());
  const from = parsedFrom
    ? parsedFrom
    : startOfDay(addDays(to, -DEFAULT_RANGE_DAYS));

  if (from.getTime() > to.getTime()) {
    return { query: null, error: '"from" must be less than or equal to "to"' };
  }

  return {
    query: {
      from,
      to,
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
      fromDay: toDayString(from),
      toDay: toDayString(to),
      treatedStatus,
    },
    error: null,
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function normalizeSummaryPayload(payload: unknown): SummaryResponse | null {
  const objectPayload = asObject(payload);
  if (!objectPayload) return null;

  const uniqueUsers = toFiniteNumber(objectPayload.uniqueUsers) ?? 0;
  const conversations = toFiniteNumber(objectPayload.conversations) ?? 0;
  const sentMessages = toFiniteNumber(objectPayload.sentMessages) ?? 0;
  const claimsReceived = toFiniteNumber(objectPayload.claimsReceived) ?? 0;
  const claimsHandled = toFiniteNumber(objectPayload.claimsHandled) ?? 0;

  const generatedAtRaw =
    typeof objectPayload.generatedAt === 'string'
      ? objectPayload.generatedAt
      : null;
  const generatedAtDate = generatedAtRaw ? new Date(generatedAtRaw) : null;
  const generatedAt =
    generatedAtDate && Number.isFinite(generatedAtDate.getTime())
      ? generatedAtDate.toISOString()
      : new Date().toISOString();

  return {
    uniqueUsers,
    conversations,
    sentMessages,
    claimsReceived,
    claimsHandled,
    generatedAt,
  };
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildV1SummaryUrl(baseUrl: string, query: SummaryQuery): string {
  const params = new URLSearchParams();
  params.set('from', query.fromIso);
  params.set('to', query.toIso);
  params.set('treatedStatus', query.treatedStatus);

  return `${normalizeBaseUrl(baseUrl)}${SUMMARY_PATH}?${params.toString()}`;
}

function buildLegacyUsersCountUrl(baseUrl: string, query: SummaryQuery): string {
  const params = new URLSearchParams();
  params.set('from', query.fromIso);
  params.set('to', query.toIso);
  return `${normalizeBaseUrl(baseUrl)}${LEGACY_USERS_COUNT_PATH}?${params.toString()}`;
}

function buildLegacyConversacionesUrl(
  baseUrl: string,
  query: SummaryQuery,
): string {
  const params = new URLSearchParams();
  params.set('from', query.fromIso);
  params.set('to', query.toIso);
  return `${normalizeBaseUrl(baseUrl)}${LEGACY_CONVERSACIONES_PATH}?${params.toString()}`;
}

function buildLegacyInteractionsUrl(
  baseUrl: string,
  query: SummaryQuery,
): string {
  return `${normalizeBaseUrl(baseUrl)}${LEGACY_INTERACTIONS_COUNT_PATH}/${query.fromDay}/${query.toDay}`;
}

function buildLegacyClaimsUrl(
  baseUrl: string,
  query: SummaryQuery,
  treatedStatus?: string,
): string {
  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('per_page', '1');
  params.set('from', query.fromIso);
  params.set('to', query.toIso);
  if (treatedStatus) params.set('estado', treatedStatus);

  return `${normalizeBaseUrl(baseUrl)}${LEGACY_RECLAMOS_PATH}?${params.toString()}`;
}

function parseUsersCount(payload: unknown): number | null {
  const objectPayload = asObject(payload);
  if (!objectPayload) return null;
  return toFiniteNumber(objectPayload.count);
}

function parseConversationsCount(payload: unknown): number | null {
  if (Array.isArray(payload)) return payload.length;

  const objectPayload = asObject(payload);
  if (!objectPayload) return null;

  const count = toFiniteNumber(objectPayload.count);
  if (count !== null) return count;

  const total = toFiniteNumber(objectPayload.total);
  if (total !== null) return total;

  const data = objectPayload.data;
  if (Array.isArray(data)) return data.length;

  return null;
}

function parseInteractionsCount(payload: unknown): number | null {
  const direct = toFiniteNumber(payload);
  if (direct !== null) return direct;

  const objectPayload = asObject(payload);
  if (objectPayload) {
    const count = toFiniteNumber(objectPayload.count);
    if (count !== null) return count;

    const total = toFiniteNumber(objectPayload.total);
    if (total !== null) return total;
  }

  if (Array.isArray(payload)) {
    let total = 0;
    for (const item of payload) {
      const directValue = toFiniteNumber(item);
      if (directValue !== null) {
        total += directValue;
        continue;
      }

      const itemObject = asObject(item);
      if (!itemObject) continue;

      const count = toFiniteNumber(itemObject.count);
      if (count !== null) {
        total += count;
        continue;
      }

      const itemTotal = toFiniteNumber(itemObject.total);
      if (itemTotal !== null) {
        total += itemTotal;
      }
    }
    return total;
  }

  return null;
}

function parseClaimsCount(payload: unknown): number | null {
  if (Array.isArray(payload)) return payload.length;

  const objectPayload = asObject(payload);
  if (!objectPayload) return null;

  const total = toFiniteNumber(objectPayload.total);
  if (total !== null) return total;

  const count = toFiniteNumber(objectPayload.count);
  if (count !== null) return count;

  const data = objectPayload.data;
  if (Array.isArray(data)) return data.length;

  return null;
}

async function fetchLegacySummary(query: SummaryQuery): Promise<{
  summary: SummaryResponse | null;
  error: { status: number; payload: unknown; url: string } | null;
  debugUrl: string;
}> {
  const legacyBaseUrl = resolveLegacyBaseUrl();
  const usersUrl = buildLegacyUsersCountUrl(legacyBaseUrl, query);
  const conversationsUrl = buildLegacyConversacionesUrl(legacyBaseUrl, query);
  const interactionsUrl = buildLegacyInteractionsUrl(legacyBaseUrl, query);
  const claimsReceivedUrl = buildLegacyClaimsUrl(legacyBaseUrl, query);
  const claimsHandledUrl = buildLegacyClaimsUrl(
    legacyBaseUrl,
    query,
    query.treatedStatus,
  );

  const [
    usersResponse,
    conversationsResponse,
    interactionsResponse,
    claimsReceivedResponse,
    claimsHandledResponse,
  ] = await Promise.all([
    fetch(usersUrl, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }),
    fetch(conversationsUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }),
    fetch(interactionsUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }),
    fetch(claimsReceivedUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }),
    fetch(claimsHandledUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }),
  ]);

  const upstreamResponses = [
    { response: usersResponse, url: usersUrl },
    { response: conversationsResponse, url: conversationsUrl },
    { response: interactionsResponse, url: interactionsUrl },
    { response: claimsReceivedResponse, url: claimsReceivedUrl },
    { response: claimsHandledResponse, url: claimsHandledUrl },
  ];

  const failed = upstreamResponses.find((entry) => !entry.response.ok);
  if (failed) {
    const payload = await safeJson(failed.response);
    return {
      summary: null,
      error: {
        status: failed.response.status,
        payload: payload || { error: 'legacy_request_failed' },
        url: failed.url,
      },
      debugUrl: failed.url,
    };
  }

  const [
    usersPayload,
    conversationsPayload,
    interactionsPayload,
    claimsReceivedPayload,
    claimsHandledPayload,
  ] = await Promise.all([
    safeJson(usersResponse),
    safeJson(conversationsResponse),
    safeJson(interactionsResponse),
    safeJson(claimsReceivedResponse),
    safeJson(claimsHandledResponse),
  ]);

  const uniqueUsers = parseUsersCount(usersPayload);
  const conversations = parseConversationsCount(conversationsPayload);
  const sentMessages = parseInteractionsCount(interactionsPayload);
  const claimsReceived = parseClaimsCount(claimsReceivedPayload);
  const claimsHandled = parseClaimsCount(claimsHandledPayload);

  if (
    uniqueUsers === null ||
    conversations === null ||
    sentMessages === null ||
    claimsReceived === null ||
    claimsHandled === null
  ) {
    return {
      summary: null,
      error: {
        status: 502,
        payload: {
          error: 'invalid_legacy_payload',
          message: 'Legacy payload does not match expected dashboard summary shape',
        },
        url: usersUrl,
      },
      debugUrl: usersUrl,
    };
  }

  return {
    summary: {
      uniqueUsers,
      conversations,
      sentMessages,
      claimsReceived,
      claimsHandled,
      generatedAt: new Date().toISOString(),
    },
    error: null,
    debugUrl: usersUrl,
  };
}

async function fetchV1Summary(query: SummaryQuery): Promise<{
  response: Response | null;
  payload: unknown;
  url: string;
}> {
  const url = buildV1SummaryUrl(resolveV1BaseUrl(), query);
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) {
    return { response: null, payload: null, url };
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-api-key': adminKey,
    },
    cache: 'no-store',
  });
  const payload = await safeJson(response);
  return { response, payload, url };
}

export async function GET(request: NextRequest) {
  try {
    const { query, error } = resolveSummaryQuery(request);
    if (!query) {
      return jsonWithSource(
        { error: 'validation_error', message: error || 'Invalid query' },
        400,
        'validation_error',
      );
    }

    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();

    if (target === 'legacy') {
      const legacyResult = await fetchLegacySummary(query);
      if (legacyResult.error) {
        logSummary({
          target,
          source: 'legacy_error',
          status: legacyResult.error.status,
          url: legacyResult.error.url,
        });
        return jsonWithSource(
          legacyResult.error.payload,
          legacyResult.error.status,
          'legacy_error',
        );
      }

      logSummary({
        target,
        source: 'legacy',
        status: 200,
        url: legacyResult.debugUrl,
      });
      return jsonWithSource(legacyResult.summary, 200, 'legacy');
    }

    const v1Result = await fetchV1Summary(query);
    if (!v1Result.response) {
      logSummary({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Result.url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message:
            'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 dashboard/ceresito/summary',
        },
        500,
        'v1_config_error',
      );
    }

    if (v1Result.response.ok) {
      const normalized = normalizeSummaryPayload(v1Result.payload);
      if (!normalized) {
        logSummary({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Result.url,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 payload does not match expected dashboard summary shape',
          },
          502,
          'v1_invalid_payload',
        );
      }

      logSummary({
        target,
        source: 'v1',
        status: 200,
        url: v1Result.url,
      });
      return jsonWithSource(normalized, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy &&
      (v1Result.response.status === 404 || v1Result.response.status === 501);

    if (!canFallback) {
      logSummary({
        target,
        source: 'v1_error',
        status: v1Result.response.status,
        url: v1Result.url,
      });
      return jsonWithSource(
        v1Result.payload || { error: 'v1_request_failed' },
        v1Result.response.status,
        'v1_error',
      );
    }

    const legacyResult = await fetchLegacySummary(query);
    if (legacyResult.error) {
      logSummary({
        target,
        source: 'legacy_fallback_error',
        status: legacyResult.error.status,
        url: legacyResult.error.url,
        fallback: true,
      });
      return jsonWithSource(
        legacyResult.error.payload,
        legacyResult.error.status,
        'legacy_fallback_error',
      );
    }

    logSummary({
      target,
      source: 'legacy_fallback',
      status: 200,
      url: legacyResult.debugUrl,
      fallback: true,
    });
    return jsonWithSource(legacyResult.summary, 200, 'legacy_fallback', {
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
      'upstream_unreachable',
    );
  }
}
