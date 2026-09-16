import type { RentDashboardTenantRow } from "@/api/propertyOwner";

export function parseRentTenantRow(
  row: RentDashboardTenantRow
): { roomTenantId: string; tenantId: string; label: string } | null {
  const rt = row.roomTenantId ?? row.room_tenant_id;
  const tid = row.tenantId ?? row.tenant_id;
  if (!rt || !tid) return null;
  const name = String(row.tenantName ?? row.name ?? row.tenant_name ?? "Tenant");
  const room = row.roomNumber ?? row.room_number;
  const label = room != null && room !== "" ? `${name} · Room ${room}` : name;
  return { roomTenantId: String(rt), tenantId: String(tid), label };
}

export function amountFromRow(row: RentDashboardTenantRow): number | undefined {
  const raw =
    (row as any).amountOutstanding ??
    (row as any).amountDue ??
    (row as any).amount_due ??
    (row as any).pendingAmount ??
    (row as any).rentAmount ??
    (row as any).rent ??
    (row as any).amountPaid ??
    (row as any).amount_paid ??
    (row as any).amount;

  if (raw === undefined || raw === null || String(raw).trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
