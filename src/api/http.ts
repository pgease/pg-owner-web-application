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

/* ─── Token refresh with single-flight dedup ─────────────────────────────── */

let _refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const rt = authStorage.getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/property-owners/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    authStorage.set({ accessToken: json.accessToken, refreshToken: json.refreshToken });
    return true;
  } catch {
    return false;
  }
}

function forceLogout() {
  authStorage.clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

/* ─── HTTP client ─────────────────────────────────────────────────────────── */

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
  _retried?: boolean;
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = authStorage.getAccessToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const body = options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined;

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (response.status === 401 && options.auth && !options._retried) {
    if (!_refreshPromise) {
      _refreshPromise = attemptTokenRefresh().finally(() => { _refreshPromise = null; });
    }
    const refreshed = await _refreshPromise;
    if (refreshed) {
      return httpRequest<TResponse>(path, { ...options, _retried: true });
    }
    forceLogout();
    const error: HttpError = new Error("Session expired. Please log in again.");
    error.status = 401;
    error.data = data;
    throw error;
  }

  if (!response.ok) {
    const error: HttpError = new Error((data as any)?.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as TResponse;
}

