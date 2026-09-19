import type { PropertyTenant } from "@/api/propertyOwner";

export function tenantDisplayName(t?: PropertyTenant | null): string {
  if (!t) return "—";
  const n = t.name;
  return n != null && String(n).trim() !== "" ? String(n).trim() : "—";
}

export function tenantInitials(t?: PropertyTenant | null): string {
  const n = tenantDisplayName(t);
  if (n === "—") return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function tenantPhone(t?: PropertyTenant | null): string {
  if (!t) return "—";
  const p = t.phone || t.mobileNumber || (t as any).contactNumber;
  return p != null && String(p).trim() !== "" ? String(p).trim() : "—";
}

export function tenantBlock(t?: any): string {
  if (!t) return "—";
  const b =
    (typeof t.block === "string" ? t.block : t.block?.name) ??
    t.currentStay?.block ??
    t.room?.block ??
    t.roomTenant?.block;
  return b != null && String(b).trim() !== "" && String(b).trim() !== "—" ? String(b).trim() : "—";
}

export function tenantFloor(t?: any): string {
  if (!t) return "—";
  const f =
    (typeof t.floor === "string" ? t.floor : t.floor?.name) ??
    t.currentStay?.floor ??
    t.room?.floor ??
    t.roomTenant?.floor;
  return f != null && String(f).trim() !== "" && String(f).trim() !== "—" ? String(f).trim() : "—";
}

export function tenantRoomNo(t?: any): string {
  if (!t) return "—";
  const r =
    t.roomNumber ??
    t.roomNo ??
    t.currentStay?.roomNumber ??
    t.currentStay?.roomName ??
    (typeof t.room === "string" ? t.room : t.room?.roomNumber ?? t.room?.name) ??
    t.roomTenant?.roomNumber;
  return r != null && String(r).trim() !== "" && String(r).trim() !== "—" ? String(r).trim() : "—";
}

export function tenantBedNo(t?: any): string {
  if (!t) return "—";
  const b =
    t.bedNumber ??
    t.bedNo ??
    t.currentStay?.bedNumber ??
    (typeof t.bed === "string" || typeof t.bed === "number" ? t.bed : t.bed?.bedNumber) ??
    t.roomTenant?.bedNumber ??
    t.roomTenant?.bedNumberOnAssignment;
  if (b === undefined || b === null || String(b).trim() === "" || String(b).trim() === "—") return "—";
  return String(b);
}

export function tenantRentAmount(t?: any): string {
  if (!t) return "—";
  const raw =
    t.monthlyRent ??
    t.currentStay?.rentAmount ??
    t.roomTenant?.rentAmount ??
    t.rentAmount;
  if (raw === undefined || raw === null || String(raw).trim() === "" || String(raw).trim() === "—") return "—";
  const n = Number(raw);
  if (Number.isFinite(n)) return `₹${n.toLocaleString("en-IN")}/mo`;
  return `₹${String(raw)}/mo`;
}

/** Next rent due on same calendar day as `rentDueDate` or `startDate` (monthly, DD MMM YYYY). */
export function tenantRentDueLabel(t?: any): string {
  if (!t) return "—";

  // 1. First priority: cycle due day (1-31)
  const rawDueDay = Number(
    t.rentDueDate ??
    t.currentStay?.rentDueDate ??
    t.roomTenant?.rentDueDate
  );

  // 2. Second priority: start / joining date
  const startIso =
    t.joiningDate ??
    t.moveInDate ??
    t.currentStay?.startDate ??
    t.roomTenant?.startDate ??
    t.startDate;

  let day = 1;
  if (Number.isFinite(rawDueDay) && rawDueDay >= 1 && rawDueDay <= 31) {
    day = rawDueDay;
  } else if (startIso) {
    const start = new Date(startIso);
    if (!Number.isNaN(start.getTime())) {
      day = start.getDate();
    }
  }

  const now = new Date();
  let y = now.getFullYear();
  let mo = now.getMonth();

  // Create date for this month's due day
  const daysInCurrentMonth = new Date(y, mo + 1, 0).getDate();
  let candidate = new Date(y, mo, Math.min(day, daysInCurrentMonth));

  // If this month's due date has already passed, next due date is next month
  if (candidate <= now) {
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
    const daysInNextMonth = new Date(y, mo + 1, 0).getDate();
    candidate = new Date(y, mo, Math.min(day, daysInNextMonth));
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dStr = candidate.getDate().toString().padStart(2, "0");
  const mStr = monthNames[candidate.getMonth()];
  const yStr = candidate.getFullYear();
  return `${dStr} ${mStr} ${yStr}`;
}

export function tenantVerificationLabel(t?: PropertyTenant | null): "verified" | "pending" {
  if (!t) return "pending";
  if (t.kycVerified === true || t.aadhaarVerified === true || (t as any).isKycVerified === true) return "verified";
  return "pending";
}
