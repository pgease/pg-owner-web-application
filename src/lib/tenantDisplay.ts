import type { PropertyTenant } from "@/api/propertyOwner";

export function tenantDisplayName(t: PropertyTenant): string {
  const n = t.name;
  return n != null && String(n).trim() !== "" ? String(n).trim() : "—";
}

export function tenantInitials(t: PropertyTenant): string {
  const n = tenantDisplayName(t);
  if (n === "—") return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function tenantPhone(t: PropertyTenant): string {
  const p = t.phone;
  return p != null && String(p).trim() !== "" ? String(p).trim() : "—";
}

export function tenantBlock(t: PropertyTenant): string {
  const n = t.block?.name;
  return n != null && String(n).trim() !== "" ? String(n).trim() : "—";
}

export function tenantFloor(t: PropertyTenant): string {
  const n = t.floor?.name;
  return n != null && String(n).trim() !== "" ? String(n).trim() : "—";
}

export function tenantRoomNo(t: PropertyTenant): string {
  const r = t.room?.roomNumber ?? t.room?.name;
  return r != null && String(r).trim() !== "" ? String(r).trim() : "—";
}

export function tenantBedNo(t: PropertyTenant): string {
  const b = t.bed?.bedNumber ?? t.roomTenant?.bedNumberOnAssignment;
  if (b === undefined || b === null || String(b).trim() === "") return "—";
  return String(b);
}

export function tenantRentAmount(t: PropertyTenant): string {
  const raw = t.roomTenant?.rentAmount;
  if (raw === undefined || raw === null || String(raw).trim() === "") return "—";
  const n = Number(raw);
  if (Number.isFinite(n)) return `₹${n.toLocaleString("en-IN")}/mo`;
  return `₹${String(raw)}/mo`;
}

/** Next rent due on same calendar day as `startDate` (monthly). */
export function tenantRentDueLabel(t: PropertyTenant): string {
  const startIso = t.roomTenant?.startDate;
  if (!startIso) return "—";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "—";
  const day = start.getDate();
  const now = new Date();
  let y = now.getFullYear();
  let mo = now.getMonth();
  let candidate = new Date(y, mo, day);
  if (candidate <= now) {
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
    const last = new Date(y, mo + 1, 0).getDate();
    candidate = new Date(y, mo, Math.min(day, last));
  }
  return candidate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function tenantVerificationLabel(t: PropertyTenant): "verified" | "pending" {
  if (t.kycVerified === true || t.aadhaarVerified === true) return "verified";
  return "pending";
}
