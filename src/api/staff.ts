import { httpRequest } from "./http";

export interface StaffRecord {
  id: string;
  name: string;
  phone: string;
  mobileContactNumber?: string;
  email?: string;
  role: string;
  designation: string;
  permissionTierName?: string;
  pgId: string;
  permissions: string[];
  active?: boolean;
  createdAt?: string;
  raw?: any;
}

export interface CreateStaffBody {
  name: string;
  phone: string;
  mobileContactNumber?: string;
  email?: string;
  role: string;
  designation?: string;
  pgId: string;
  permissions?: string[];
}

export function normalizeStaffRecord(raw: any): StaffRecord {
  if (!raw) return raw;
  const data = raw.data || raw;
  const designation = data.designation || data.roles?.[0]?.tierName || data.role || "Staff";
  const roleName = designation.toLowerCase().trim();

  // Extract permissions
  const permissions: string[] = [];
  if (Array.isArray(data.permissions)) {
    for (const p of data.permissions) {
      if (typeof p === "string") {
        permissions.push(p);
      } else if (p && typeof p === "object") {
        if (p.featureKey) permissions.push(p.featureKey);
        if (p.id) permissions.push(p.id);
        if (p.name) permissions.push(p.name);
      }
    }
  }

  return {
    id: data.id,
    name: data.name || "",
    phone: data.mobileContactNumber || data.phone || "",
    mobileContactNumber: data.mobileContactNumber || data.phone || "",
    email: data.email || "",
    role: roleName,
    designation: designation,
    permissionTierName: data.roles?.[0]?.tierName || designation,
    pgId: data.propertyId || data.pgId || "",
    permissions,
    active: data.active !== false,
    createdAt: data.createdAt,
    raw: data,
  };
}

export async function listStaff(pgId?: string | null) {
  const q = pgId ? `?pgId=${encodeURIComponent(pgId)}` : "";
  const res = await httpRequest<any>(`/staff${q}`, { method: "GET", auth: true });
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return list.map(normalizeStaffRecord);
}

export async function getStaff(staffId: string): Promise<StaffRecord> {
  const res = await httpRequest<any>(`/staff/${staffId}`, { method: "GET", auth: true });
  return normalizeStaffRecord(res?.data || res);
}

export async function createStaff(body: CreateStaffBody) {
  return httpRequest<StaffRecord>(`/staff`, { method: "POST", auth: true, body });
}

export async function patchStaffPermissions(
  staffId: string,
  permissions: string[],
  roleOrDesignation?: string
) {
  return httpRequest<unknown>(`/staff/${staffId}`, {
    method: "PATCH",
    auth: true,
    body: {
      permissions,
      role: roleOrDesignation,
      designation: roleOrDesignation,
      permissionTierName: roleOrDesignation,
    },
  });
}

export async function updateStaff(
  staffId: string,
  data: {
    name?: string;
    phone?: string;
    mobileContactNumber?: string;
    email?: string;
    designation?: string;
    role?: string;
    permissions?: string[];
    active?: boolean;
  }
) {
  return httpRequest<unknown>(`/staff/${staffId}`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function deleteStaff(staffId: string) {
  return httpRequest<unknown>(`/staff/${staffId}`, { method: "DELETE", auth: true });
}
