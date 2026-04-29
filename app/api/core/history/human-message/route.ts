import { NextRequest, NextResponse } from 'next/server';

const V1_PATH = '/history/human-message';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type RequestBody = {
  contactId?: number;
  message?: string;
  conversationId?: string;
};

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
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

function logHumanMessage(meta: {
  source: string;
  status: number;
  url: string;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/history/human-message]', JSON.stringify(meta));
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

function buildV1Url(): string {
  return `${normalizeBaseUrl(resolveV1BaseUrl())}${V1_PATH}`;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readJsonBody(request: NextRequest): Promise<RequestBody | null> {
  try {
    return (await request.json()) as RequestBody;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) {
    return jsonWithSource(
      { success: false, error: 'invalid_body', message: 'Request body must be valid JSON' },
      400,
      'validation_error',
    );
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const contactId = Number(body.contactId);

  if (!Number.isFinite(contactId) || contactId <= 0 || !message) {
    return jsonWithSource(
      {
        success: false,
        error: 'validation_error',
        message: 'contactId y message son requeridos',
      },
      400,
      'validation_error',
    );
  }

  const adminKey = resolveCoreAdminKey();
  if (!adminKey) {
    return jsonWithSource(
      {
        success: false,
        error: 'configuration_error',
        message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required',
      },
      500,
      'v1_config_error',
    );
  }

  const url = buildV1Url();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': adminKey,
      },
      body: JSON.stringify({
        contactId,
        message,
        conversationId: body.conversationId,
      }),
      cache: 'no-store',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    logHumanMessage({ source: 'v1_upstream_unreachable', status: 502, url });
    return jsonWithSource(
      {
        success: false,
        error: 'upstream_unreachable',
        message: `v1_upstream_unreachable:${url}:${errorMessage}`,
      },
      502,
      'v1_upstream_unreachable',
    );
  }

  const payload = await safeJson(upstreamResponse);

  if (!upstreamResponse.ok) {
    logHumanMessage({ source: 'v1_error', status: upstreamResponse.status, url });
    return jsonWithSource(
      payload || {
        success: false,
        error: 'v1_request_failed',
        message: 'No se pudo enviar el mensaje',
      },
      upstreamResponse.status,
      'v1_error',
    );
  }

  logHumanMessage({ source: 'v1', status: 200, url });
  return jsonWithSource(
    payload || { success: true, message: 'Mensaje enviado correctamente' },
    200,
    'v1',
  );
}
