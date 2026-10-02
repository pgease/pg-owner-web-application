import { useNavigate } from "react-router-dom";
import { CheckCircle2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatInr } from "@/lib/rentDashboard";
import type { DashboardData } from "./useDashboardData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAX_ROWS = 5;

export function PendingRentCard({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { rent, loading, errors } = data;
  const rows = rent.unpaid.slice(0, MAX_ROWS);
  const remaining = rent.unpaid.length - rows.length;
  const period = `${MONTHS[rent.month - 1]} ${rent.year}`;

  return (
    <div className="register-card p-4">
      <div className="flex flex-row items-center justify-between pb-3 border-b border-[var(--gray-200)]">
        <div>
          <h3 className="text-md font-semibold text-[var(--gray-900)]">Pending rent · {period}</h3>
          {!loading.rent && rent.pendingAmount != null && rent.unpaid.length > 0 ? (
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">{formatInr(rent.pendingAmount)} still to be collected</p>
          ) : null}
        </div>
        {rent.unpaid.length > 0 ? (
          <Button variant="ghost" size="sm" className="h-8 text-[var(--brand-600)] hover:text-[var(--brand-700)]" onClick={() => navigate("/rent-payments/dues")}>
            View all dues
          </Button>
        ) : null}
      </div>
      <div className="pt-2">
        {loading.rent ? (
          <ul className="divide-y divide-[var(--gray-200)]">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-7 w-20" />
              </li>
            ))}
          </ul>
        ) : errors.rent ? (
          <EmptyState
            compact
            icon={<IndianRupee />}
            title="Rent data unavailable"
            description="We couldn't load this month's collection. Open Rent & Payments to try again."
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate("/rent-payments")}>
                Open Rent & Payments
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-[var(--gray-200)] p-4 bg-[var(--gray-50)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--gray-900)]">Everyone has paid for {period}</p>
              <p className="text-xs text-[var(--gray-500)]">
                {rent.collectedThisMonth != null ? `${formatInr(rent.collectedThisMonth)} collected so far.` : "No pending dues right now."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-[var(--gray-200)]">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--gray-900)]">{row.name}</p>
                    <p className="text-xs text-[var(--gray-500)]">{row.roomNumber ? `Room ${row.roomNumber}` : "Room not set"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-[var(--gray-900)]">
                      {row.amount != null ? formatInr(row.amount) : "—"}
                    </span>
                    <StatusBadge status="pending" size="sm" />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        navigate("/rent-payments", {
                          state: { recordForTenantId: row.tenantId, tenantName: row.name },
                        })
                      }
                    >
                      Record
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--gray-200)] pt-3">
              <span className="text-xs text-[var(--gray-500)]">
                {remaining > 0 ? `+${remaining} more tenant${remaining === 1 ? "" : "s"} pending` : `${rows.length} tenant${rows.length === 1 ? "" : "s"} pending`}
              </span>
              <Button size="sm" variant="secondary" onClick={() => navigate("/rent-payments")}>
                Go to Rent Collections
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
