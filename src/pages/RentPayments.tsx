import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Loader2,
  Users,
  Wallet,
  CheckCircle2,
  AlertCircle,
  History,
  Download,
  Send,
  MessageSquare,
  Clock,
  ExternalLink,
  ShieldCheck,
  Receipt,
  FileText,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge, type StatusBadgeProps } from "@/components/common/StatusBadge";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { SearchInput } from "@/components/common/SearchInput";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  usePostManualRentMutation,
  useRentCollectionDashboard,
  usePropertyTenants,
  useRentCollectionHistory,
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { sendWhatsAppRentReminder, type RentDashboardTenantRow } from "@/api/propertyOwner";
import { amountFromRow, formatInr, parseRentTenantRow } from "@/lib/rentDashboard";
import { SharePaymentLinkDialog } from "@/components/tenants/SharePaymentLinkDialog";
import { formatDate, formatINR, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PaymentVerificationItem {
  id: string;
  tenantId: string;
  roomTenantId: string;
  tenantName: string;
  roomNumber: string;
  amountClaimed: number;
  utrNumber: string;
  screenshotUrl?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

// Stored / simulated offline payment proofs for Lite Plan
const INITIAL_VERIFICATIONS: PaymentVerificationItem[] = [
  {
    id: "ver-101",
    tenantId: "t-101",
    roomTenantId: "rt-101",
    tenantName: "Rohan Verma",
    roomNumber: "201",
    amountClaimed: 8500,
    utrNumber: "428910284719",
    submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "ver-102",
    tenantId: "t-102",
    roomTenantId: "rt-102",
    tenantName: "Priya Sharma",
    roomNumber: "105",
    amountClaimed: 9000,
    utrNumber: "UPI/428931982736",
    submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "pending",
  },
];

export const RentPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPgId, properties } = useApp();
  const selectedPg = useMemo(() => {
    return Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;
  }, [properties, selectedPgId]);

  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [density, setDensity] = useState<"default" | "compact">("default");

  // Record Payment Dialog
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [roomTenantId, setRoomTenantId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");

  // Passbook Drawer
  const [passbookDrawerOpen, setPassbookDrawerOpen] = useState(false);
  const [selectedPassbookTenant, setSelectedPassbookTenant] = useState<any | null>(null);

  // Verification Queue
  const [verifications, setVerifications] = useState<PaymentVerificationItem[]>(INITIAL_VERIFICATIONS);
  const [activeVerification, setActiveVerification] = useState<PaymentVerificationItem | null>(null);
  const [verificationDrawerOpen, setVerificationDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Payment Link Dialog
  const [paymentLinkTenant, setPaymentLinkTenant] = useState<{
    propertyId: string;
    roomTenantId: string;
    tenantName?: string;
    roomNumber?: string;
    phone?: string;
  } | null>(null);

  // Queries
  const rentQuery = useRentCollectionDashboard(selectedPgId, month, year);
  const dashboard = rentQuery.data;
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const manualMut = usePostManualRentMutation(selectedPgId);

  // Handle location state prefill (e.g. from Dashboard or Tenants page "Record" click)
  useEffect(() => {
    const s = location.state as { recordForTenantId?: string; tenantName?: string } | null;
    if (s?.recordForTenantId) {
      setTenantId(s.recordForTenantId);
      // Look up corresponding roomTenant
      const tenantRow = tenantsQuery.data?.find((t) => t.id === s.recordForTenantId);
      if (tenantRow) {
        setRoomTenantId(tenantRow.roomTenant?.id || tenantRow.id);
        const rentAmt = tenantRow.monthlyRent || tenantRow.roomTenant?.monthlyRent;
        if (rentAmt) setAmountPaid(String(rentAmt));
      }
      setManualPaymentOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tenantsQuery.data]);

  // Unified Register Rows
  const registerRows = useMemo(() => {
    if (!dashboard) return [];

    const paidList = dashboard.paidTenants || [];
    const unpaidList = dashboard.unpaidTenants || [];

    const combined: Array<{
      id: string;
      tenantId: string;
      roomTenantId: string;
      tenantName: string;
      phone: string;
      roomNumber: string;
      monthlyRent: number;
      amountPaid: number;
      amountDue: number;
      status: "paid" | "partial" | "pending" | "overdue" | "verification_pending";
      dueDate: string;
      overdueDays: number;
      raw: RentDashboardTenantRow;
    }> = [];

    // Paid tenants
    paidList.forEach((item, idx) => {
      const parsed = parseRentTenantRow(item);
      const row = item as any;
      const amtPaid = Number(row.amountPaid) || Number(row.rentAmount) || amountFromRow(item) || 0;
      const rent = Number(row.monthlyRent) || amtPaid;
      const room = String(item.roomNumber ?? item.room_number ?? "—");
      const name = parsed?.label || item.tenantName || item.name || `Tenant #${idx + 1}`;
      const phone = String(item.phone || item.mobile || "");

      combined.push({
        id: `paid-${item.id || idx}`,
        tenantId: parsed?.tenantId || item.tenantId || String(item.id || idx),
        roomTenantId: parsed?.roomTenantId || item.roomTenantId || String(item.id || idx),
        tenantName: name,
        phone,
        roomNumber: room,
        monthlyRent: rent,
        amountPaid: amtPaid,
        amountDue: 0,
        status: "paid",
        dueDate: `05 ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`,
        overdueDays: 0,
        raw: item,
      });
    });

    // Unpaid tenants
    unpaidList.forEach((item, idx) => {
      const parsed = parseRentTenantRow(item);
      const row = item as any;
      const dueAmt = Number(row.amountOutstanding) || Number(row.amountDue) || Number(row.rentAmount) || amountFromRow(item) || 0;

      // P0 Bug 6: Exclude ₹0 tenants from Pending
      if (dueAmt <= 0) return;

      const amtPaid = Number(row.amountPaid) || 0;
      const rent = dueAmt + amtPaid;
      const room = String(item.roomNumber ?? item.room_number ?? "—");
      const name = parsed?.label || item.tenantName || item.name || `Tenant #${idx + 1}`;
      const phone = String(item.phone || item.mobile || "");

      // Check if UTR verification is pending for this tenant
      const hasPendingVerification = verifications.some(
        (v) => (v.tenantId === parsed?.tenantId || v.tenantName.toLowerCase() === name.toLowerCase()) && v.status === "pending"
      );

      const dueDayRaw = row.rentDueDate ?? row.dueDay ?? row.rent_due_date ?? 5;
      const dueDay = Number(dueDayRaw) || 5;
      const dueDateObj = new Date(year, month - 1, dueDay);
      const overdueDays = Math.max(0, Math.floor((Date.now() - dueDateObj.getTime()) / 86400000));

      let st: "paid" | "partial" | "pending" | "overdue" | "verification_pending" = "pending";
      if (hasPendingVerification) {
        st = "verification_pending";
      } else if (amtPaid > 0 && dueAmt > 0) {
        st = "partial";
      } else if (overdueDays > 0) {
        st = "overdue";
      }

      combined.push({
        id: `unpaid-${item.id || idx}`,
        tenantId: parsed?.tenantId || item.tenantId || String(item.id || idx),
        roomTenantId: parsed?.roomTenantId || item.roomTenantId || String(item.id || idx),
        tenantName: name,
        phone,
        roomNumber: room,
        monthlyRent: rent,
        amountPaid: amtPaid,
        amountDue: dueAmt,
        status: st,
        dueDate: `${String(dueDay).padStart(2, "0")} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`,
        overdueDays,
        raw: item,
      });
    });

    return combined;
  }, [dashboard, month, year, verifications]);

  // Counts by status
  const counts = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;
    let overdue = 0;
    let verification = 0;

    for (const r of registerRows) {
      if (r.status === "paid") paid++;
      else if (r.status === "partial") partial++;
      else if (r.status === "verification_pending") verification++;
      else if (r.status === "overdue") overdue++;
      else pending++;
    }

    return {
      all: registerRows.length,
      paid,
      partial,
      pending,
      overdue,
      verification,
    };
  }, [registerRows]);

  // Filtered register
  const filteredRows = useMemo(() => {
    return registerRows.filter((r) => {
      // Status filter
      if (statusFilter === "paid" && r.status !== "paid") return false;
      if (statusFilter === "partial" && r.status !== "partial") return false;
      if (statusFilter === "pending" && r.status !== "pending") return false;
      if (statusFilter === "overdue" && r.status !== "overdue") return false;
      if (statusFilter === "verification_pending" && r.status !== "verification_pending") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const blob = `${r.tenantName} ${r.phone} ${r.roomNumber}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [registerRows, statusFilter, searchQuery]);

  // Operational metrics
  const totalCollected = useMemo(() => {
    return registerRows.reduce((sum, r) => sum + r.amountPaid, 0);
  }, [registerRows]);

  const totalPending = useMemo(() => {
    return registerRows.filter((r) => r.status === "pending" || r.status === "partial").reduce((sum, r) => sum + r.amountDue, 0);
  }, [registerRows]);

  const totalOverdue = useMemo(() => {
    return registerRows.filter((r) => r.status === "overdue").reduce((sum, r) => sum + r.amountDue, 0);
  }, [registerRows]);

  // Record Payment Submission
  const handleRecordPayment = async () => {
    if (!selectedPgId) {
      toast({ title: "Select a PG", variant: "destructive" });
      return;
    }
    const amt = parseFloat(amountPaid);
    if (!roomTenantId.trim() || !tenantId.trim() || !Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Select tenant and enter a valid payment amount", variant: "destructive" });
      return;
    }

    try {
      await manualMut.mutateAsync({
        roomTenantId: roomTenantId.trim(),
        tenantId: tenantId.trim(),
        periodMonth: month,
        periodYear: year,
        amountPaid: amt,
      });

      toast({
        title: "Payment recorded successfully",
        description: `Credited ${formatINR(amt)} to tenant register.`,
      });
      setManualPaymentOpen(false);
      setAmountPaid("");
      setPaymentReference("");
      void rentQuery.refetch();
    } catch (e: any) {
      toast({
        title: "Could not record payment",
        description: e?.message || "Please check details and try again.",
        variant: "destructive",
      });
    }
  };

  // UTR Proof Approval
  const handleApproveVerification = async (item: PaymentVerificationItem) => {
    try {
      await manualMut.mutateAsync({
        roomTenantId: item.roomTenantId,
        tenantId: item.tenantId,
        periodMonth: month,
        periodYear: year,
        amountPaid: item.amountClaimed,
      });

      setVerifications((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, status: "approved" as const } : v))
      );

      toast({
        title: "Payment proof verified & approved",
        description: `UTR ${item.utrNumber} verified for ${item.tenantName}. Credited ${formatINR(item.amountClaimed)}.`,
      });
      setVerificationDrawerOpen(false);
      void rentQuery.refetch();
    } catch (e: any) {
      toast({
        title: "Could not approve verification",
        description: e?.message || "Network error. Try again.",
        variant: "destructive",
      });
    }
  };

  // UTR Proof Rejection
  const handleRejectVerification = () => {
    if (!activeVerification) return;
    setVerifications((prev) =>
      prev.map((v) =>
        v.id === activeVerification.id
          ? { ...v, status: "rejected" as const, rejectionReason: rejectionReason || "UTR reference not found in bank ledger" }
          : v
      )
    );
    toast({
      title: "Payment proof rejected",
      description: `Tenant will be notified to resubmit valid transaction reference.`,
      variant: "destructive",
    });
    setRejectModalOpen(false);
    setVerificationDrawerOpen(false);
    setRejectionReason("");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = ["Tenant", "Phone", "Room", "Monthly Rent", "Paid", "Due", "Status", "Due Date"];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...filteredRows.map((r) =>
          [
            `"${r.tenantName}"`,
            `"${r.phone}"`,
            `"${r.roomNumber}"`,
            `"${r.monthlyRent}"`,
            `"${r.amountPaid}"`,
            `"${r.amountDue}"`,
            `"${r.status}"`,
            `"${r.dueDate}"`,
          ].join(",")
        ),
      ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Rent_Register_${MONTH_NAMES[month - 1]}_${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Passbook for row
  const openPassbook = (row: any) => {
    setSelectedPassbookTenant(row);
    setPassbookDrawerOpen(true);
  };

  return (
    <CanAccessPage permission="account_view_dues">
      <div className="space-y-5 pb-8 max-w-7xl">
        {/* Main Header */}
        <PageHeader
          title="Rent & Payments"
          description={`Rent register, verification queue and payment ledger for ${MONTH_NAMES[month - 1]} ${year}.`}
          actions={
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setRoomTenantId("");
                setTenantId("");
                setAmountPaid("");
                setManualPaymentOpen(true);
              }}
              disabled={!selectedPgId}
            >
              <IndianRupee className="h-4 w-4" /> Record payment
            </Button>
          }
        />

        {/* Operational Metrics (No vanity metrics like All-Time Revenue here) */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricDisplay
            label={`Collected (${MONTH_NAMES[month - 1].slice(0, 3)})`}
            value={formatINR(totalCollected)}
            subText={`${counts.paid} paid of ${counts.all} tenants`}
            tone="success"
            loading={rentQuery.isLoading}
          />
          <MetricDisplay
            label={`Pending (${MONTH_NAMES[month - 1].slice(0, 3)})`}
            value={formatINR(totalPending)}
            subText={`${counts.pending + counts.partial} pending collection`}
            tone={counts.pending > 0 ? "warning" : "default"}
            loading={rentQuery.isLoading}
          />
          <MetricDisplay
            label="Overdue rent"
            value={formatINR(totalOverdue)}
            subText={`${counts.overdue} tenant${counts.overdue === 1 ? "" : "s"} overdue`}
            tone={counts.overdue > 0 ? "danger" : "default"}
            loading={rentQuery.isLoading}
          />
          <MetricDisplay
            label="Verification queue"
            value={verifications.filter((v) => v.status === "pending").length}
            subText="Lite manual UTR proofs"
            tone={verifications.filter((v) => v.status === "pending").length > 0 ? "warning" : "default"}
            to="#verification-queue"
          />
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--gray-700)]">Period:</span>
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v, 10))}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((mName, idx) => (
                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                    {mName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
              <SelectTrigger className="w-[95px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[year - 1, year, year + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verification Queue Quick Alert */}
          {verifications.filter((v) => v.status === "pending").length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-sm">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>{verifications.filter((v) => v.status === "pending").length} payment proof(s)</strong> waiting for UTR review.
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("verification_pending")}
                className="underline font-semibold ml-1 text-amber-900 hover:text-black"
              >
                Review now
              </button>
            </div>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              ["all", `All (${counts.all})`],
              ["paid", `Paid (${counts.paid})`],
              ["partial", `Partially Paid (${counts.partial})`],
              ["pending", `Pending (${counts.pending})`],
              ["overdue", `Overdue (${counts.overdue})`],
              ["verification_pending", `Verification Queue (${counts.verification})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors tabular-nums whitespace-nowrap",
                statusFilter === key
                  ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold border border-[var(--brand-100)]"
                  : "text-[var(--gray-600)] hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Toolbar: Search, Density Toggle, Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tenant, room or phone…"
            className="w-full sm:w-72"
          />

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Density Toggle */}
            <div className="flex rounded-md border border-[var(--gray-300)] p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setDensity("default")}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm transition-colors",
                  density === "default"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-medium"
                    : "text-[var(--gray-500)] hover:text-[var(--gray-900)]",
                )}
                title="Default row height"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm transition-colors",
                  density === "compact"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-medium"
                    : "text-[var(--gray-500)] hover:text-[var(--gray-900)]",
                )}
                title="Compact row height"
              >
                Compact
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 h-9 text-xs"
              disabled={filteredRows.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Single Rent Register DataTable */}
        <DataTable
          columns={[
            {
              id: "tenant",
              header: "Tenant",
              sortable: true,
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center font-semibold text-xs shrink-0">
                    {row.tenantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-medium text-[var(--gray-900)] truncate">
                      {row.tenantName}
                    </span>
                    <span className="block text-xs text-[var(--gray-500)] tabular-nums">
                      {row.phone || "—"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              id: "room",
              header: "Room",
              render: (row) => (
                <span className="font-medium text-[var(--gray-900)]">
                  {row.roomNumber !== "—" ? `Room ${row.roomNumber}` : "—"}
                </span>
              ),
            },
            {
              id: "monthlyRent",
              header: "Rent",
              align: "right",
              render: (row) => (
                <span className="tabular-nums text-[var(--gray-700)]">
                  {formatINR(row.monthlyRent)}
                </span>
              ),
            },
            {
              id: "amountPaid",
              header: "Paid",
              align: "right",
              render: (row) => (
                <span className="tabular-nums font-medium text-emerald-700">
                  {row.amountPaid > 0 ? formatINR(row.amountPaid) : "—"}
                </span>
              ),
            },
            {
              id: "amountDue",
              header: "Due",
              align: "right",
              render: (row) => (
                <span
                  className={cn(
                    "tabular-nums font-semibold",
                    row.amountDue > 0 ? "text-[#B42318]" : "text-[var(--gray-400)]"
                  )}
                >
                  {row.amountDue > 0 ? formatINR(row.amountDue) : "₹0"}
                </span>
              ),
            },
            {
              id: "status",
              header: "Status",
              render: (row) => {
                let badgeStatus: StatusBadgeProps["status"] = "pending";
                let badgeLabel: string | undefined;

                if (row.status === "paid") {
                  badgeStatus = "paid";
                } else if (row.status === "partial") {
                  badgeStatus = "partially_paid";
                  badgeLabel = `Partial (${formatINR(row.amountPaid)})`;
                } else if (row.status === "verification_pending") {
                  badgeStatus = "verification_pending";
                  badgeLabel = "UTR Verification";
                } else if (row.status === "overdue") {
                  badgeStatus = "overdue";
                  badgeLabel = `Overdue ${row.overdueDays}d`;
                }

                return <StatusBadge status={badgeStatus} label={badgeLabel} size="sm" />;
              },
            },
            {
              id: "dueDate",
              header: "Due Date",
              align: "right",
              render: (row) => (
                <span className="tabular-nums text-xs text-[var(--gray-500)]">
                  {row.dueDate}
                </span>
              ),
            },
            {
              id: "actions",
              header: "",
              align: "right",
              render: (row) => {
                const isPaid = row.status === "paid";
                const isVerification = row.status === "verification_pending";

                return (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {isVerification ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                        onClick={() => {
                          const v = verifications.find((item) => item.tenantId === row.tenantId || item.tenantName === row.tenantName);
                          if (v) {
                            setActiveVerification(v);
                            setVerificationDrawerOpen(true);
                          }
                        }}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" /> Review UTR
                      </Button>
                    ) : !isPaid ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => {
                          setTenantId(row.tenantId);
                          setRoomTenantId(row.roomTenantId);
                          setAmountPaid(String(row.amountDue));
                          setManualPaymentOpen(true);
                        }}
                      >
                        Record
                      </Button>
                    ) : null}

                    <ActionMenu
                      items={[
                        {
                          label: "View passbook (ledger)",
                          icon: <Receipt className="h-3.5 w-3.5" />,
                          onClick: () => openPassbook(row),
                        },
                        ...(!isPaid
                          ? [
                              {
                                label: "Record payment",
                                icon: <IndianRupee className="h-3.5 w-3.5" />,
                                onClick: () => {
                                  setTenantId(row.tenantId);
                                  setRoomTenantId(row.roomTenantId);
                                  setAmountPaid(String(row.amountDue));
                                  setManualPaymentOpen(true);
                                },
                              },
                              {
                                label: "Send WhatsApp reminder",
                                icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />,
                                onClick: async () => {
                                  if (selectedPgId && row.roomTenantId) {
                                    try {
                                      const res = await sendWhatsAppRentReminder(selectedPgId, row.roomTenantId, { customAmount: row.amountDue });
                                      toast({ title: "WhatsApp reminder sent", description: res?.message });
                                      return;
                                    } catch {}
                                  }
                                  const text = encodeURIComponent(
                                    `Hi ${row.tenantName}, gentle reminder that your PG rent of ${formatINR(row.amountDue)} is pending for ${MONTH_NAMES[month - 1]} ${year}. Please pay via UPI.`
                                  );
                                  window.open(`https://wa.me/91${row.phone.replace(/\D/g, "")}?text=${text}`, "_blank");
                                },
                              },
                              {
                                label: "Share payment link",
                                icon: <LinkIcon className="h-3.5 w-3.5 text-[var(--brand-600)]" />,
                                onClick: () => {
                                  if (selectedPgId) {
                                    setPaymentLinkTenant({
                                      propertyId: selectedPgId,
                                      roomTenantId: row.roomTenantId,
                                      tenantName: row.tenantName,
                                      roomNumber: row.roomNumber,
                                      phone: row.phone,
                                    });
                                  }
                                },
                              },
                            ]
                          : []),
                        {
                          label: "Open tenant profile",
                          icon: <ExternalLink className="h-3.5 w-3.5" />,
                          onClick: () => navigate(`/tenants/${row.tenantId}`),
                        },
                      ]}
                    />
                  </div>
                );
              },
            },
          ]}
          data={filteredRows}
          keyExtractor={(r) => r.id}
          loading={rentQuery.isLoading}
          density={density}
          onRowClick={(row) => openPassbook(row)}
          emptyState={
            <EmptyState
              title={registerRows.length === 0 ? "No rent entries for this month" : "No tenants match this filter"}
              description={
                registerRows.length === 0
                  ? `There are no tenant records active for ${MONTH_NAMES[month - 1]} ${year}.`
                  : "All tenants are settled or there are no records for this status."
              }
              action={
                statusFilter !== "all" ? (
                  <Button variant="secondary" size="sm" onClick={() => setStatusFilter("all")}>
                    Show all tenants
                  </Button>
                ) : undefined
              }
            />
          }
        />

        {/* Passbook / Ledger Slide-Over Drawer */}
        <Sheet open={passbookDrawerOpen} onOpenChange={setPassbookDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-[var(--gray-200)] shadow-overlay">
            <SheetHeader className="p-4 sm:p-5 border-b border-[var(--gray-200)] bg-[var(--gray-50)] text-left shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-base font-semibold text-[var(--gray-900)]">
                    {selectedPassbookTenant?.tenantName} · Passbook
                  </SheetTitle>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    Room {selectedPassbookTenant?.roomNumber} · Permanent Ledger
                  </p>
                </div>
                <StatusBadge
                  status={selectedPassbookTenant?.status === "paid" ? "paid" : "pending"}
                  size="sm"
                />
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Financial Summary */}
              <div className="register-card p-3.5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--gray-500)] block">Rent Cycle</span>
                  <span className="font-semibold text-[var(--gray-900)]">
                    {MONTH_NAMES[month - 1]} {year}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--gray-500)] block">Monthly Rent</span>
                  <span className="font-semibold text-[var(--gray-900)] tabular-nums">
                    {formatINR(selectedPassbookTenant?.monthlyRent)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--gray-500)] block">Amount Cleared</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {formatINR(selectedPassbookTenant?.amountPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--gray-500)] block">Current Balance Due</span>
                  <span className="font-semibold text-[#B42318] tabular-nums">
                    {formatINR(selectedPassbookTenant?.amountDue)}
                  </span>
                </div>
              </div>

              {/* Ledger Entries */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider block">
                  Transaction Entries
                </span>

                <div className="border border-[var(--gray-200)] rounded-md divide-y divide-[var(--gray-200)] text-xs bg-white">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--gray-900)]">Monthly Rent Invoice Raised</p>
                      <p className="text-[11px] text-[var(--gray-500)]">
                        Due by {selectedPassbookTenant?.dueDate}
                      </p>
                    </div>
                    <span className="font-semibold text-[#B42318] tabular-nums">
                      -{formatINR(selectedPassbookTenant?.monthlyRent)}
                    </span>
                  </div>

                  {selectedPassbookTenant?.amountPaid > 0 && (
                    <div className="p-3 flex items-center justify-between bg-emerald-50/40">
                      <div>
                        <p className="font-medium text-[var(--gray-900)]">Rent Payment Credited</p>
                        <p className="text-[11px] text-emerald-700">
                          Direct Payment / Manual Entry
                        </p>
                      </div>
                      <span className="font-semibold text-emerald-700 tabular-nums">
                        +{formatINR(selectedPassbookTenant?.amountPaid)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[var(--brand-600)]"
                onClick={() => {
                  setPassbookDrawerOpen(false);
                  navigate(`/tenants/${selectedPassbookTenant?.tenantId}`);
                }}
              >
                Full Profile <ExternalLink className="h-3 w-3 ml-1" />
              </Button>

              {selectedPassbookTenant?.amountDue > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPassbookDrawerOpen(false);
                    setTenantId(selectedPassbookTenant.tenantId);
                    setRoomTenantId(selectedPassbookTenant.roomTenantId);
                    setAmountPaid(String(selectedPassbookTenant.amountDue));
                    setManualPaymentOpen(true);
                  }}
                >
                  <IndianRupee className="h-3.5 w-3.5 mr-1" /> Record payment
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Payment Verification Proof Drawer (Lite Plan UTR Approval Desk) */}
        <Sheet open={verificationDrawerOpen} onOpenChange={setVerificationDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-[var(--gray-200)] shadow-overlay">
            <SheetHeader className="p-4 sm:p-5 border-b border-[var(--gray-200)] bg-[var(--gray-50)] text-left shrink-0">
              <SheetTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" /> Payment Proof Verification
              </SheetTitle>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                Verify tenant-submitted UTR and bank reference before crediting the rent register.
              </p>
            </SheetHeader>

            {activeVerification && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {/* Claim details */}
                <div className="register-card p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--gray-500)]">Tenant Name</span>
                    <span className="font-semibold text-[var(--gray-900)]">{activeVerification.tenantName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--gray-500)]">Room</span>
                    <span className="font-semibold text-[var(--gray-900)]">Room {activeVerification.roomNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--gray-500)]">Amount Claimed</span>
                    <span className="font-bold text-sm text-[var(--gray-900)] tabular-nums">
                      {formatINR(activeVerification.amountClaimed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[var(--gray-200)]">
                    <span className="text-[var(--gray-500)]">UTR / Ref Number</span>
                    <span className="font-mono font-bold text-[var(--brand-700)] bg-[var(--brand-50)] px-2 py-0.5 rounded-sm">
                      {activeVerification.utrNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--gray-500)]">Submitted At</span>
                    <span className="text-[var(--gray-600)] tabular-nums">
                      {formatDate(activeVerification.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* Screenshot Preview */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--gray-700)] block">
                    Payment Screenshot / Receipt
                  </span>
                  <div className="border border-[var(--gray-200)] rounded-md bg-[var(--gray-50)] p-6 text-center text-[var(--gray-500)] space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-white border border-[var(--gray-200)] flex items-center justify-center text-[var(--gray-400)]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <p className="font-medium text-[var(--gray-800)]">UPI Payment Screenshot</p>
                    <p className="text-[11px]">UTR: {activeVerification.utrNumber}</p>
                    <p className="text-[11px] text-[var(--gray-400)]">Uploaded by tenant via Lite QR payment</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="text-[#B42318] hover:bg-[#FEF1F0]"
                onClick={() => setRejectModalOpen(true)}
              >
                Reject Proof
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => activeVerification && handleApproveVerification(activeVerification)}
                disabled={manualMut.isPending}
              >
                <Check className="h-4 w-4" /> Approve & Credit Rent
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Reject Verification Dialog */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-[#B42318] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Reject Payment Proof
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Please enter a reason for rejecting this UTR claim. The tenant will be notified on WhatsApp to resubmit.
              </p>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label className="text-xs">Rejection Reason</Label>
              <Textarea
                placeholder="e.g. UTR not reflected in ICICI bank account statement"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRejectVerification}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Offline / Manual Payment Dialog */}
        <Dialog open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[var(--brand-600)]" /> Record Rent Payment
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)]">
                Record payment received directly via Cash, UPI QR or Bank Transfer for {MONTH_NAMES[month - 1]} {year}.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Tenant *</Label>
                <Select
                  value={tenantId}
                  onValueChange={(val) => {
                    setTenantId(val);
                    const row = registerRows.find((r) => r.tenantId === val);
                    if (row) {
                      setRoomTenantId(row.roomTenantId);
                      setAmountPaid(String(row.amountDue > 0 ? row.amountDue : row.monthlyRent));
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {registerRows.map((r) => (
                      <SelectItem key={r.tenantId} value={r.tenantId}>
                        {r.tenantName} (Room {r.roomNumber} · Due: {formatINR(r.amountDue)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount Paid (₹) *</Label>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="8500"
                    className="h-9 text-xs"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI / QR Code</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reference / UTR Number (Optional)</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 428910284719"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setManualPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRecordPayment}
                disabled={manualMut.isPending || !tenantId || !amountPaid}
              >
                {manualMut.isPending ? "Recording…" : "Save Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Payment Link Dialog */}
        {paymentLinkTenant && (
          <SharePaymentLinkDialog
            open={Boolean(paymentLinkTenant)}
            onOpenChange={(open) => {
              if (!open) setPaymentLinkTenant(null);
            }}
            propertyId={paymentLinkTenant.propertyId}
            roomTenantId={paymentLinkTenant.roomTenantId}
            tenantName={paymentLinkTenant.tenantName}
            roomNumber={paymentLinkTenant.roomNumber}
            phone={paymentLinkTenant.phone}
          />
        )}
      </div>
    </CanAccessPage>
  );
};

export default RentPayments;
