export function getServicesBaseUrl() {
  return (process.env.NEXT_PUBLIC_SERVICES_API_URL || "").replace(/\/$/, "");
}

export function resolveServicesMediaSrc(src?: string | null) {
  if (!src) {
    return null;
  }

  const normalizedSrc = src.trim();

  if (!normalizedSrc) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedSrc)) {
    return normalizedSrc;
  }

  if (normalizedSrc.startsWith("/uploads/")) {
    const servicesBaseUrl = getServicesBaseUrl();
    return servicesBaseUrl ? `${servicesBaseUrl}${normalizedSrc}` : normalizedSrc;
  }

  return normalizedSrc;
}

export function getUserInitials(firstName?: string | null, lastName?: string | null) {
  const initials = [firstName, lastName]
    .map((value) => value?.trim()?.charAt(0) || "")
    .join("")
    .toUpperCase();

  return initials || "P";
}
