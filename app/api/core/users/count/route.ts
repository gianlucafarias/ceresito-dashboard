import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';
const USERS_COUNT_PATH = '/users/count';

type Target = 'legacy' | 'v1';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveTarget(value: string | undefined): Target {
  return value === 'v1' ? 'v1' : 'legacy';
}

function shouldFailover(value: string | undefined): boolean {
  if (value === undefined) return true;
  return value.toLowerCase() !== 'false';
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
  const legacyBaseUrl =
    process.env.CORE_API_LEGACY_BASE_URL || DEFAULT_LEGACY_BASE_URL;
  const url = buildUrl(legacyBaseUrl, request);

  return fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
}

async function fetchV1UsersCount(request: NextRequest): Promise<Response | null> {
  const adminKey = process.env.CORE_API_ADMIN_KEY || process.env.ADMIN_API_KEY;
  if (!adminKey) return null;

  const v1BaseUrl = process.env.CORE_API_V1_BASE_URL || DEFAULT_V1_BASE_URL;
  const url = buildUrl(v1BaseUrl, request);

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
  const target = resolveTarget(process.env.CORE_API_TARGET_USERS_COUNT);
  const failoverToLegacy = shouldFailover(process.env.CORE_API_FAILOVER_TO_LEGACY);

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
        { error: 'invalid_legacy_payload', message: 'Legacy payload does not contain a valid count' },
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

  const shouldFallback =
    failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

  if (!shouldFallback) {
    return NextResponse.json(
      v1Payload || { error: 'v1_request_failed' },
      { status: v1Response.status }
    );
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
