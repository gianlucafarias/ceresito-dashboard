import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route para servicios externos.
 * Reenvia JSON y multipart/form-data al backend de servicios.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handleRequest(request, params, 'PATCH');
}

function buildForwardHeaders(request: NextRequest, apiKey: string): Headers {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const uploadToken = request.headers.get('x-upload-token');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (accept) {
    headers.set('Accept', accept);
  }

  if (uploadToken) {
    headers.set('x-upload-token', uploadToken);
  }

  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  }

  if (realIp) {
    headers.set('x-real-ip', realIp);
  }

  headers.set('x-admin-api-key', apiKey);

  return headers;
}

async function readRequestBody(request: NextRequest, method: string) {
  if (method === 'GET' || method === 'DELETE') {
    return undefined;
  }

  const bytes = await request.arrayBuffer();
  return bytes.byteLength > 0 ? bytes : undefined;
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
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
        { status: 500 }
      );
    }

    const serverApiKey = process.env.ADMIN_API_KEY;
    const clientApiKey = request.headers.get('x-admin-api-key');
    const apiKey = serverApiKey || clientApiKey || null;

    if (!apiKey) {
      console.error('[Proxy] ADMIN_API_KEY no esta configurada en el servidor');
      return NextResponse.json(
        {
          success: false,
          error: 'configuration_error',
          message:
            'API Key no configurada en el servidor. Configura ADMIN_API_KEY en las variables de entorno del servidor.',
        },
        { status: 500 }
      );
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
        { status: 500 }
      );
    }

    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method,
      headers: buildForwardHeaders(request, apiKey),
      body: await readRequestBody(request, method),
    });

    const responseContentType = response.headers.get('content-type') || 'application/json';

    if (responseContentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType,
      },
    });
  } catch (error) {
    console.error('[Proxy] Error en proxy de servicios externos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'proxy_error',
        message: error instanceof Error ? error.message : 'Error al conectar con el servicio externo',
      },
      { status: 500 }
    );
  }
}
