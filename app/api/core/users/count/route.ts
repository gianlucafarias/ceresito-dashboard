import { NextRequest, NextResponse } from 'next/server';

const USERS_COUNT_PATH = '/users/count';
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

function buildUrl(baseUrl: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}${USERS_COUNT_PATH}${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeCountPayload(payload: any): { count: number } | null {
  const value = payload?.count;
  const count = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(count)) return null;
  return { count };
}

async function fetchLegacyUsersCount(request: NextRequest): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), request);

  return fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
}

async function fetchV1UsersCount(request: NextRequest): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildUrl(resolveV1BaseUrl(), request);

  return fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-api-key': adminKey,
    },
    cache: 'no-store',
  });
}

export async function GET(request: NextRequest) {
  const target = resolveTarget();
  const failoverToLegacy = shouldFailover();

  if (target === 'legacy') {
    const legacyResponse = await fetchLegacyUsersCount(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      return NextResponse.json(
        legacyPayload || { error: 'legacy_request_failed' },
        { status: legacyResponse.status }
      );
    }

    const normalized = normalizeCountPayload(legacyPayload);
    if (!normalized) {
      return NextResponse.json(
        {
          error: 'invalid_legacy_payload',
          message: 'Legacy payload does not contain a valid count',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(normalized, { status: 200 });
  }

  const v1Response = await fetchV1UsersCount(request);
  if (!v1Response) {
    return NextResponse.json(
      {
        error: 'configuration_error',
        message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 users/count',
      },
      { status: 500 }
    );
  }

  const v1Payload = await safeJson(v1Response);
  if (v1Response.ok) {
    const normalized = normalizeCountPayload(v1Payload);
    if (!normalized) {
      return NextResponse.json(
        { error: 'invalid_v1_payload', message: 'v1 payload does not contain a valid count' },
        { status: 502 }
      );
    }
    return NextResponse.json(normalized, { status: 200 });
  }

  const canFallback =
    failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

  if (!canFallback) {
    return NextResponse.json(v1Payload || { error: 'v1_request_failed' }, { status: v1Response.status });
  }

  const legacyResponse = await fetchLegacyUsersCount(request);
  const legacyPayload = await safeJson(legacyResponse);

  if (!legacyResponse.ok) {
    return NextResponse.json(
      legacyPayload || { error: 'legacy_request_failed_after_fallback' },
      { status: legacyResponse.status }
    );
  }

  const normalizedLegacy = normalizeCountPayload(legacyPayload);
  if (!normalizedLegacy) {
    return NextResponse.json(
      {
        error: 'invalid_legacy_payload_after_fallback',
        message: 'Legacy fallback payload does not contain a valid count',
      },
      { status: 502 }
    );
  }

  return NextResponse.json(normalizedLegacy, {
    status: 200,
    headers: {
      'x-core-api-fallback': 'legacy',
    },
  });
}
