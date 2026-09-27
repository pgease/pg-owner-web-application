/**
 * Central place for external URLs and support contacts used across the Owner app.
 * Values are overridable via Vite env so local dev can point at a local Help Center.
 */

const env = import.meta.env as Record<string, string | undefined>;

/** PG Ease Help Center (help-pgease project). */
export const HELP_CENTER_URL = (env.VITE_HELP_CENTER_URL || "https://help.pgease.in").replace(/\/+$/, "");

/** Public marketing website. */
export const MARKETING_SITE_URL = "https://pgease.in";

/**
 * Base URL where a PG's public listing page lives. Override with
 * VITE_PUBLIC_LISTING_BASE_URL (e.g. http://localhost:5173/properties in local dev).
 */
export const PUBLIC_LISTING_BASE_URL = (env.VITE_PUBLIC_LISTING_BASE_URL || `${MARKETING_SITE_URL}/properties`).replace(/\/+$/, "");

export function publicListingUrl(propertyId?: string | null): string {
  return propertyId ? `${PUBLIC_LISTING_BASE_URL}/${encodeURIComponent(propertyId)}` : PUBLIC_LISTING_BASE_URL;
}

/** Build a deep link to a Help Center tutorial by its tutorial_key. */
export function helpCenterTutorialUrl(tutorialKey?: string | null): string {
  const key = (tutorialKey || "").trim();
  return key ? `${HELP_CENTER_URL}/${encodeURIComponent(key)}` : HELP_CENTER_URL;
}

/** Build a Help Center search link. */
export function helpCenterSearchUrl(query: string): string {
  const q = query.trim();
  return q ? `${HELP_CENTER_URL}/?q=${encodeURIComponent(q)}` : HELP_CENTER_URL;
}

/** Support contacts (single source of truth — previously duplicated in several pages). */
export const SUPPORT_PHONE_DISPLAY = "+91 77019 53356";
export const SUPPORT_PHONE_TEL = "tel:+917701953356";
export const SUPPORT_WHATSAPP_NUMBER = "917701953356";
export const SUPPORT_EMAIL = "support@pgease.in";
export const SUPPORT_HOURS = "Mon – Sat, 9:30 AM – 7:00 PM IST";

export function supportWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function supportMailtoUrl(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${SUPPORT_EMAIL}${qs ? `?${qs}` : ""}`;
}
