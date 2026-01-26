import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route para servicios externos
 * Redirige las peticiones al servicio externo configurado en NEXT_PUBLIC_SERVICES_API_URL
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

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVICES_API_URL;
    
    if (!baseUrl) {
      console.error('[Proxy] NEXT_PUBLIC_SERVICES_API_URL no está configurada');
      return NextResponse.json(
        { 
          success: false, 
          error: 'configuration_error',
          message: 'La URL del servicio externo no está configurada' 
        },
        { status: 500 }
      );
    }

    // Construir la ruta completa
    // El path viene como array: ['api', 'admin', 'stats'] cuando la URL es
    // /api/servicios-externos/api/admin/stats
    const pathSegments = params.path;
    const path = pathSegments.join('/');
    

    // Asegurar que la baseUrl termine sin / y el path comience con /
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
          message: `URL inválida: ${fullUrl}` 
        },
        { status: 500 }
      );
    }
    
    // Copiar query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Preparar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const serverApiKey = process.env.ADMIN_API_KEY;
    const clientApiKey = request.headers.get('x-admin-api-key');
    const apiKey = serverApiKey || clientApiKey;
    
    if (!apiKey) {
      console.error('[Proxy] ADMIN_API_KEY no está configurada en el servidor');
      return NextResponse.json(
        { 
          success: false, 
          error: 'configuration_error',
          message: 'API Key no configurada en el servidor. Configura ADMIN_API_KEY en las variables de entorno del servidor.' 
        },
        { status: 500 }
      );
    }
    
    headers['x-admin-api-key'] = apiKey;

    // Preparar el body si existe
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (error) {
        // Si no hay body, continuar sin él
      }
    }

    // Realizar la petición al servicio externo
    console.log('[Proxy] Enviando petición:', method, url.toString());
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    console.log('[Proxy] Respuesta recibida:', response.status, response.statusText);

    // Leer la respuesta
    const data = await response.json().catch(() => ({}));

    // Retornar la respuesta con el mismo status code
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error en proxy de servicios externos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'proxy_error',
        message: error instanceof Error ? error.message : 'Error al conectar con el servicio externo' 
      },
      { status: 500 }
    );
  }
}
