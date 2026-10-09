import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  BedDouble,
  MessageSquareWarning,
  LogOut,
  Calendar,
  Lock,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  CreditCard,
  ChevronRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMonthlyOwnerKpis } from "@/hooks/usePropertyOwnerQueries";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useEntitlements } from "@/hooks/useEntitlements";
import { formatInr } from "@/lib/rentDashboard";
import { cn } from "@/lib/utils";

interface MonthlyKpiDashboardProps {
  propertyId: string | null;
  propertyName?: string;
}

export const MonthlyKpiDashboard: React.FC<MonthlyKpiDashboardProps> = ({
  propertyId,
  propertyName,
}) => {
  const navigate = useNavigate();
  const subAccess = useSubscriptionAccess();
  const entitlements = useEntitlements();
  const isProUser = !entitlements.isLoading && (entitlements.isPro || entitlements.isTrial);

  const [hisaabModalOpen, setHisaabModalOpen] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const { data: kpiData, isLoading, isError, refetch } = useMonthlyOwnerKpis(
    propertyId,
    selectedMonth,
    selectedYear,
  );

  const headline = kpiData?.headlineNumbers;
  const actionItems = kpiData?.actionItems ?? [];
  const pro = kpiData?.proAnalytics;
  const period = kpiData?.period;

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const YEARS = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      {/* ─── Top Bar: Month Context & PG ka Hisaab CTA ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-[#E2E6EA] dark:border-slate-800 rounded-lg p-3 sm:px-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-[#008080]" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            KPI Snapshot:
          </span>
          
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Select KPI Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-8 px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              aria-label="Select KPI Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-8 px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            ({period?.daysInMonth ?? 31} days)
          </span>
          {headline && (headline.moveIns.count > 0 || headline.moveOuts.count > 0) && (
            <Badge variant="outline" className="text-[11px] font-normal border-slate-200">
              {headline.moveIns.count} Move-ins · {headline.moveOuts.count} Move-outs
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5 border-[#008080] text-[#008080] hover:bg-[#E8F4F4]"
            onClick={() => setHisaabModalOpen(true)}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            PG ka Hisaab (Month-End)
          </Button>
          {!isProUser && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-[11px]">
              <Lock className="h-3 w-3" /> Free Plan
            </Badge>
          )}
        </div>
      </div>

      {/* ─── Section 9a: Free Plan Baseline — 8 Core Operational KPIs ───────── */}
      <section aria-label="Essential month-wise KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Collected (R2) */}
        <MetricDisplay
          label={`Collected (${period?.monthName.slice(0, 3) ?? "This Month"})`}
          value={headline ? headline.collected.formatted : "—"}
          subText="Cash received this month"
          formula={headline?.collected.formula}
          tone="success"
          loading={isLoading}
          to="/rent-payments"
        />

        {/* 2. Pending This Month (R4) */}
        <MetricDisplay
          label={`Pending (${period?.monthName.slice(0, 3) ?? "This Month"})`}
          value={headline ? headline.pendingThisMonth.formatted : "—"}
          subText={headline && headline.pendingThisMonth.value > 0 ? "Awaiting collection" : "All cleared"}
          formula={headline?.pendingThisMonth.formula}
          tone={headline && headline.pendingThisMonth.value > 0 ? "warning" : "default"}
          loading={isLoading}
          to="/rent-payments/dues"
        />

        {/* 3. Collection % (R3) */}
        <MetricDisplay
          label="Collection %"
          value={headline ? headline.collectionPercentage.formatted : "—"}
          subText={
            headline
              ? `${headline.collectionPercentage.value}% of month's dues collected`
              : "Against expected rent"
          }
          formula={headline?.collectionPercentage.formula}
          tone={
            headline && headline.collectionPercentage.value >= 80
              ? "success"
              : headline && headline.collectionPercentage.value >= 50
              ? "warning"
              : "danger"
          }
          loading={isLoading}
          to="/rent-payments"
        />

        {/* 4. Total Outstanding (R5) */}
        <MetricDisplay
          label="Total Outstanding"
          value={headline ? headline.totalOutstanding.formatted : "—"}
          subText={
            headline && headline.totalOutstanding.activeTenantsAmount > 0
              ? `${formatInr(headline.totalOutstanding.activeTenantsAmount)} from active tenants`
              : "All billing cycles"
          }
          formula={headline?.totalOutstanding.formula}
          tone={headline && headline.totalOutstanding.value > 0 ? "danger" : "default"}
          loading={isLoading}
          to="/rent-payments/dues"
        />

        {/* 5. Occupancy % & Vacant Beds (O4 & O3) */}
        <MetricDisplay
          label="Occupancy & Vacancy"
          value={
            headline
              ? `${headline.occupancy.occupiedBeds}/${headline.occupancy.totalBeds} beds`
              : "—"
          }
          subText={
            headline
              ? `${headline.occupancy.formattedPct} occupied (${headline.occupancy.vacantBeds} vacant)`
              : undefined
          }
          formula={headline?.occupancy.formula}
          loading={isLoading}
          to="/my-pgs/structure"
        />

        {/* 6. Under Notice (O5) */}
        <MetricDisplay
          label="Under Notice"
          value={headline ? String(headline.underNotice.count) : "—"}
          subText={
            headline && headline.underNotice.count > 0
              ? `${headline.underNotice.count} vacating soon`
              : "No vacate notices"
          }
          formula={headline?.underNotice.formula}
          tone={headline && headline.underNotice.count > 0 ? "info" : "default"}
          loading={isLoading}
          to="/tenants/notice-period"
        />

        {/* 7. Open Complaints (C3) */}
        <MetricDisplay
          label="Open Complaints"
          value={headline ? String(headline.openComplaints.count) : "—"}
          subText={
            headline && headline.openComplaints.count > 0
              ? `${headline.openComplaints.open} new, ${headline.openComplaints.inProgress} in progress`
              : "All tickets resolved"
          }
          formula={headline?.openComplaints.formula}
          tone={headline && headline.openComplaints.count > 0 ? "danger" : "default"}
          loading={isLoading}
          to="/complaints"
        />

        {/* 8. Deposits Held (Liability) (R11) */}
        <MetricDisplay
          label="Deposits Held (Liability)"
          value={headline ? headline.depositsHeld.formatted : "—"}
          subText="Excluded from income"
          formula={headline?.depositsHeld.formula}
          badge={
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-slate-100 text-slate-600">
              Liability
            </Badge>
          }
          loading={isLoading}
          to="/rent-payments"
        />
      </section>

      {/* ─── Section 9a Item 8: Action Items Today ───────────────────────────── */}
      {actionItems.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Needs Your Attention ({actionItems.length} items)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.to)}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 hover:border-[#008080] hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.tone === "danger"
                        ? "bg-red-500"
                        : item.tone === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                    )}
                  />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-0.5 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Section 9b: Pro Plan Deep Analytics ────────────────────────────── */}
      <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#008080]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Pro Analytics & Revenue Intelligence
            </h3>
            <Badge className="bg-[#008080] text-white text-[10px] py-0 h-4 font-semibold">
              PRO
            </Badge>
          </div>

          {!isProUser && (
            <Button
              size="sm"
              className="text-xs h-7 gap-1 bg-[#008080] hover:bg-[#006666] text-white"
              onClick={() => navigate("/plans")}
            >
              <Sparkles className="h-3 w-3" /> Upgrade for ₹29/bed
            </Button>
          )}
        </div>

        {/* Pro Cards Grid */}
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", !isProUser && "filter blur-[1.5px] select-none pointer-events-none")}>
          {/* Card 1: Overdue Ageing Buckets (R6) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Overdue Ageing Buckets (R6)
              </span>
              <Clock className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">0–15 Days:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? `${pro.overdueAgeing.zeroTo15.count} tenants · ${formatInr(pro.overdueAgeing.zeroTo15.amount)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">16–30 Days:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? `${pro.overdueAgeing.sixteenTo30.count} tenants · ${formatInr(pro.overdueAgeing.sixteenTo30.amount)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">31–60 Days:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? `${pro.overdueAgeing.thirtyOneTo60.count} tenants · ${formatInr(pro.overdueAgeing.thirtyOneTo60.amount)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">60+ Days:</span>
                <span className="font-semibold text-red-600">
                  {pro ? `${pro.overdueAgeing.sixtyPlus.count} tenants · ${formatInr(pro.overdueAgeing.sixtyPlus.amount)}` : "—"}
                </span>
              </div>
            </div>
            {pro && pro.defaultersCount > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                ⚠️ {pro.defaultersCount} chronic defaulters (&gt;10 days overdue)
              </p>
            )}
          </div>

          {/* Card 2: Revenue Lost to Vacancy (O12) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Revenue Lost to Vacancy (O12)
              </span>
              <BedDouble className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-red-600 tabular-nums">
                {pro ? pro.revenueLostToVacancy.formatted : "—"}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {pro ? `${pro.revenueLostToVacancy.vacantBeds} empty beds × daily rent lost this month` : "Calculated daily"}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              💡 Filling these vacant beds would boost your MRR significantly.
            </div>
          </div>

          {/* Card 3: Payment Mode Split (R13) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Mode Split (R13)
              </span>
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">UPI / QR:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? formatInr(pro.paymentModeSplit.upi) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Cash in Hand:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? formatInr(pro.paymentModeSplit.cash) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Bank Transfer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? formatInr(pro.paymentModeSplit.bankTransfer) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pro ? formatInr(pro.paymentModeSplit.gateway) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lock Overlay for Free Plan Users */}
        {!isProUser && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-950/70 rounded-lg p-6 text-center backdrop-blur-[2px]">
            <div className="p-3 bg-amber-100 rounded-full mb-3 text-amber-800">
              <Lock className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unlock Deep Ageing & Profit Analytics
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mt-1 mb-4">
              Get overdue ageing buckets (0–60+ days), vacancy revenue loss alerts, payment mode audits, and 12-month trend reports.
            </p>
            <Button
              className="bg-[#008080] hover:bg-[#006666] text-white gap-2 font-medium"
              onClick={() => navigate("/plans")}
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro for ₹29/bed/month
            </Button>
          </div>
        )}
      </div>

      {/* ─── Section 9c: "PG ka Hisaab" Month-End Report Modal ─────────────── */}
      <Dialog open={hisaabModalOpen} onOpenChange={setHisaabModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileSpreadsheet className="h-5 w-5 text-[#008080]" />
              PG ka Hisaab — {period?.monthName} {period?.year}
            </DialogTitle>
            <DialogDescription>
              Verified month-end summary for {propertyName || "Your Property"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600">Total Rent Collected (Cash Basis):</span>
                <span className="font-semibold text-emerald-600 text-sm">
                  {headline?.collected.formatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600">Pending Dues This Month:</span>
                <span className="font-semibold text-amber-600 text-sm">
                  {headline?.pendingThisMonth.formatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600">Total Outstanding (All Cycles):</span>
                <span className="font-semibold text-red-600 text-sm">
                  {headline?.totalOutstanding.formatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600">Collection Efficiency:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {headline?.collectionPercentage.formatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600">Occupancy Snapshot:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {headline ? `${headline.occupancy.occupiedBeds} occupied / ${headline.occupancy.vacantBeds} vacant (${headline.occupancy.formattedPct})` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Security Deposit Liability:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {headline?.depositsHeld.formatted ?? "—"}
                </span>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-500">
              Powered by PG Ease · Generated on {new Date().toLocaleDateString("en-IN")}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setHisaabModalOpen(false)}>
                Close
              </Button>
              <Button
                size="sm"
                className="bg-[#008080] hover:bg-[#006666] text-white gap-1.5"
                onClick={() => {
                  window.print();
                }}
              >
                <FileText className="h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
