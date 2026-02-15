const API_BASE_URL = "https://pg-ease-nest.vercel.app/api";

const ACCESS_TOKEN_KEY = "pgEase_accessToken";
const REFRESH_TOKEN_KEY = "pgEase_refreshToken";
const PROPERTY_OWNER_KEY = "pgEase_propertyOwner";
const SELECTED_PG_ID_KEY = "pgEase_selectedPgId";
const LANGUAGE_KEY = "pgEase_language";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

export const authStorage = {
  set(tokens: { accessToken: string; refreshToken: string; propertyOwner?: unknown }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (tokens.propertyOwner) {
      window.localStorage.setItem(PROPERTY_OWNER_KEY, JSON.stringify(tokens.propertyOwner));
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(PROPERTY_OWNER_KEY);
  },
  getAccessToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getPropertyOwner(): { name: string } | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PROPERTY_OWNER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { name: string };
    } catch {
      return null;
    }
  },
};

export const appPrefs = {
  getSelectedPgId() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_PG_ID_KEY);
  },
  setSelectedPgId(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(SELECTED_PG_ID_KEY, id);
    else window.localStorage.removeItem(SELECTED_PG_ID_KEY);
  },
  getLanguage(): "hi-IN" | "en-US" {
    if (typeof window === "undefined") return "en-US";
    const v = window.localStorage.getItem(LANGUAGE_KEY);
    return v === "hi-IN" ? "hi-IN" : "en-US";
  },
  setLanguage(lang: "hi-IN" | "en-US") {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  },
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Only set Content-Type for JSON requests (not for FormData)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = authStorage.getAccessToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  // Convert body to JSON string if it's not FormData
  const body = options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined;

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const error: HttpError = new Error((data as any)?.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as TResponse;
}

