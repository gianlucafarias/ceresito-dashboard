import { randomUUID } from 'crypto';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

type AdminToken = {
  id?: string;
};

const PROXY_HEADERS = {
  requestId: 'x-request-id',
} as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return handleRequest(request, params, 'DELETE');
}

function copyResponseHeaders(source: Response, requestId: string) {
  const headers = new Headers();
  const responseRequestId = source.headers.get(PROXY_HEADERS.requestId) || requestId;
  const contentType = source.headers.get('content-type');
  const cacheControl = source.headers.get('cache-control');

  headers.set(PROXY_HEADERS.requestId, responseRequestId);
  if (contentType) headers.set('Content-Type', contentType);
  if (cacheControl) headers.set('Cache-Control', cacheControl);

  return headers;
}

async function readRequestBody(request: NextRequest, method: string) {
  if (method === 'GET' || method === 'DELETE') {
    return undefined;
  }

  const bytes = await request.arrayBuffer();
  return bytes.byteLength > 0 ? bytes : undefined;
}

async function requireDashboardSession(request: NextRequest) {
  const token = (await getToken({
    req: request,
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  })) as AdminToken | null;

  if (!token?.id) {
    return NextResponse.json(
      {
        success: false,
        error: 'unauthorized',
        message: 'Sesion administrativa requerida',
      },
      { status: 401, headers: { [PROXY_HEADERS.requestId]: randomUUID() } },
    );
  }

  return null;
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string,
) {
  const requestId = request.headers.get(PROXY_HEADERS.requestId) || randomUUID();

  try {
    const baseUrl =
      process.env.CERES_API_URL || process.env.NEXT_PUBLIC_CERES_API_URL;
    const apiKey = process.env.OPS_API_KEY || process.env.ADMIN_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'configuration_error',
          message: 'CERES_API_URL / OPS_API_KEY no estan configuradas',
        },
        { status: 500, headers: { [PROXY_HEADERS.requestId]: requestId } },
      );
    }

    const sessionError = await requireDashboardSession(request);
    if (sessionError) {
      sessionError.headers.set(PROXY_HEADERS.requestId, requestId);
      return sessionError;
    }

    const path = params.path.join('/');
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBase}${normalizedPath}`);

    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': request.headers.get('content-type') || 'application/json',
        Accept: request.headers.get('accept') || 'application/json',
        [PROXY_HEADERS.requestId]: requestId,
      },
      body: await readRequestBody(request, method),
    });

    const headers = copyResponseHeaders(response, requestId);
    const contentType = response.headers.get('content-type') || 'application/json';

    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status, headers });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'proxy_error',
        message:
          error instanceof Error
            ? error.message
            : 'Error al conectar con ceres-api',
      },
      { status: 500, headers: { [PROXY_HEADERS.requestId]: requestId } },
    );
  }
}
