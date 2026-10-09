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
  Printer,
  Copy,
  Calendar,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  User,
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
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import {
  sendWhatsAppRentReminder,
  type RentDashboardTenantRow,
  type RentCollectionHistoryItem,
  type RentCollectionHistoryParams,
} from "@/api/propertyOwner";
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
  const entitlements = useEntitlements();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredFeature, setTrialExpiredFeature] = useState("");

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
  const [paymentMode, setPaymentMode] = useState("cash");

  const handleOpenRecordPayment = (row?: RentDashboardTenantRow) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Record Payment");
      setTrialExpiredOpen(true);
      return;
    }
    if (row) {
      setRoomTenantId(row.roomTenantId);
      setTenantId(row.tenantId);
      setAmountPaid(String(row.amountDue || ""));
    } else {
      setRoomTenantId("");
      setTenantId("");
      setAmountPaid("");
    }
    setManualPaymentOpen(true);
  };

  const handleSendWhatsAppReminder = async (row: RentDashboardTenantRow) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("WhatsApp Reminders");
      setTrialExpiredOpen(true);
      return;
    }
    if (!entitlements.hasFeature("whatsapp_notifications")) {
      toast({
        title: "Pro Feature: WhatsApp Reminders",
        description: "Automated WhatsApp rent reminders are available exclusively on the Pro plan. Please upgrade to Pro to enable this feature.",
        variant: "destructive",
      });
      navigate("/plans");
      return;
    }
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
  };

  const handleSharePaymentLink = (row: RentDashboardTenantRow) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Payment Links");
      setTrialExpiredOpen(true);
      return;
    }
    if (!entitlements.hasFeature("payment_gateway_collection")) {
      toast({
        title: "Pro Feature: Payment Links",
        description: "Payment link collection is available exclusively on the Pro plan. Please upgrade to Pro to enable instant payment links.",
        variant: "destructive",
      });
      navigate("/plans");
      return;
    }
    if (selectedPgId) {
      setPaymentLinkTenant({
        propertyId: selectedPgId,
        roomTenantId: row.roomTenantId,
        tenantName: row.tenantName,
        roomNumber: row.roomNumber,
        phone: row.phone,
        amount: row.amountDue,
        monthYear: `${MONTH_NAMES[month - 1]} ${year}`,
      });
    }
  };

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

  // Navigation & Tab Switcher (Monthly Register vs Payment History Ledger)
  const [activeTab, setActiveTab] = useState<"register" | "history">(() => {
    return location.pathname.endsWith("/history") ? "history" : "register";
  });

  // History Query State (GET /api/property-owners/properties/{propertyId}/rent-collections/history)
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"all" | "paid" | "partial" | "pending">("all");
  const [historyMonth, setHistoryMonth] = useState<string>("all");
  const [historyYear, setHistoryYear] = useState<string>("all");
  const [historySortBy, setHistorySortBy] = useState<"paidAt" | "createdAt" | "periodMonth">("paidAt");
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<RentCollectionHistoryItem | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Synchronize status filter and active tab when arriving via sub-routes
  useEffect(() => {
    if (location.pathname.endsWith("/history")) {
      setActiveTab("history");
    } else {
      setActiveTab("register");
      if (location.pathname.endsWith("/dues")) {
        setStatusFilter("pending");
      }
    }
  }, [location.pathname]);

  const handleTabChange = (tab: "register" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      navigate("/rent-payments/history");
    } else {
      navigate("/rent-payments");
    }
  };

  // Rent Collection History params & query
  const historyParams = useMemo<RentCollectionHistoryParams>(() => {
    const p: RentCollectionHistoryParams = {
      page: historyPage,
      limit: historyLimit,
      sortBy: historySortBy,
      sortOrder: historySortOrder,
    };
    if (historySearch.trim()) p.search = historySearch.trim();
    if (historyStatus !== "all") p.status = historyStatus;
    if (historyMonth !== "all") p.periodMonth = parseInt(historyMonth, 10);
    if (historyYear !== "all") p.periodYear = parseInt(historyYear, 10);
    if (historyStartDate) p.startDate = historyStartDate;
    if (historyEndDate) p.endDate = historyEndDate;
    return p;
  }, [
    historyPage,
    historyLimit,
    historySortBy,
    historySortOrder,
    historySearch,
    historyStatus,
    historyMonth,
    historyYear,
    historyStartDate,
    historyEndDate,
  ]);

  const historyQuery = useRentCollectionHistory(
    activeTab === "history" ? selectedPgId : null,
    historyParams
  );

  // Live Historical Ledger for Tenant in Passbook Drawer
  const tenantPassbookQuery = useRentCollectionHistory(
    passbookDrawerOpen && selectedPassbookTenant?.tenantId ? selectedPgId : null,
    {
      tenantId: selectedPassbookTenant?.tenantId,
      limit: 50,
      sortBy: "paidAt",
      sortOrder: "desc",
    }
  );

  // Unified Register Rows
  const registerRows = useMemo(() => {
    const paidList = dashboard?.paidTenants || (dashboard as any)?.data?.paidTenants || [];
    const unpaidList = dashboard?.unpaidTenants || (dashboard as any)?.data?.unpaidTenants || [];

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
    paidList.forEach((item: any, idx: number) => {
      const parsed = parseRentTenantRow(item);
      const row = item as any;
      const amtPaid = Number(row.amountPaid) || Number(row.rentAmount) || amountFromRow(item) || 0;
      const rent = Number(row.monthlyRent) || amtPaid;
      const room = String(item.roomNumber ?? item.room_number ?? "—");
      const name = item.tenantName || item.name || item.tenant_name || (parsed?.label ? parsed.label.split(" · ")[0] : `Tenant #${idx + 1}`);
      const phone = String(item.phone || item.mobile || item.tenantPhone || item.tenant_phone || "");

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
    unpaidList.forEach((item: any, idx: number) => {
      const parsed = parseRentTenantRow(item);
      const row = item as any;
      const rawRent = Number(row.monthlyRent) || Number(row.rentAmount) || Number(row.rent) || 0;
      const amtPaid = Number(row.amountPaid) || 0;
      const dueAmt = Number(row.amountOutstanding) ?? Number(row.amountDue) ?? (rawRent > amtPaid ? rawRent - amtPaid : amountFromRow(item) ?? 0);
      const effectiveDue = dueAmt > 0 ? dueAmt : Math.max(0, rawRent - amtPaid);

      const rent = rawRent > 0 ? rawRent : (effectiveDue + amtPaid);
      const room = String(item.roomNumber ?? item.room_number ?? "—");
      const name = item.tenantName || item.name || item.tenant_name || (parsed?.label ? parsed.label.split(" · ")[0] : `Tenant #${idx + 1}`);
      const phone = String(item.phone || item.mobile || item.tenantPhone || item.tenant_phone || "");

      const tId = parsed?.tenantId || item.tenantId || String(item.id || idx);

      // Check if UTR verification is pending for this tenant
      const hasPendingVerification = verifications.some(
        (v) => (v.tenantId === tId || v.tenantName.toLowerCase() === name.toLowerCase()) && v.status === "pending"
      );

      const dueDayRaw = row.rentDueDate ?? row.dueDay ?? row.rent_due_date ?? 5;
      const dueDay = Number(dueDayRaw) || 5;
      const dueDateObj = new Date(year, month - 1, dueDay);
      const overdueDays = Math.max(0, Math.floor((Date.now() - dueDateObj.getTime()) / 86400000));

      let st: "paid" | "partial" | "pending" | "overdue" | "verification_pending" = "pending";
      if (hasPendingVerification) {
        st = "verification_pending";
      } else if (amtPaid > 0 && effectiveDue > 0) {
        st = "partial";
      } else if (overdueDays > 0) {
        st = "overdue";
      }

      combined.push({
        id: `unpaid-${item.id || idx}`,
        tenantId: tId,
        roomTenantId: parsed?.roomTenantId || item.roomTenantId || String(item.id || idx),
        tenantName: name,
        phone,
        roomNumber: room,
        monthlyRent: rent,
        amountPaid: amtPaid,
        amountDue: effectiveDue,
        status: st,
        dueDate: `${String(dueDay).padStart(2, "0")} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`,
        overdueDays,
        raw: item,
      });
    });

    // Fallback: Merge active property tenants if missing from dashboard
    if (tenantsQuery.data && Array.isArray(tenantsQuery.data)) {
      const existingTenantIds = new Set(combined.map((c) => c.tenantId));
      tenantsQuery.data.forEach((t: any, idx: number) => {
        const tId = t.id || t.tenantId;
        if (!tId || existingTenantIds.has(tId)) return;

        const rent = Number(t.monthlyRent || t.roomTenant?.monthlyRent || t.rent || 0);
        const name = t.name || t.tenantName || `Tenant #${idx + 1}`;
        const phone = String(t.phone || t.mobile || t.tenantPhone || "");
        const room = String(t.roomNumber || t.room_number || t.room?.roomNumber || "—");
        const roomTenantId = t.roomTenant?.id || t.roomTenantId || tId;

        const dueDayRaw = t.rentDueDate ?? t.dueDay ?? 5;
        const dueDay = Number(dueDayRaw) || 5;
        const dueDateObj = new Date(year, month - 1, dueDay);
        const overdueDays = Math.max(0, Math.floor((Date.now() - dueDateObj.getTime()) / 86400000));

        let st: "paid" | "partial" | "pending" | "overdue" | "verification_pending" = "pending";
        if (overdueDays > 0) {
          st = "overdue";
        }

        combined.push({
          id: `property-tenant-${tId}`,
          tenantId: tId,
          roomTenantId,
          tenantName: name,
          phone,
          roomNumber: room,
          monthlyRent: rent,
          amountPaid: 0,
          amountDue: rent,
          status: st,
          dueDate: `${String(dueDay).padStart(2, "0")} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`,
          overdueDays,
          raw: t,
        });
      });
    }

    return combined;
  }, [dashboard, tenantsQuery.data, month, year, verifications]);

  // Counts by status
  const counts = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;
    let overdue = 0;
    let verification = 0;

    for (const r of registerRows) {
      if (r.status === "paid") {
        paid++;
      } else if (r.status === "partial") {
        partial++;
        pending++;
      } else if (r.status === "verification_pending") {
        verification++;
        pending++;
      } else if (r.status === "overdue") {
        overdue++;
        pending++;
      } else {
        pending++;
      }
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
      if (statusFilter === "pending" && r.status !== "pending" && r.status !== "overdue" && r.status !== "partial" && r.status !== "verification_pending") return false;
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
    return registerRows.filter((r) => r.amountDue > 0 || r.status === "pending" || r.status === "overdue" || r.status === "partial").reduce((sum, r) => sum + r.amountDue, 0);
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
      const normalizedMethod = (paymentMode || "cash").toLowerCase().replace(/\s+/g, "_");
      await manualMut.mutateAsync({
        roomTenantId: roomTenantId.trim(),
        tenantId: tenantId.trim(),
        periodMonth: month,
        periodYear: year,
        amountPaid: amt,
        paymentMethod: normalizedMethod,
        reference: paymentReference.trim() || undefined,
      });

      toast({
        title: "Payment recorded successfully",
        description: `Credited ${formatINR(amt)} via ${normalizedMethod.toUpperCase()} to tenant register.`,
      });
      setManualPaymentOpen(false);
      setAmountPaid("");
      setPaymentReference("");
      setPaymentMode("cash");
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
        paymentMethod: "upi",
        reference: item.utrNumber || undefined,
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

  // Reset all filters for History ledger
  const handleResetHistoryFilters = () => {
    setHistorySearch("");
    setHistoryStatus("all");
    setHistoryMonth("all");
    setHistoryYear("all");
    setHistoryStartDate("");
    setHistoryEndDate("");
    setHistorySortBy("paidAt");
    setHistorySortOrder("desc");
    setHistoryPage(1);
  };

  // Export History Ledger to CSV
  const handleExportHistoryCSV = () => {
    const items = historyQuery.data?.data || [];
    if (items.length === 0) return;
    const headers = [
      "Receipt ID",
      "Payment Date",
      "Tenant Name",
      "Tenant Phone",
      "Room Number",
      "Period Month",
      "Period Year",
      "Amount Paid",
      "Rent Amount",
      "Payment Method",
      "Reference / UTR",
      "Status",
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...items.map((r) =>
          [
            `"${r.id}"`,
            `"${r.paidAt ? formatDate(r.paidAt) : ""}"`,
            `"${r.tenantName || ""}"`,
            `"${r.tenantPhone || ""}"`,
            `"${r.roomNumber || ""}"`,
            `"${MONTH_NAMES[r.periodMonth - 1] || r.periodMonth}"`,
            `"${r.periodYear}"`,
            `"${r.amountPaid}"`,
            `"${r.rentAmount}"`,
            `"${r.paymentMethod || ""}"`,
            `"${r.reference || ""}"`,
            `"${r.status}"`,
          ].join(",")
        ),
      ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Payment_History_${selectedPg?.name?.replace(/\s+/g, "_") || "PG"}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Receipt Modal
  const handleOpenReceipt = (item: RentCollectionHistoryItem) => {
    setSelectedReceipt(item);
    setReceiptModalOpen(true);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string = "Reference") => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied to clipboard`,
      description: text,
    });
  };

  return (
    <CanAccessPage permission="account_view_dues">
      <div className="space-y-5 pb-8 max-w-7xl">
        {/* Main Header */}
        <PageHeader
          title={activeTab === "history" ? "Payment History Ledger" : "Rent & Payments"}
          description={
            activeTab === "history"
              ? `Complete historical audit log of all rent and dues transactions collected for ${selectedPg?.name || "your PG"}.`
              : `Rent register, verification queue and payment ledger for ${MONTH_NAMES[month - 1]} ${year}.`
          }
          actions={
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => handleOpenRecordPayment()}
              disabled={!selectedPgId}
            >
              <IndianRupee className="h-4 w-4" /> Record payment
            </Button>
          }
        />

        {/* View Switcher Tabs: Monthly Register vs Historical Ledger */}
        <div className="flex items-center gap-1 border-b border-[var(--gray-200)]">
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-[1px] transition-all",
              activeTab === "register"
                ? "border-[var(--brand-600)] text-[var(--brand-700)] font-semibold"
                : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-800)] hover:border-[var(--gray-300)]"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Monthly Register & Dues</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-[1px] transition-all",
              activeTab === "history"
                ? "border-[var(--brand-600)] text-[var(--brand-700)] font-semibold"
                : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-800)] hover:border-[var(--gray-300)]"
            )}
          >
            <History className="h-4 w-4" />
            <span>Payment History Ledger</span>
            {historyQuery.data?.pagination?.total !== undefined && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--gray-100)] text-[var(--gray-700)] font-normal">
                {historyQuery.data.pagination.total}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Monthly Register & Dues */}
        {activeTab === "register" && (
          <div className="space-y-5">
            {/* Operational Metrics */}
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

            {/* Rent Register DataTable */}
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
                            onClick={() => handleOpenRecordPayment(row)}
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
                                    onClick: () => handleOpenRecordPayment(row),
                                  },
                                  {
                                    label: "Send WhatsApp reminder",
                                    icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />,
                                    onClick: () => handleSendWhatsAppReminder(row),
                                  },
                                  {
                                    label: "Share payment link",
                                    icon: <LinkIcon className="h-3.5 w-3.5 text-[var(--brand-600)]" />,
                                    onClick: () => handleSharePaymentLink(row),
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
          </div>
        )}

        {/* TAB 2: Payment History Ledger (GET /api/property-owners/properties/{propertyId}/rent-collections/history) */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Historical Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricDisplay
                label="Total collected"
                value={formatINR(historyQuery.data?.summary?.totalAmountCollected || 0)}
                subText={`${historyQuery.data?.pagination?.total || 0} total transactions recorded`}
                tone="success"
                loading={historyQuery.isLoading}
              />
              <MetricDisplay
                label="Transactions logged"
                value={historyQuery.data?.pagination?.total ?? 0}
                subText={`Page ${historyPage} of ${historyQuery.data?.pagination?.totalPages || 1}`}
                tone="default"
                loading={historyQuery.isLoading}
              />
              <MetricDisplay
                label="Status filter"
                value={
                  historyStatus === "all"
                    ? "All Statuses"
                    : historyStatus.toUpperCase()
                }
                subText={
                  historyStatus === "paid"
                    ? "Fully cleared payments"
                    : historyStatus === "partial"
                    ? "Partially paid rent"
                    : historyStatus === "pending"
                    ? "Unsettled dues"
                    : "Showing all records"
                }
                tone={historyStatus === "paid" ? "success" : historyStatus === "partial" ? "warning" : "default"}
              />
              <MetricDisplay
                label="Rent period"
                value={
                  historyMonth !== "all" && historyYear !== "all"
                    ? `${MONTH_NAMES[parseInt(historyMonth, 10) - 1].slice(0, 3)} ${historyYear}`
                    : historyYear !== "all"
                    ? `Year ${historyYear}`
                    : historyMonth !== "all"
                    ? `${MONTH_NAMES[parseInt(historyMonth, 10) - 1]}`
                    : "All Periods"
                }
                subText={historyStartDate || historyEndDate ? `${historyStartDate || "Start"} to ${historyEndDate || "End"}` : "All transaction dates"}
                tone="default"
              />
            </div>

            {/* History Filter Toolbar */}
            <div className="p-3.5 bg-white border border-[var(--gray-200)] rounded-lg shadow-subtle space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[240px]">
                  <SearchInput
                    value={historySearch}
                    onChange={(val) => {
                      setHistorySearch(val);
                      setHistoryPage(1);
                    }}
                    placeholder="Search tenant name, phone, room or UTR/reference…"
                    className="w-full"
                  />
                </div>

                {/* Quick Actions: Reset & Export */}
                <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                  {(historySearch || historyStatus !== "all" || historyMonth !== "all" || historyYear !== "all" || historyStartDate || historyEndDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetHistoryFilters}
                      className="h-8 text-xs text-[var(--gray-600)] hover:text-[var(--gray-900)] gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset filters
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportHistoryCSV}
                    className="h-8 text-xs gap-1.5"
                    disabled={!historyQuery.data?.data?.length}
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </Button>
                </div>
              </div>

              {/* Filter Row: Status, Month, Year, Date Range, Sort */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[var(--gray-100)] text-xs">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--gray-500)] text-[11px] font-medium">Status:</span>
                  <Select
                    value={historyStatus}
                    onValueChange={(val: any) => {
                      setHistoryStatus(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Month */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--gray-500)] text-[11px] font-medium">Month:</span>
                  <Select
                    value={historyMonth}
                    onValueChange={(val) => {
                      setHistoryMonth(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {MONTH_NAMES.map((mName, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {mName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Year */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--gray-500)] text-[11px] font-medium">Year:</span>
                  <Select
                    value={historyYear}
                    onValueChange={(val) => {
                      setHistoryYear(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[95px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter Range */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[var(--gray-400)] shrink-0" />
                  <Input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => {
                      setHistoryStartDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    placeholder="From Date"
                    className="w-[130px] h-8 text-xs py-1"
                    title="Payments from date"
                  />
                  <span className="text-[var(--gray-400)] text-xs">–</span>
                  <Input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => {
                      setHistoryEndDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    placeholder="To Date"
                    className="w-[130px] h-8 text-xs py-1"
                    title="Payments to date"
                  />
                </div>

                {/* Sort By & Order */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[var(--gray-500)] text-[11px] font-medium">Sort:</span>
                  <Select
                    value={historySortBy}
                    onValueChange={(val: any) => {
                      setHistorySortBy(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[125px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paidAt">Payment Date</SelectItem>
                      <SelectItem value="createdAt">Recorded Date</SelectItem>
                      <SelectItem value="periodMonth">Period Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistorySortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    className="h-8 px-2 text-xs border border-[var(--gray-300)] bg-white text-[var(--gray-700)]"
                    title={historySortOrder === "desc" ? "Newest first (Click for Oldest)" : "Oldest first (Click for Newest)"}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                    {historySortOrder === "desc" ? "Desc" : "Asc"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Historical Rent Collections DataTable */}
            <DataTable
              columns={[
                {
                  id: "paidAt",
                  header: "Payment Date",
                  sortable: true,
                  render: (row: RentCollectionHistoryItem) => (
                    <div className="space-y-0.5">
                      <span className="block font-medium text-[var(--gray-900)] tabular-nums">
                        {row.paidAt ? formatDate(row.paidAt) : formatDate(row.createdAt)}
                      </span>
                      <span className="block text-[11px] text-[var(--gray-500)] tabular-nums">
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                  ),
                },
                {
                  id: "tenant",
                  header: "Tenant",
                  render: (row: RentCollectionHistoryItem) => (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center font-semibold text-xs shrink-0">
                        {row.tenantName ? row.tenantName.charAt(0).toUpperCase() : "T"}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-medium text-[var(--gray-900)] truncate">
                          {row.tenantName || "Unknown Tenant"}
                        </span>
                        <span className="block text-xs text-[var(--gray-500)] tabular-nums">
                          {row.tenantPhone || "—"}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "room",
                  header: "Room",
                  render: (row: RentCollectionHistoryItem) => (
                    <span className="font-medium text-[var(--gray-900)]">
                      {row.roomNumber ? `Room ${row.roomNumber}` : "—"}
                    </span>
                  ),
                },
                {
                  id: "period",
                  header: "Rent Period",
                  render: (row: RentCollectionHistoryItem) => (
                    <span className="font-medium text-[var(--gray-800)]">
                      {MONTH_NAMES[row.periodMonth - 1] || `Month ${row.periodMonth}`} {row.periodYear}
                    </span>
                  ),
                },
                {
                  id: "amountPaid",
                  header: "Amount Paid",
                  align: "right",
                  render: (row: RentCollectionHistoryItem) => {
                    const paid = Number(row.amountPaid) || 0;
                    const rent = Number(row.rentAmount) || 0;
                    return (
                      <div className="text-right space-y-0.5">
                        <span className="block font-bold text-sm text-emerald-700 tabular-nums">
                          {formatINR(paid)}
                        </span>
                        {rent > paid && (
                          <span className="block text-[11px] text-[var(--gray-500)] tabular-nums">
                            Rent: {formatINR(rent)}
                          </span>
                        )}
                      </div>
                    );
                  },
                },
                {
                  id: "paymentMethod",
                  header: "Mode",
                  render: (row: RentCollectionHistoryItem) => {
                    const method = (row.paymentMethod || "UPI").toUpperCase();
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--gray-100)] text-[var(--gray-800)] border border-[var(--gray-200)]">
                        {method}
                      </span>
                    );
                  },
                },
                {
                  id: "reference",
                  header: "Reference / UTR",
                  render: (row: RentCollectionHistoryItem) => {
                    if (!row.reference) {
                      return <span className="text-[var(--gray-400)] text-xs italic">—</span>;
                    }
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(row.reference!, "UTR / Reference");
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--brand-700)] bg-[var(--brand-50)] hover:bg-[var(--brand-100)] px-2 py-0.5 rounded transition-colors group"
                        title="Click to copy UTR"
                      >
                        <span>{row.reference}</span>
                        <Copy className="h-3 w-3 text-[var(--brand-500)] group-hover:text-[var(--brand-700)]" />
                      </button>
                    );
                  },
                },
                {
                  id: "status",
                  header: "Status",
                  render: (row: RentCollectionHistoryItem) => {
                    let statusKey: StatusBadgeProps["status"] = "pending";
                    if (row.status === "paid") statusKey = "paid";
                    else if (row.status === "partial") statusKey = "partially_paid";

                    return <StatusBadge status={statusKey} size="sm" />;
                  },
                },
                {
                  id: "actions",
                  header: "",
                  align: "right",
                  render: (row: RentCollectionHistoryItem) => (
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() => handleOpenReceipt(row)}
                      >
                        <Receipt className="h-3.5 w-3.5 text-[var(--brand-600)]" /> Receipt
                      </Button>

                      <ActionMenu
                        items={[
                          {
                            label: "View receipt",
                            icon: <Receipt className="h-3.5 w-3.5 text-[var(--brand-600)]" />,
                            onClick: () => handleOpenReceipt(row),
                          },
                          {
                            label: "Tenant passbook",
                            icon: <FileText className="h-3.5 w-3.5" />,
                            onClick: () =>
                              openPassbook({
                                tenantId: row.tenantId,
                                roomTenantId: row.roomTenantId,
                                tenantName: row.tenantName,
                                roomNumber: row.roomNumber,
                                phone: row.tenantPhone,
                                monthlyRent: Number(row.rentAmount) || 0,
                                amountPaid: Number(row.amountPaid) || 0,
                                amountDue: Math.max(0, (Number(row.rentAmount) || 0) - (Number(row.amountPaid) || 0)),
                                status: row.status,
                              }),
                          },
                          {
                            label: "Tenant profile",
                            icon: <ExternalLink className="h-3.5 w-3.5" />,
                            onClick: () => navigate(`/tenants/${row.tenantId}`),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
              data={historyQuery.data?.data || []}
              keyExtractor={(r) => r.id}
              loading={historyQuery.isLoading}
              density={density}
              onRowClick={(row) => handleOpenReceipt(row)}
              emptyState={
                <EmptyState
                  title="No payment history records found"
                  description={
                    historySearch || historyStatus !== "all" || historyMonth !== "all" || historyYear !== "all" || historyStartDate || historyEndDate
                      ? "No transactions match your selected search or filter criteria. Try adjusting your filters."
                      : "No rent or dues payments have been logged yet for this property."
                  }
                  action={
                    historySearch || historyStatus !== "all" || historyMonth !== "all" || historyYear !== "all" || historyStartDate || historyEndDate ? (
                      <Button variant="secondary" size="sm" onClick={handleResetHistoryFilters}>
                        Reset all filters
                      </Button>
                    ) : undefined
                  }
                />
              }
            />

            {/* History Pagination Bar */}
            {historyQuery.data?.pagination && historyQuery.data.pagination.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-lg text-xs text-[var(--gray-600)]">
                <div>
                  Showing{" "}
                  <strong className="text-[var(--gray-900)]">
                    {(historyPage - 1) * historyLimit + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-[var(--gray-900)]">
                    {Math.min(historyPage * historyLimit, historyQuery.data.pagination.total)}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[var(--gray-900)]">
                    {historyQuery.data.pagination.total}
                  </strong>{" "}
                  transactions
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    <Select
                      value={String(historyLimit)}
                      onValueChange={(val) => {
                        setHistoryLimit(parseInt(val, 10));
                        setHistoryPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
                    </Button>
                    <span className="px-2 font-medium text-[var(--gray-800)]">
                      Page {historyPage} of {historyQuery.data.pagination.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        setHistoryPage((p) =>
                          p < (historyQuery.data?.pagination?.totalPages || 1) ? p + 1 : p
                        )
                      }
                      disabled={historyPage >= (historyQuery.data?.pagination?.totalPages || 1)}
                    >
                      Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider block">
                    Payment History & Ledger
                  </span>
                  {tenantPassbookQuery.isFetching && (
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--brand-600)]" />
                  )}
                </div>

                <div className="border border-[var(--gray-200)] rounded-md divide-y divide-[var(--gray-200)] text-xs bg-white">
                  {/* Current Month Rent Cycle Row */}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--gray-900)]">
                        {MONTH_NAMES[month - 1]} {year} Rent Invoiced
                      </p>
                      <p className="text-[11px] text-[var(--gray-500)]">
                        Due Date: {selectedPassbookTenant?.dueDate || "5th of the month"}
                      </p>
                    </div>
                    <span className="font-semibold text-[#B42318] tabular-nums">
                      -{formatINR(selectedPassbookTenant?.monthlyRent)}
                    </span>
                  </div>

                  {/* Real Historical Payments from GET /api/property-owners/properties/{propertyId}/rent-collections/history */}
                  {tenantPassbookQuery.isLoading ? (
                    <div className="p-5 text-center text-xs text-[var(--gray-500)]">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-[var(--brand-600)] mb-1" />
                      Loading payment history…
                    </div>
                  ) : tenantPassbookQuery.data?.data && tenantPassbookQuery.data.data.length > 0 ? (
                    tenantPassbookQuery.data.data.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-emerald-800">Payment Credited</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase font-mono font-medium">
                              {tx.paymentMethod || "UPI"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--gray-500)] mt-0.5">
                            {tx.paidAt ? formatDate(tx.paidAt) : formatDate(tx.createdAt)} · Cycle:{" "}
                            {MONTH_NAMES[tx.periodMonth - 1] || tx.periodMonth} {tx.periodYear}
                          </p>
                          {tx.reference && (
                            <p className="text-[10px] font-mono text-[var(--gray-600)] mt-0.5 truncate">
                              Ref: {tx.reference}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-700 tabular-nums block">
                            +{formatINR(tx.amountPaid)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(tx)}
                            className="text-[11px] text-[var(--brand-600)] hover:underline inline-flex items-center gap-0.5 mt-0.5 font-medium"
                          >
                            <Receipt className="h-3 w-3" /> Receipt
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--gray-500)]">
                      No historical payments recorded for this tenant yet.
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
                    handleOpenRecordPayment({
                      roomTenantId: selectedPassbookTenant.roomTenantId,
                      tenantId: selectedPassbookTenant.tenantId,
                      amountDue: selectedPassbookTenant.amountDue,
                    } as any);
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
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI / QR Code (GPay, PhonePe, Paytm)</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
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

        {/* Payment Receipt Dialog */}
        <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
          <DialogContent className="sm:max-w-md print:max-w-full">
            <DialogHeader className="border-b border-[var(--gray-200)] pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center font-bold">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-[var(--gray-900)]">
                      Rent Payment Receipt
                    </DialogTitle>
                    <p className="text-[11px] text-[var(--gray-500)]">
                      PG Ease Verified Transaction
                    </p>
                  </div>
                </div>
                <StatusBadge status="paid" label="Confirmed" size="sm" />
              </div>
            </DialogHeader>

            {selectedReceipt && (
              <div className="space-y-4 py-2 text-xs">
                {/* PG Header */}
                <div className="bg-[var(--gray-50)] p-3 rounded-lg border border-[var(--gray-200)] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-[var(--gray-900)] block">
                      {selectedPg?.name || "PG Property"}
                    </span>
                    <span className="text-[11px] text-[var(--gray-500)] block mt-0.5">
                      Room {selectedReceipt.roomNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[var(--gray-500)] block">Rent Cycle</span>
                    <span className="font-semibold text-[var(--gray-900)]">
                      {MONTH_NAMES[selectedReceipt.periodMonth - 1] || selectedReceipt.periodMonth} {selectedReceipt.periodYear}
                    </span>
                  </div>
                </div>

                {/* Amount Paid Spotlight */}
                <div className="text-center p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
                    Total Amount Received
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                    {formatINR(selectedReceipt.amountPaid)}
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-1 block">
                    Full payment credited towards rent
                  </span>
                </div>

                {/* Key Transaction Details */}
                <div className="space-y-2 border border-[var(--gray-200)] rounded-lg p-3 divide-y divide-[var(--gray-100)]">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--gray-500)]">Tenant Name</span>
                    <span className="font-semibold text-[var(--gray-900)]">
                      {selectedReceipt.tenantName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--gray-500)]">Mobile Number</span>
                    <span className="font-mono text-[var(--gray-800)]">
                      {selectedReceipt.tenantPhone || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--gray-500)]">Payment Date & Time</span>
                    <span className="font-medium text-[var(--gray-900)] tabular-nums">
                      {selectedReceipt.paidAt ? formatDate(selectedReceipt.paidAt) : formatDate(selectedReceipt.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--gray-500)]">Payment Mode</span>
                    <span className="font-medium uppercase text-[var(--gray-900)]">
                      {selectedReceipt.paymentMethod || "UPI"}
                    </span>
                  </div>
                  {selectedReceipt.reference && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--gray-500)]">UTR / Reference No</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedReceipt.reference!, "UTR")}
                        className="font-mono font-semibold text-[var(--brand-700)] hover:underline inline-flex items-center gap-1"
                        title="Click to copy"
                      >
                        {selectedReceipt.reference} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--gray-500)]">Receipt / Txn ID</span>
                    <span className="font-mono text-[10px] text-[var(--gray-600)]">
                      {selectedReceipt.id}
                    </span>
                  </div>
                </div>

                {/* Additional Notes or Items Breakdown if any */}
                {selectedReceipt.notes && (
                  <div className="p-3 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)] space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--gray-700)] block">
                      Ledger Notes / Remarks:
                    </span>
                    <p className="text-[11px] text-[var(--gray-600)] leading-relaxed">
                      {typeof selectedReceipt.notes === "object"
                        ? (selectedReceipt.notes as any).notes || JSON.stringify(selectedReceipt.notes)
                        : String(selectedReceipt.notes)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[var(--gray-200)]">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" /> Print Receipt
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => setReceiptModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TrialExpiredGateModal
          open={trialExpiredOpen}
          onOpenChange={setTrialExpiredOpen}
          featureName={trialExpiredFeature}
        />
      </div>
    </CanAccessPage>
  );
};

export default RentPayments;
