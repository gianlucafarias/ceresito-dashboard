import { NextRequest, NextResponse } from 'next/server';

const CONTACTS_PATH = '/contacts';
const CONVERSACIONES_PATH = '/conversaciones';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';
const CONTACT_NAME_FALLBACK_CACHE_TTL_MS = 60_000;
const CONTACT_NAME_FALLBACK_ERROR_TTL_MS = 15_000;

type Target = 'legacy' | 'v1';
type ContactRecord = Record<string, unknown> & {
  phone?: unknown;
  contact_name?: unknown;
};

type ConversationRecord = Record<string, unknown> & {
  telefono?: unknown;
  nombre?: unknown;
  fecha_hora?: unknown;
};

let cachedConversationNameMap: Map<string, string> | null = null;
let cachedConversationNameMapExpiresAt = 0;
let cachedConversationNameMapErrorAt = 0;

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

function logContacts(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/contacts]', JSON.stringify(meta));
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

function normalizePhone(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'n/a') return null;
  return trimmed;
}

function isMissingContactName(value: unknown): boolean {
  return normalizeName(value) === null;
}

function extractConversationItems(payload: unknown): ConversationRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is ConversationRecord => item !== null && typeof item === 'object'
    );
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return obj.items.filter(
        (item): item is ConversationRecord => item !== null && typeof item === 'object'
      );
    }
    if (Array.isArray(obj.data)) {
      return obj.data.filter(
        (item): item is ConversationRecord => item !== null && typeof item === 'object'
      );
    }
  }

  return [];
}

function getConversationTimestamp(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildConversationNameMap(payload: unknown): Map<string, string> {
  const items = extractConversationItems(payload);
  const map = new Map<string, { name: string; timestamp: number }>();

  for (const item of items) {
    const phone = normalizePhone(item.telefono);
    const name = normalizeName(item.nombre);
    if (!phone || !name) continue;

    const timestamp = getConversationTimestamp(item.fecha_hora);
    const current = map.get(phone);

    if (!current || timestamp >= current.timestamp) {
      map.set(phone, { name, timestamp });
    }
  }

  const result = new Map<string, string>();
  map.forEach((entry, phone) => {
    result.set(phone, entry.name);
  });
  return result;
}

async function fetchConversationNameMap(): Promise<Map<string, string> | null> {
  const now = Date.now();

  if (cachedConversationNameMap && now < cachedConversationNameMapExpiresAt) {
    return cachedConversationNameMap;
  }

  if (
    cachedConversationNameMapErrorAt > 0 &&
    now - cachedConversationNameMapErrorAt < CONTACT_NAME_FALLBACK_ERROR_TTL_MS
  ) {
    return null;
  }

  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = `${normalizeBaseUrl(resolveV1BaseUrl())}${CONVERSACIONES_PATH}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-api-key': adminKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      cachedConversationNameMapErrorAt = now;
      return null;
    }

    const payload = await safeJson(response);
    if (payload === null) {
      cachedConversationNameMapErrorAt = now;
      return null;
    }

    const nameMap = buildConversationNameMap(payload);
    if (nameMap.size === 0) {
      cachedConversationNameMapErrorAt = now;
      return null;
    }

    cachedConversationNameMap = nameMap;
    cachedConversationNameMapExpiresAt = now + CONTACT_NAME_FALLBACK_CACHE_TTL_MS;
    cachedConversationNameMapErrorAt = 0;
    return nameMap;
  } catch {
    cachedConversationNameMapErrorAt = now;
    return null;
  }
}

async function enrichContactsWithConversationNames(payload: unknown): Promise<{
  payload: unknown;
  enrichedCount: number;
}> {
  if (!Array.isArray(payload)) return { payload, enrichedCount: 0 };

  const contacts = payload.filter(
    (item): item is ContactRecord => item !== null && typeof item === 'object'
  );

  if (contacts.length === 0) return { payload, enrichedCount: 0 };

  const hasMissingNames = contacts.some(
    (contact) => isMissingContactName(contact.contact_name) && normalizePhone(contact.phone)
  );

  if (!hasMissingNames) return { payload, enrichedCount: 0 };

  const nameMap = await fetchConversationNameMap();
  if (!nameMap || nameMap.size === 0) {
    return { payload, enrichedCount: 0 };
  }

  let enrichedCount = 0;

  const enrichedPayload = contacts.map((contact) => {
    if (!isMissingContactName(contact.contact_name)) return contact;

    const phone = normalizePhone(contact.phone);
    if (!phone) return contact;

    const fallbackName = nameMap.get(phone);
    if (!fallbackName) return contact;

    enrichedCount += 1;
    return {
      ...contact,
      contact_name: fallbackName,
    };
  });

  return {
    payload: enrichedPayload,
    enrichedCount,
  };
}

function buildLegacyUrl(request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(resolveLegacyBaseUrl())}${CONTACTS_PATH}${query}`;
}

function buildV1Url(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const params = new URLSearchParams(request.nextUrl.searchParams);
  const order = params.get('order');

  // Nest DTO requires ASC|DESC; UI sends asc|desc.
  if (order) {
    params.set('order', order.toUpperCase());
  }

  const query = params.toString();
  if (!query) return `${baseUrl}${CONTACTS_PATH}`;

  return `${baseUrl}${CONTACTS_PATH}?${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacyContacts(request: NextRequest): Promise<Response> {
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

async function fetchV1Contacts(request: NextRequest): Promise<Response | null> {
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
      const legacyResponse = await fetchLegacyContacts(request);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logContacts({
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
        logContacts({
          target,
          source: 'legacy_invalid_payload',
          status: 502,
          url: legacyUrl,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy payload is not valid JSON',
          },
          502,
          'legacy_invalid_payload'
        );
      }

      logContacts({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(legacyPayload, 200, 'legacy');
    }

    const v1Response = await fetchV1Contacts(request);
    if (!v1Response) {
      logContacts({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 contacts',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      if (v1Payload === null) {
        logContacts({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 payload is not valid JSON',
          },
          502,
          'v1_invalid_payload'
        );
      }

      const { payload: enrichedPayload, enrichedCount } =
        await enrichContactsWithConversationNames(v1Payload);
      const source = enrichedCount > 0 ? 'v1_enriched' : 'v1';

      logContacts({
        target,
        source,
        status: 200,
        url: v1Url,
      });
      return jsonWithSource(
        enrichedPayload,
        200,
        source,
        enrichedCount > 0
          ? { 'x-core-api-contact-name-enriched': String(enrichedCount) }
          : undefined
      );
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logContacts({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyContacts(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logContacts({
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
      logContacts({
        target,
        source: 'legacy_fallback_invalid_payload',
        status: 502,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback payload is not valid JSON',
        },
        502,
        'legacy_fallback_invalid_payload'
      );
    }

    logContacts({
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
