import { format } from "date-fns";

import { RequestError } from "../_types";

export function toISODateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseISODateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function parseNullableNumber(rawValue: string): number | null {
  const clean = rawValue.trim();
  if (!clean) return null;
  const value = Number(clean.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as any)?.message ||
      (payload as any)?.error ||
      `Request failed (${response.status} ${response.statusText})`;

    const error = new Error(message) as RequestError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

export interface ConditionalJsonResponse<T> {
  status: number;
  etag: string | null;
  payload: T | null;
}

export async function requestJsonWithEtag<T>(
  url: string,
  init?: RequestInit,
): Promise<ConditionalJsonResponse<T>> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  const etag = response.headers.get("etag");
  if (response.status === 304) {
    return {
      status: 304,
      etag,
      payload: null,
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as any)?.message ||
      (payload as any)?.error ||
      `Request failed (${response.status} ${response.statusText})`;

    const error = new Error(message) as RequestError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    status: response.status,
    etag,
    payload: payload as T,
  };
}
