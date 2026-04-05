import { httpRequest } from "./http";

export interface StaffRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  pgId: string;
  permissions: string[];
  createdAt?: string;
}

export interface CreateStaffBody {
  name: string;
  phone: string;
  role: string;
  pgId: string;
  permissions: string[];
}

export async function listStaff(pgId?: string | null) {
  const q = pgId ? `?pgId=${encodeURIComponent(pgId)}` : "";
  return httpRequest<StaffRecord[]>(`/staff${q}`, { method: "GET", auth: true });
}

export async function getStaff(staffId: string) {
  return httpRequest<StaffRecord>(`/staff/${staffId}`, { method: "GET", auth: true });
}

export async function createStaff(body: CreateStaffBody) {
  return httpRequest<StaffRecord>(`/staff`, { method: "POST", auth: true, body });
}

export async function patchStaffPermissions(staffId: string, permissions: string[]) {
  return httpRequest<unknown>(`/staff/${staffId}/permissions`, {
    method: "PATCH",
    auth: true,
    body: { permissions },
  });
}

export async function deleteStaff(staffId: string) {
  return httpRequest<unknown>(`/staff/${staffId}`, { method: "DELETE", auth: true });
}
