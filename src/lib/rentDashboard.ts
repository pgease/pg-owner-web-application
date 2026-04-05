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
  const n =
    row.amountDue ??
    row.amount_due ??
    row.pendingAmount ??
    row.amount ??
    row.amountPaid ??
    row.amount_paid;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
