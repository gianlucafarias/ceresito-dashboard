import { createHmac, randomUUID } from 'crypto';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

type AdminToken = {
  id?: string;
  email?: string | null;
  username?: string | null;
  role?: number | string | null;
};

const ADMIN_HEADERS = {
  requestId: 'x-request-id',
  userId: 'x-admin-user-id',
  username: 'x-admin-username',
  email: 'x-admin-email',
  role: 'x-admin-role',
  signature: 'x-admin-context-signature',
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return handleRequest(request, params, 'PATCH');
}

function buildAdminContextSignature(
  input: {
    userId: string;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    requestId: string;
  },
  secret: string,
) {
  return createHmac('sha256', secret)
    .update(
      [
        input.userId,
        input.username ?? '',
        input.email ?? '',
        input.role ?? '',
        input.requestId,
      ].join('|'),
    )
    .digest('hex');
}

function copyResponseHeaders(source: Response, requestId: string) {
  const headers = new Headers();
  const responseRequestId = source.headers.get(ADMIN_HEADERS.requestId) || requestId;
  const contentType = source.headers.get('content-type');
  const contentDisposition = source.headers.get('content-disposition');
  const cacheControl = source.headers.get('cache-control');
  const contentLength = source.headers.get('content-length');

  headers.set(ADMIN_HEADERS.requestId, responseRequestId);

  if (contentType) headers.set('Content-Type', contentType);
  if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
  if (cacheControl) headers.set('Cache-Control', cacheControl);
  if (contentLength) headers.set('Content-Length', contentLength);

  return headers;
}

function buildForwardHeaders(
  request: NextRequest,
  apiKey: string,
  requestId: string,
  token: AdminToken,
): Headers {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const uploadToken = request.headers.get('x-upload-token');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const role = token.role != null ? String(token.role) : '';
  const secret = process.env.SERVICES_PROXY_CONTEXT_SECRET || apiKey;

  if (contentType) headers.set('Content-Type', contentType);
  if (accept) headers.set('Accept', accept);
  if (uploadToken) headers.set('x-upload-token', uploadToken);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (realIp) headers.set('x-real-ip', realIp);

  headers.set('x-admin-api-key', apiKey);
  headers.set(ADMIN_HEADERS.requestId, requestId);
  headers.set(ADMIN_HEADERS.userId, token.id || '');
  headers.set(ADMIN_HEADERS.username, token.username || '');
  headers.set(ADMIN_HEADERS.email, token.email || '');
  headers.set(ADMIN_HEADERS.role, role);
  headers.set(
    ADMIN_HEADERS.signature,
    buildAdminContextSignature(
      {
        userId: token.id || '',
        username: token.username || '',
        email: token.email || '',
        role,
        requestId,
      },
      secret,
    ),
  );

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
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'unauthorized',
          message: 'Sesion administrativa requerida',
        },
        { status: 401, headers: { [ADMIN_HEADERS.requestId]: randomUUID() } },
      ),
      token: null,
    };
  }

  return { error: null, token };
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string,
) {
  const requestId = request.headers.get(ADMIN_HEADERS.requestId) || randomUUID();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVICES_API_URL;

    if (!baseUrl) {
      console.error('[Proxy] NEXT_PUBLIC_SERVICES_API_URL no esta configurada');
      return NextResponse.json(
        {
          success: false,
          error: 'configuration_error',
          message: 'La URL del servicio externo no esta configurada',
        },
        { status: 500, headers: { [ADMIN_HEADERS.requestId]: requestId } },
      );
    }

    const serverApiKey = process.env.ADMIN_API_KEY;
    if (!serverApiKey) {
      console.error('[Proxy] ADMIN_API_KEY no esta configurada en el servidor');
      return NextResponse.json(
        {
          success: false,
          error: 'configuration_error',
          message:
            'API Key no configurada en el servidor. Configura ADMIN_API_KEY en las variables de entorno del servidor.',
        },
        { status: 500, headers: { [ADMIN_HEADERS.requestId]: requestId } },
      );
    }

    const session = await requireDashboardSession(request);
    if (session.error || !session.token) {
      const errorResponse = session.error as NextResponse;
      errorResponse.headers.set(ADMIN_HEADERS.requestId, requestId);
      return errorResponse;
    }

    const path = params.path.join('/');
    const baseUrlNormalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const pathNormalized = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${baseUrlNormalized}${pathNormalized}`;

    let url: URL;
    try {
      url = new URL(fullUrl);
    } catch (error) {
      console.error('[Proxy] Error construyendo URL:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_url',
          message: `URL invalida: ${fullUrl}`,
        },
        { status: 500, headers: { [ADMIN_HEADERS.requestId]: requestId } },
      );
    }

    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method,
      headers: buildForwardHeaders(request, serverApiKey, requestId, session.token),
      body: await readRequestBody(request, method),
    });

    const headers = copyResponseHeaders(response, requestId);
    const responseContentType = response.headers.get('content-type') || 'application/json';

    if (responseContentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status, headers });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('[Proxy] Error en proxy de servicios externos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'proxy_error',
        message: error instanceof Error ? error.message : 'Error al conectar con el servicio externo',
      },
      { status: 500, headers: { [ADMIN_HEADERS.requestId]: requestId } },
    );
  }
}
