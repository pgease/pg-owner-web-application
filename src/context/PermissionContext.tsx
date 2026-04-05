import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PGEASE_TOKEN_KEY, authStorage } from "@/api/http";
import { decodeJwtPayload } from "@/lib/jwt";

export interface PermissionState {
  role: string;
  staffId: string | null;
  pgId: string | null;
  isOwner: boolean;
  permissions: string[];
  userId: string | null;
}

const defaultState: PermissionState = {
  role: "owner",
  staffId: null,
  pgId: null,
  isOwner: true,
  permissions: [],
  userId: null,
};

function readTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PGEASE_TOKEN_KEY) || authStorage.getAccessToken();
}

function parseToken(token: string | null): PermissionState {
  if (!token) return defaultState;
  const payload = decodeJwtPayload(token);
  if (!payload) return defaultState;

  const permissionsRaw = payload.permissions;
  const permissions = Array.isArray(permissionsRaw)
    ? permissionsRaw.filter((p): p is string => typeof p === "string")
    : [];

  const role = typeof payload.role === "string" ? payload.role : "owner";
  const staffId = typeof payload.staffId === "string" ? payload.staffId : null;
  const pgId = typeof payload.pgId === "string" ? payload.pgId : null;
  const userId =
    typeof payload.userId === "string"
      ? payload.userId
      : typeof payload.sub === "string"
        ? payload.sub
        : null;

  let isOwner = payload.isOwner === true;
  if (payload.isOwner === undefined || payload.isOwner === null) {
    // Legacy property-owner JWT: no staffId + property owner session → treat as owner
    const hasPropertyOwner = Boolean(authStorage.getPropertyOwner());
    isOwner = !staffId && hasPropertyOwner ? true : Boolean(payload.isOwner);
  }

  return {
    role,
    staffId,
    pgId,
    isOwner,
    permissions,
    userId,
  };
}

interface PermissionContextValue extends PermissionState {
  can: (permissionKey: string) => boolean;
  refresh: () => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PermissionState>(() =>
    parseToken(readTokenFromStorage())
  );

  const refresh = useCallback(() => {
    setSnapshot(parseToken(readTokenFromStorage()));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PGEASE_TOKEN_KEY || e.key === "pgEase_accessToken") refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pgease-auth-token-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pgease-auth-token-updated", onCustom);
    };
  }, [refresh]);

  const can = useCallback(
    (permissionKey: string) => {
      if (snapshot.isOwner) return true;
      return snapshot.permissions.includes(permissionKey);
    },
    [snapshot.isOwner, snapshot.permissions]
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      ...snapshot,
      can,
      refresh,
    }),
    [snapshot, can, refresh]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return ctx;
}
