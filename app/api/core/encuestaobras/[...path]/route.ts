import { NextRequest, NextResponse } from 'next/server';

const ENCUESTAS_BASE_PATH = '/encuestaobras';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';
const FALLBACK_STATUSES = new Set([404, 501]);

type Target = 'legacy' | 'v1';
type RouteParams = { path?: string[] };

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

function logEncuestas(meta: {
  method: string;
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/encuestaobras]', JSON.stringify(meta));
}

function buildPath(params: RouteParams): string | null {
  const segments = params.path?.filter((segment) => segment && segment.trim().length > 0) ?? [];
  if (segments.length === 0) return null;

  return `${ENCUESTAS_BASE_PATH}/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function buildUrl(baseUrl: string, request: NextRequest, params: RouteParams): string | null {
  const path = buildPath(params);
  if (!path) return null;

  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}${path}${query}`;
}

async function readRequestBody(request: NextRequest): Promise<{
  raw: string | null;
  contentType: string | null;
}> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { raw: null, contentType: null };
  }

  const raw = await request.text();
  return {
    raw: raw.length > 0 ? raw : null,
    contentType: request.headers.get('content-type'),
  };
}

async function safePayload(response: Response): Promise<{
  payload: unknown;
  isText: boolean;
  contentType: string | null;
}> {
  const contentType = response.headers.get('content-type');
  const text = await response.text();
  if (!text) {
    return { payload: null, isText: false, contentType };
  }

  try {
    const parsed = JSON.parse(text);
    return { payload: parsed, isText: false, contentType };
  } catch {
    return { payload: text, isText: true, contentType };
  }
}

function responseWithSource(
  payload: unknown,
  status: number,
  source: string,
  options?: {
    extraHeaders?: Record<string, string>;
    isText?: boolean;
    contentType?: string | null;
  }
) {
  const headers: Record<string, string> = {
    'x-core-api-source': source,
    ...(options?.extraHeaders || {}),
  };

  if (options?.isText) {
    headers['content-type'] = options.contentType || 'text/plain; charset=utf-8';
    return new NextResponse(typeof payload === 'string' ? payload : String(payload ?? ''), {
      status,
      headers,
    });
  }

  return NextResponse.json(payload, {
    status,
    headers,
  });
}

async function fetchLegacy(
  request: NextRequest,
  params: RouteParams,
  body: string | null,
  contentType: string | null
): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), request, params);
  if (!url) {
    throw new Error('invalid_path');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== null) {
    headers['Content-Type'] = contentType || 'application/json';
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1(
  request: NextRequest,
  params: RouteParams,
  body: string | null,
  contentType: string | null
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildUrl(resolveV1BaseUrl(), request, params);
  if (!url) {
    throw new Error('invalid_path');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-api-key': adminKey,
  };
  if (body !== null) {
    headers['Content-Type'] = contentType || 'application/json';
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

async function proxyRequest(request: NextRequest, params: RouteParams) {
  const path = buildPath(params);
  if (!path) {
    return responseWithSource(
      {
        error: 'validation_error',
        message: 'encuestaobras path is required',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const { raw: body, contentType } = await readRequestBody(request);
    const legacyUrl = buildUrl(resolveLegacyBaseUrl(), request, params) as string;
    const v1Url = buildUrl(resolveV1BaseUrl(), request, params) as string;

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacy(request, params, body, contentType);
      const legacyPayload = await safePayload(legacyResponse);

      logEncuestas({
        method: request.method,
        target,
        source: legacyResponse.ok ? 'legacy' : 'legacy_error',
        status: legacyResponse.status,
        url: legacyUrl,
      });

      return responseWithSource(
        legacyPayload.payload,
        legacyResponse.status,
        legacyResponse.ok ? 'legacy' : 'legacy_error',
        {
          isText: legacyPayload.isText,
          contentType: legacyPayload.contentType,
        }
      );
    }

    const v1Response = await fetchV1(request, params, body, contentType);
    if (!v1Response) {
      logEncuestas({
        method: request.method,
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return responseWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 encuestaobras',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safePayload(v1Response);
    if (v1Response.ok) {
      logEncuestas({
        method: request.method,
        target,
        source: 'v1',
        status: v1Response.status,
        url: v1Url,
      });
      return responseWithSource(v1Payload.payload, v1Response.status, 'v1', {
        isText: v1Payload.isText,
        contentType: v1Payload.contentType,
      });
    }

    const canFallback = failoverToLegacy && FALLBACK_STATUSES.has(v1Response.status);
    if (!canFallback) {
      logEncuestas({
        method: request.method,
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return responseWithSource(v1Payload.payload, v1Response.status, 'v1_error', {
        isText: v1Payload.isText,
        contentType: v1Payload.contentType,
      });
    }

    const legacyResponse = await fetchLegacy(request, params, body, contentType);
    const legacyPayload = await safePayload(legacyResponse);

    logEncuestas({
      method: request.method,
      target,
      source: legacyResponse.ok ? 'legacy_fallback' : 'legacy_fallback_error',
      status: legacyResponse.status,
      url: legacyUrl,
      fallback: true,
    });

    return responseWithSource(
      legacyPayload.payload,
      legacyResponse.status,
      legacyResponse.ok ? 'legacy_fallback' : 'legacy_fallback_error',
      {
        extraHeaders: { 'x-core-api-fallback': 'legacy' },
        isText: legacyPayload.isText,
        contentType: legacyPayload.contentType,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error';
    return responseWithSource(
      {
        error: 'upstream_unreachable',
        message,
      },
      502,
      'upstream_unreachable'
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  return proxyRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  return proxyRequest(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  return proxyRequest(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  return proxyRequest(request, params);
}
