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
    const remaining = credits.remaining ?? 0;
    if (remaining <= 0 || credits.isBlocked) {
      items.push({
        id: "credits",
        icon: <Coins className="h-4 w-4" />,
        tone: "danger",
        title: "No verification credits left · Top up",
        description: "Top up to keep sending KYC requests and agreements",
        to: "/tenants/kyc",
        count: 0,
      });
    } else {
      items.push({
        id: "credits",
        icon: <Coins className="h-4 w-4" />,
        tone: "warning",
        title: `Only ${remaining} verification credit${remaining === 1 ? "" : "s"} left`,
        description: "Top up to keep sending KYC requests",
        to: "/tenants/kyc",
        count: remaining,
      });
    }
  }

  const isLoading = loading.rent || loading.tenants || loading.complaints;

  return (
    <div className="register-card p-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--gray-200)]">
        <h3 className="text-md font-semibold text-[var(--gray-900)]">Needs your attention</h3>
        {!isLoading && items.length > 0 ? (
          <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-xs font-medium text-[var(--gray-700)]">
            {items.length}
          </span>
        ) : null}
      </div>
      <div className="pt-3">
        {isLoading && items.length === 0 ? (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border border-[var(--gray-200)] p-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-[var(--gray-200)] p-4 bg-[var(--gray-50)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--gray-900)]">All clear for today</p>
              <p className="text-xs text-[var(--gray-600)]">No pending rent, KYC, complaints or notices right now.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-center gap-3 rounded-md border border-[var(--gray-200)] bg-white p-3 text-left transition-colors hover:border-[var(--brand-600)] hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-semibold",
                      item.tone === "danger"
                        ? "bg-[#FEF1F0] text-[#B42318] border border-[#F6C7C2]"
                        : item.tone === "warning"
                        ? "bg-[#FFF7E6] text-[#A15C07] border border-[#F5D9A8]"
                        : "bg-[#EEF5FF] text-[#1D5FC2] border border-[#BFD6F6]"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--gray-900)] leading-snug">{item.title}</span>
                    <span className="block text-xs text-[var(--gray-600)] mt-0.5">{item.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--gray-400)]" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
