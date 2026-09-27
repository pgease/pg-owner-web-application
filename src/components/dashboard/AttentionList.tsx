import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, IndianRupee, ShieldCheck, MessageSquareWarning, LogOut, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr } from "@/lib/rentDashboard";
import type { DashboardData } from "./useDashboardData";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  icon: ReactNode;
  tone: "danger" | "warning" | "info";
  title: string;
  description: string;
  to: string;
  count: number;
}

const TONE_ICON: Record<AttentionItem["tone"], string> = {
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-amber-700 dark:text-amber-300",
  info: "bg-info/10 text-info",
};

/**
 * "What needs my attention today?" — built only from live counts.
 * Items with a zero count are hidden; when nothing is pending we say so.
 */
export function AttentionList({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { rent, tenants, complaints, kyc, credits, loading } = data;

  const items: AttentionItem[] = [];

  if ((rent.unpaidCount ?? 0) > 0) {
    const amount = rent.pendingAmount != null ? ` · ${formatInr(rent.pendingAmount)} pending` : "";
    items.push({
      id: "rent",
      icon: <IndianRupee />,
      tone: "danger",
      title: `${rent.unpaidCount} tenant${rent.unpaidCount === 1 ? "" : "s"} haven't paid this month's rent`,
      description: `Record a payment or send a reminder${amount}`,
      to: "/rent-payments/dues",
      count: rent.unpaidCount!,
    });
  }

  if (kyc.pendingApplications > 0) {
    items.push({
      id: "kyc-apps",
      icon: <ShieldCheck />,
      tone: "warning",
      title: `${kyc.pendingApplications} KYC application${kyc.pendingApplications === 1 ? "" : "s"} waiting for review`,
      description: "Approve or reject submitted Aadhaar verifications",
      to: "/tenants/kyc",
      count: kyc.pendingApplications,
    });
  } else if (tenants.kycPending > 0) {
    items.push({
      id: "kyc-tenants",
      icon: <ShieldCheck />,
      tone: "warning",
      title: `${tenants.kycPending} tenant${tenants.kycPending === 1 ? "" : "s"} without verified KYC`,
      description: "Send a KYC request so their identity is on record",
      to: "/tenants/kyc",
      count: tenants.kycPending,
    });
  }

  if (complaints.open > 0) {
    items.push({
      id: "complaints",
      icon: <MessageSquareWarning />,
      tone: "warning",
      title: `${complaints.open} open complaint${complaints.open === 1 ? "" : "s"}`,
      description: complaints.inProgress > 0 ? `${complaints.inProgress} more in progress` : "Assign or update their status",
      to: "/complaints",
      count: complaints.open,
    });
  }

  if (tenants.onNotice > 0) {
    items.push({
      id: "notice",
      icon: <LogOut />,
      tone: "info",
      title: `${tenants.onNotice} tenant${tenants.onNotice === 1 ? " is" : "s are"} on notice period`,
      description: "Plan the move-out and settle the security deposit",
      to: "/tenants/notice-period",
      count: tenants.onNotice,
    });
  }

  if (credits.isBlocked || credits.isLow) {
    items.push({
      id: "credits",
      icon: <Coins />,
      tone: credits.isBlocked ? "danger" : "warning",
      title: credits.isBlocked ? "Verification credits exhausted" : `Only ${credits.remaining} verification credit${credits.remaining === 1 ? "" : "s"} left`,
      description: "Top up to keep sending KYC requests",
      to: "/tenants/kyc",
      count: credits.remaining ?? 0,
    });
  }

  const isLoading = loading.rent || loading.tenants || loading.complaints;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Needs your attention</CardTitle>
        {!isLoading && items.length > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && items.length === 0 ? (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border p-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">All clear for today</p>
              <p className="text-xs text-muted-foreground">No pending rent, KYC, complaints or notices right now.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4", TONE_ICON[item.tone])}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-snug">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
