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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Pending rent · {period}</CardTitle>
          {!loading.rent && rent.pendingAmount != null && rent.unpaid.length > 0 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{formatInr(rent.pendingAmount)} still to be collected</p>
          ) : null}
        </div>
        {rent.unpaid.length > 0 ? (
          <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => navigate("/rent-payments/dues")}>
            View all dues
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {loading.rent ? (
          <ul className="divide-y">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
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
              <Button size="sm" variant="outline" onClick={() => navigate("/rent-payments")}>
                Open Rent & Payments
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Everyone has paid for {period}</p>
              <p className="text-xs text-muted-foreground">
                {rent.collectedThisMonth != null ? `${formatInr(rent.collectedThisMonth)} collected so far.` : "No pending dues right now."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.roomNumber ? `Room ${row.roomNumber}` : "Room not set"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">{row.amount != null ? formatInr(row.amount) : "—"}</span>
                    <StatusBadge status="pending" size="sm" />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {remaining > 0 ? `+${remaining} more tenant${remaining === 1 ? "" : "s"} pending` : `${rows.length} tenant${rows.length === 1 ? "" : "s"} pending`}
              </span>
              <Button size="sm" onClick={() => navigate("/rent-payments")}>
                Record a payment
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
