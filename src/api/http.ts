const API_BASE_URL = "https://pg-ease-nest.vercel.app/api";

const ACCESS_TOKEN_KEY = "pgEase_accessToken";
const REFRESH_TOKEN_KEY = "pgEase_refreshToken";
const PROPERTY_OWNER_KEY = "pgEase_propertyOwner";

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
};

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = authStorage.getAccessToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

