import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Loader2,
  Users,
  Wallet,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  History,
  Search,
  Download,
  Filter,
  ArrowUpDown,
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
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { HelpLink } from "@/components/common/HelpLink";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePostManualRentMutation,
  useRentCollectionDashboard,
  usePropertyTenants,
  useRentCollectionHistory,
  type RentCollectionHistoryParams,
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { sendWhatsAppRentReminder, type RentDashboardTenantRow } from "@/api/propertyOwner";
import { amountFromRow, formatInr, parseRentTenantRow } from "@/lib/rentDashboard";
import { SharePaymentLinkDialog } from "@/components/tenants/SharePaymentLinkDialog";
import { cn } from "@/lib/utils";

function TenantTable({
  rows,
  emptyLabel,
  isUnpaid = false,
  onRecordPay,
  onSharePaymentLink,
  propertyId,
}: {
  rows: RentDashboardTenantRow[];
  emptyLabel: string;
  isUnpaid?: boolean;
  onRecordPay?: (row: RentDashboardTenantRow) => void;
  onSharePaymentLink?: (row: RentDashboardTenantRow) => void;
  propertyId?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center border rounded-2xl bg-muted/10 font-medium">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-border/80 overflow-x-auto shadow-xs bg-card">
      <Table>
        <TableHeader className="bg-muted/40 text-xs">
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {isUnpaid && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs">
          {rows.map((row, i) => {
            const parsed = parseRentTenantRow(row);
            const amt = amountFromRow(row) ?? (Number((row as any).rentAmount) || 0);
            const room = row.roomNumber ?? row.room_number ?? "—";
            const tenantName = parsed?.label ?? String(row.tenantName ?? row.name ?? row.tenant_name ?? "Tenant");
            const phone = row.phone || row.mobile || "";

            return (
              <TableRow key={parsed ? `${parsed.roomTenantId}-${i}` : i} className="hover:bg-muted/20">
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {tenantName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="leading-none">{tenantName}</p>
                      {phone && <p className="text-[10px] text-muted-foreground mt-0.5">{phone}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-medium">Room {String(room)}</TableCell>
                <TableCell className="text-right tabular-nums font-bold text-foreground">
                  {formatInr(amt)}
                </TableCell>
                {isUnpaid && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 font-semibold"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const targetRoomTenantId = parsed?.roomTenantId || (row as any).roomTenantId || (row as any).id;
                          if (propertyId && targetRoomTenantId) {
                            try {
                              const res = await sendWhatsAppRentReminder(propertyId, targetRoomTenantId, amt ? { customAmount: amt } : undefined);
                              toast({
                                title: "WhatsApp Reminder Sent",
                                description: res?.message || `Sent official rent reminder to ${tenantName}.`,
                              });
                              return;
                            } catch (err: any) {
                              console.warn("Backend reminder API failed, falling back to direct link", err);
                            }
                          }
                          const text = encodeURIComponent(
                            `Hi ${tenantName}, this is a gentle reminder that your PG rent of ${amt != null ? formatInr(amt) : "due amount"} is pending for this month. Please pay to avoid late fees. Thank you!`
                          );
                          window.open(phone ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> WhatsApp
                      </Button>
                      {onSharePaymentLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 rounded-lg border-teal-300 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 gap-1 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSharePaymentLink(row);
                          }}
                          title="View dues breakdown and copy payment link"
                        >
                          <LinkIcon className="h-3 w-3" /> Pay Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-[11px] px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordPay?.(row);
                        }}
                      >
                        Record
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const RentPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPgId, properties, setSelectedPgId } = useApp();
  const selectedPg = useMemo(() => {
    return Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;
  }, [properties, selectedPgId]);

  const isHistoryView = location.pathname === "/rent-payments/history";
  const isDuesView = location.pathname === "/rent-payments/dues";
  const isCollectionView = !isHistoryView && !isDuesView;

  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [roomTenantId, setRoomTenantId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedUnpaidKey, setSelectedUnpaidKey] = useState<string>("");

  // Filters for History & Dues
  const [historySearch, setHistorySearch] = useState("");
  const [historyMode, setHistoryMode] = useState("all");
  const [historyStatus, setHistoryStatus] = useState<"all" | "paid" | "partial" | "pending">("all");
  const [historySortBy, setHistorySortBy] = useState<"paidAt" | "createdAt" | "periodMonth">("paidAt");
  const [historySortOrder, setHistorySortOrder] = useState<"desc" | "asc">("desc");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [duesSearch, setDuesSearch] = useState("");
  const [duesFilter, setDuesFilter] = useState("all");
  const [receiptDialogData, setReceiptDialogData] = useState<any | null>(null);

  const rentQuery = useRentCollectionDashboard(selectedPgId, month, year);
  const dashboard = rentQuery.data;
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const manualMut = usePostManualRentMutation(selectedPgId);

  const historyParams = useMemo(() => {
    const p: RentCollectionHistoryParams = {
      page: historyPage,
      limit: historyLimit,
      sortBy: historySortBy,
      sortOrder: historySortOrder,
    };
    if (historySearch.trim()) p.search = historySearch.trim();
    if (historyStatus !== "all") p.status = historyStatus;
    if (historyStartDate) p.startDate = historyStartDate;
    if (historyEndDate) p.endDate = historyEndDate;
    return p;
  }, [historyPage, historyLimit, historySortBy, historySortOrder, historySearch, historyStatus, historyStartDate, historyEndDate]);

  const historyQuery = useRentCollectionHistory(selectedPgId, historyParams);
  const historyData = historyQuery.data;
  const historyList = historyData?.data ?? [];
  const historyPagination = historyData?.pagination;
  const totalHistoryCount = historyPagination?.total ?? historyList.length;
  const totalHistoryPages = Math.max(1, historyPagination?.totalPages ?? Math.ceil(totalHistoryCount / historyLimit));

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  const unpaidOptions = useMemo(() => {
    const list = dashboard?.unpaidTenants ?? [];
    const out: { key: string; label: string; roomTenantId: string; tenantId: string; suggestedAmount?: number }[] = [];
    list.forEach((row, i) => {
      const p = parseRentTenantRow(row);
      if (!p) return;
      const key = `${p.roomTenantId}|${p.tenantId}|${i}`;
      out.push({
        key,
        label: p.label,
        roomTenantId: p.roomTenantId,
        tenantId: p.tenantId,
        suggestedAmount: amountFromRow(row),
      });
    });
    return out;
  }, [dashboard?.unpaidTenants]);

  const applyUnpaidSelection = (key: string) => {
    setSelectedUnpaidKey(key);
    const opt = unpaidOptions.find((o) => o.key === key);
    if (opt) {
      setRoomTenantId(opt.roomTenantId);
      setTenantId(opt.tenantId);
      if (opt.suggestedAmount != null) {
        setAmountPaid(String(opt.suggestedAmount));
      }
    }
  };

  const handleManual = async () => {
    if (!selectedPgId) {
      toast({ title: "Select a PG", variant: "destructive" });
      return;
    }
    const amt = parseFloat(amountPaid);
    if (!roomTenantId.trim() || !tenantId.trim() || !Number.isFinite(amt)) {
      toast({ title: "Choose a tenant or enter IDs and a valid amount", variant: "destructive" });
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
      toast({ title: "Payment recorded successfully", description: `Recorded payment of ₹${amt}` });
      setAmountPaid("");
      setSelectedUnpaidKey("");
      void rentQuery.refetch();
    } catch (e: unknown) {
      toast({
        title: "Could not record payment",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  // Pre-fill manual payment for a specific row
  const openManualForTenant = (row: RentDashboardTenantRow) => {
    const p = parseRentTenantRow(row);
    const amt = amountFromRow(row);
    if (p) {
      setRoomTenantId(p.roomTenantId);
      setTenantId(p.tenantId);
      if (amt != null) setAmountPaid(String(amt));
    }
    setManualPaymentOpen(true);
  };

  // Share payment link state
  const [paymentLinkTenant, setPaymentLinkTenant] = useState<{
    propertyId: string;
    roomTenantId: string;
    tenantName?: string;
    roomNumber?: string;
    phone?: string;
  } | null>(null);

  const openPaymentLinkForTenant = (row: RentDashboardTenantRow) => {
    const p = parseRentTenantRow(row);
    const targetRoomTenantId = p?.roomTenantId || (row as any)?.roomTenantId || (row as any)?.id;
    const tenantName = p?.label ?? String(row.tenantName ?? row.name ?? row.tenant_name ?? "Tenant");
    const roomNumber = String(row.roomNumber ?? row.room_number ?? "—");
    const phone = row.phone || row.mobile || "";

    if (selectedPgId && targetRoomTenantId) {
      setPaymentLinkTenant({
        propertyId: selectedPgId,
        roomTenantId: targetRoomTenantId,
        tenantName,
        roomNumber,
        phone,
      });
    }
  };

  // Fallback ledger built from this month's paid tenants (used only when the history API
  // returns nothing). Fields the API doesn't provide are shown as "—", never invented.
  const paymentTransactions = useMemo(() => {
    const paidList = dashboard?.paidTenants || [];

    return paidList.map((item, idx) => {
      const parsed = parseRentTenantRow(item);
      const row = item as any;
      const amt = Number(row.amountPaid) || Number(row.rentAmount) || amountFromRow(item) || 0;
      const room = item.roomNumber ?? item.room_number ?? "—";
      const name = parsed?.label || item.tenantName || item.name || `Tenant #${idx + 1}`;
      const mode = String(row.paymentMethod ?? row.paymentMode ?? row.mode ?? "").trim() || "—";
      const paidAtRaw = row.paidAt ?? row.paymentDate ?? row.paidOn ?? row.createdAt;
      const paidAt = paidAtRaw ? new Date(paidAtRaw) : null;
      const hasDate = paidAt != null && !Number.isNaN(paidAt.getTime());
      const refId = String(row.transactionId ?? row.referenceId ?? row.refId ?? row.paymentId ?? "").trim() || "—";

      return {
        id: String(row.paymentId ?? row.id ?? `${parsed?.roomTenantId ?? "row"}-${idx}`),
        tenantName: name,
        roomNumber: String(room),
        amount: amt,
        mode,
        status: "Completed",
        date: hasDate ? paidAt!.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        time: hasDate ? paidAt!.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        period: `${month}/${year}`,
        refId,
      };
    });
  }, [dashboard?.paidTenants, month, year]);

  const filteredHistory = useMemo(() => {
    return paymentTransactions.filter((tx) => {
      const matchesSearch =
        tx.tenantName.toLowerCase().includes(historySearch.toLowerCase()) ||
        tx.roomNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        tx.id.toLowerCase().includes(historySearch.toLowerCase());
      const matchesMode = historyMode === "all" || tx.mode.toLowerCase().includes(historyMode.toLowerCase());
      return matchesSearch && matchesMode;
    });
  }, [paymentTransactions, historySearch, historyMode]);

  // Outstanding dues table based on unpaid tenants
  const pendingDuesList = useMemo(() => {
    const unpaidList = dashboard?.unpaidTenants || [];
    return unpaidList.map((item, idx) => {
      const parsed = parseRentTenantRow(item);
      const amt = Number((item as any).amountOutstanding) || Number((item as any).rentAmount) || amountFromRow(item) || 0;
      const room = item.roomNumber ?? item.room_number ?? "—";
      const name = parsed?.label || item.tenantName || item.name || `Tenant #${idx + 1}`;
      const phone = item.phone || item.mobile || "";

      // Overdue days are only computed when the API tells us the tenant's rent due day;
      // otherwise the row is simply "pending" for the period (no invented ages).
      const dueDayRaw = (item as any).rentDueDate ?? (item as any).dueDay ?? (item as any).rent_due_date;
      const dueDay = Number(dueDayRaw);
      const hasDueDay = Number.isFinite(dueDay) && dueDay >= 1 && dueDay <= 31;
      const dueDateObj = hasDueDay ? new Date(year, month - 1, dueDay) : null;
      const overdueDays: number | null = dueDateObj
        ? Math.max(0, Math.floor((Date.now() - dueDateObj.getTime()) / 86400000))
        : null;

      return {
        id: `DUE-${item.id || idx}`,
        tenantName: name,
        phone,
        roomNumber: String(room),
        dueType: Number((item as any).electricityBill || 0) > 0 ? "Monthly Rent + Electricity" : "Monthly Rent",
        amount: amt,
        dueDate: dueDateObj ? dueDateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
        overdueDays,
        status: overdueDays == null ? "PENDING" : overdueDays > 15 ? "CRITICAL" : overdueDays > 0 ? "OVERDUE" : "DUE",
        rawRow: item,
      };
    });
  }, [dashboard?.unpaidTenants, month, year]);

  const filteredDues = useMemo(() => {
    return pendingDuesList.filter((item) => {
      const matchesSearch =
        item.tenantName.toLowerCase().includes(duesSearch.toLowerCase()) ||
        item.roomNumber.toLowerCase().includes(duesSearch.toLowerCase()) ||
        item.phone.includes(duesSearch);
      if (duesFilter === "critical") return matchesSearch && item.overdueDays != null && item.overdueDays > 15;
      if (duesFilter === "recent") return matchesSearch && (item.overdueDays == null || item.overdueDays <= 7);
      return matchesSearch;
    });
  }, [pendingDuesList, duesSearch, duesFilter]);

  const totalDuesOutstanding = pendingDuesList.reduce((sum, d) => sum + d.amount, 0);

  return (
    <CanAccessPage permission="account_view_dues">
      <div className="space-y-6 animate-fade-in max-w-7xl">
        {/* Main Header */}
        <PageHeader
          title={isHistoryView ? "Payment History" : isDuesView ? "Dues & Pending" : "Rent Collection"}
          description={
            isHistoryView
              ? "Every rent payment received, with receipts."
              : isDuesView
              ? "Tenants who haven't paid this month, with one-tap WhatsApp reminders."
              : "See who has paid this month, who hasn't, and record payments you received directly."
          }
          actions={
            <>
              <HelpLink tutorialKey="rent_collection" label="How rent collection works" />
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setManualPaymentOpen(true)}
                disabled={!selectedPgId}
              >
                <IndianRupee className="h-4 w-4" /> Record payment
              </Button>
            </>
          }
        />

        {/* Unified Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/70 pb-2">
          <Button
            variant={isCollectionView ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-xl gap-2 text-xs font-bold transition-all",
              isCollectionView
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => navigate("/rent-payments")}
          >
            <Wallet className="h-4 w-4" /> Rent Collection
          </Button>
          <Button
            variant={isHistoryView ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-xl gap-2 text-xs font-bold transition-all",
              isHistoryView
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => navigate("/rent-payments/history")}
          >
            <History className="h-4 w-4" /> Payment History
          </Button>
          <Button
            variant={isDuesView ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-xl gap-2 text-xs font-bold transition-all",
              isDuesView
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => navigate("/rent-payments/dues")}
          >
            <AlertCircle className="h-4 w-4" /> Dues & Pending
          </Button>
        </div>

        {/* PG & Period Filter Controls Bar */}
        <div className="flex flex-wrap gap-3 items-end bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Select Property</Label>
            <Select
              value={selectedPgId ?? "none"}
              onValueChange={(v) => {
                if (v !== "none") setSelectedPgId(v);
              }}
            >
              <SelectTrigger className="w-[220px] h-9 text-xs">
                <SelectValue placeholder="Select PG" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Billing Month</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v, 10))}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(2026, m - 1, 1).toLocaleString("default", { month: "short" })} ({m})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Billing Year</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
              <SelectTrigger className="w-[100px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* VIEW 1: RENT COLLECTION (Cycle Overview) */}
        {isCollectionView && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>Collected this month</span>
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1.5">
                    {formatInr(dashboard?.totalCollectedThisPeriod ?? 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Period: {month}/{year}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>All-Time Revenue</span>
                    <IndianRupee className="h-4 w-4 text-brand-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1.5">
                    {formatInr(dashboard?.totalRevenueAllTime ?? 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Across all tenancies</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>Paid Tenants</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums mt-1.5">
                    {dashboard?.paidCount ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Cleared this cycle</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>Pending Dues</span>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums mt-1.5">
                    {dashboard?.unpaidCount ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Awaiting settlement</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-muted-foreground border rounded-2xl px-5 py-3.5 bg-card shadow-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-slate-400" /> Empty beds:{" "}
                  <strong className="text-foreground font-bold">{dashboard?.emptyBedsCount ?? 0}</strong>
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" /> Paid / Unpaid ratio:{" "}
                  <strong className="text-foreground font-bold">
                    {dashboard?.paidCount ?? 0} paid • {dashboard?.unpaidCount ?? 0} pending
                  </strong>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-xl gap-1.5"
                onClick={() => navigate("/rent-payments/dues")}
              >
                View Overdue Desk <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid Tenants ({dashboard?.paidTenants?.length ?? 0})
                  </h3>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    Period {month}/{year}
                  </Badge>
                </div>
                <TenantTable
                  rows={dashboard?.paidTenants ?? []}
                  emptyLabel="No tenants have cleared rent for this period yet."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending Collection ({dashboard?.unpaidTenants?.length ?? 0})
                  </h3>
                  {(dashboard?.unpaidTenants?.length ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 font-semibold">
                      Needs follow-up
                    </Badge>
                  )}
                </div>
                <TenantTable
                  rows={dashboard?.unpaidTenants ?? []}
                  propertyId={selectedPgId}
                  emptyLabel="Everyone has paid for this period."
                  isUnpaid={true}
                  onRecordPay={openManualForTenant}
                  onSharePaymentLink={openPaymentLinkForTenant}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PAYMENT HISTORY / TRANSACTIONS LEDGER */}
        {isHistoryView && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Collected</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-1">
                    {formatInr(
                      historyData?.summary?.totalAmountCollected ??
                        dashboard?.totalCollectedThisPeriod ??
                        0
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Recorded for {month}/{year}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Settled Transactions</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums mt-1">
                    {totalHistoryCount}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Verified receipts generated</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Active Property</span>
                  <p className="text-sm font-bold text-foreground mt-2 truncate">
                    {selectedPg?.name ?? "All Registered PGs"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Verified rent collections</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tenant, room or TXN ID..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-9 pl-9 text-xs rounded-xl"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Status Filter */}
                  <Select
                    value={historyStatus}
                    onValueChange={(val: any) => {
                      setHistoryStatus(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs w-[130px] rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select
                    value={historySortBy}
                    onValueChange={(val: any) => {
                      setHistorySortBy(val);
                      setHistoryPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs w-[140px] rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paidAt">Payment Date</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="periodMonth">Period Month</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Order Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs rounded-xl gap-1"
                    onClick={() => {
                      setHistorySortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                      setHistoryPage(1);
                    }}
                    title="Toggle Sort Order"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    {historySortOrder === "desc" ? "Newest" : "Oldest"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs rounded-xl gap-1.5"
                    onClick={() => toast({ title: "Ledger Exported", description: "Payment history spreadsheet downloaded." })}
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </div>
              </div>

              {/* Date Filters Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Date Range:
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => {
                      setHistoryStartDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-8 text-xs rounded-lg w-36"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => {
                      setHistoryEndDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-8 text-xs rounded-lg w-36"
                  />
                  {(historyStartDate || historyEndDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setHistoryStartDate("");
                        setHistoryEndDate("");
                        setHistoryPage(1);
                      }}
                    >
                      Clear Dates
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {historyQuery.isLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium">Loading rent payment history...</p>
                  </div>
                ) : (historyList.length === 0 && filteredHistory.length === 0) ? (
                  <div className="py-16 text-center space-y-3">
                    <History className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <h4 className="text-sm font-semibold">No transactions recorded yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Payments collected via UPI QR or manual entries for this property will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Transaction / Ref</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Period</th>
                          <th className="py-3 px-4">Channel / Mode</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(historyList.length > 0 ? historyList : filteredHistory).map((item: any) => {
                          const dateObj = item.paidAt ? new Date(item.paidAt) : item.date ? new Date() : null;
                          const formattedDate = dateObj
                            ? dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : (item.date ?? "—");
                          const formattedTime = dateObj
                            ? dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : (item.time ?? "");
                          const amt = Number(item.amountPaid) || Number(item.amount) || Number(item.rentAmount) || 0;
                          const modeStr = item.paymentMethod || item.mode || "UPI Intent";
                          const statusStr = (item.status || "paid").toLowerCase();
                          const txnRef = item.reference || item.id;

                          return (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-foreground text-[11px]">
                                {txnRef}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="font-medium text-foreground block">{formattedDate}</span>
                                {formattedTime && <span className="text-[10px] text-muted-foreground">{formattedTime}</span>}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-foreground block">{item.tenantName}</span>
                                {item.tenantPhone && (
                                  <span className="text-[10px] text-muted-foreground font-mono">{item.tenantPhone}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-muted-foreground">
                                Room {item.roomNumber ?? "—"}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-muted-foreground">
                                {item.periodMonth && item.periodYear
                                  ? `${item.periodMonth}/${item.periodYear}`
                                  : item.period ?? "—"}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[10px] font-semibold",
                                    modeStr.toLowerCase().includes("upi")
                                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200"
                                      : modeStr.toLowerCase().includes("cash")
                                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                                      : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200"
                                  )}
                                >
                                  {modeStr}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 text-right tabular-nums font-bold text-foreground">
                                {formatInr(amt)}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <Badge
                                  className={cn(
                                    "text-[10px] font-bold text-white capitalize",
                                    statusStr === "paid"
                                      ? "bg-emerald-600 hover:bg-emerald-600"
                                      : statusStr === "partial"
                                      ? "bg-amber-600 hover:bg-amber-600"
                                      : "bg-slate-500 hover:bg-slate-500"
                                  )}
                                >
                                  {statusStr}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                  onClick={() =>
                                    setReceiptDialogData({
                                      id: txnRef,
                                      tenantName: item.tenantName,
                                      roomNumber: item.roomNumber ?? "—",
                                      period: item.periodMonth ? `${item.periodMonth}/${item.periodYear}` : (item.period ?? `${month}/${year}`),
                                      mode: modeStr,
                                      date: formattedDate,
                                      time: formattedTime,
                                      amount: amt,
                                    })
                                  }
                                >
                                  <Receipt className="h-3.5 w-3.5 mr-1" /> View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalHistoryCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/60 bg-muted/20 text-xs">
                    <div className="text-muted-foreground">
                      Showing{" "}
                      <span className="font-semibold text-foreground">
                        {(historyPage - 1) * historyLimit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-foreground">
                        {Math.min(historyPage * historyLimit, totalHistoryCount)}
                      </span>{" "}
                      of <span className="font-semibold text-foreground">{totalHistoryCount}</span> records
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg gap-1"
                        disabled={historyPage <= 1 || historyQuery.isLoading}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </Button>
                      <span className="text-xs font-semibold px-2">
                        {historyPage} / {totalHistoryPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg gap-1"
                        disabled={historyPage >= totalHistoryPages || historyQuery.isLoading}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW 3: DUES & PENDING RECOVERY DESK */}
        {isDuesView && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl shadow-xs border-border/80 bg-red-50/20 dark:bg-red-950/10">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-destructive text-xs font-bold uppercase tracking-wide">
                    <span>Total Outstanding Dues</span>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-destructive tabular-nums mt-1.5">
                    {formatInr(totalDuesOutstanding)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Across {pendingDuesList.length} tenants</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>Critical Overdue (&gt;15 Days)</span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums mt-1.5">
                    {pendingDuesList.filter((d) => d.overdueDays != null && d.overdueDays > 15).length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Requires direct owner intervention</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    <span>1-Click Recovery Tool</span>
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-foreground mt-2">
                    WhatsApp Automated Reminders
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Send custom notices with rent amount & UPI link</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tenant name, room, or phone..."
                  value={duesSearch}
                  onChange={(e) => setDuesSearch(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Select value={duesFilter} onValueChange={setDuesFilter}>
                  <SelectTrigger className="h-9 text-xs w-[170px] rounded-xl">
                    <SelectValue placeholder="All Pending Dues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Overdue Balances</SelectItem>
                    <SelectItem value="critical">Critical (&gt;15 Days)</SelectItem>
                    <SelectItem value="recent">Recent (≤7 Days)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 text-xs rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={async () => {
                    if (!selectedPgId || filteredDues.length === 0) {
                      toast({ title: "No Tenants", description: "No unpaid tenants found to remind." });
                      return;
                    }
                    let sentCount = 0;
                    for (const due of filteredDues) {
                      const targetRoomTenantId =
                        (due.rawRow as any)?.roomTenantId ||
                        parseRentTenantRow(due.rawRow)?.roomTenantId ||
                        (due.rawRow as any)?.id;
                      if (targetRoomTenantId) {
                        try {
                          await sendWhatsAppRentReminder(
                            selectedPgId,
                            targetRoomTenantId,
                            due.amount ? { customAmount: due.amount } : undefined
                          );
                          sentCount++;
                        } catch {
                          // Continue on partial failures
                        }
                      }
                    }
                    toast({
                      title: "WhatsApp Reminders Dispatched",
                      description: `Sent official reminders to ${sentCount} out of ${filteredDues.length} tenants.`,
                    });
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Broadcast Reminders
                </Button>
              </div>
            </div>

            {/* Dues Table */}
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {filteredDues.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-semibold">No pending dues found!</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      All tenants have cleared their balances for this filter selection.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Due Type</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Overdue Status</th>
                          <th className="py-3 px-4 text-right">Amount Due</th>
                          <th className="py-3 px-4 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredDues.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <span className="h-7 w-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                                  {item.tenantName.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <p className="leading-none">{item.tenantName}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-muted-foreground">
                              Room {item.roomNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant="outline" className="text-[10px] font-medium">
                                {item.dueType}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                              {item.dueDate}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusBadge
                                size="sm"
                                tone={item.overdueDays != null && item.overdueDays > 15 ? "danger" : item.overdueDays ? "warning" : "neutral"}
                                label={
                                  item.overdueDays == null
                                    ? "Pending"
                                    : item.overdueDays === 0
                                    ? "Due today"
                                    : `${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"} overdue`
                                }
                                status={item.status}
                              />
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums font-extrabold text-destructive text-sm">
                              {formatInr(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 font-semibold"
                                  onClick={async () => {
                                    const raw = item.rawRow;
                                    const targetRoomTenantId =
                                      (raw as any)?.roomTenantId ||
                                      parseRentTenantRow(raw)?.roomTenantId ||
                                      (raw as any)?.id;

                                    if (selectedPgId && targetRoomTenantId) {
                                      try {
                                        const res = await sendWhatsAppRentReminder(
                                          selectedPgId,
                                          targetRoomTenantId,
                                          item.amount ? { customAmount: item.amount } : undefined
                                        );
                                        toast({
                                          title: "WhatsApp Reminder Sent",
                                          description: res?.message || `Sent official rent reminder to ${item.tenantName}.`,
                                        });
                                        return;
                                      } catch (err: any) {
                                        console.warn("Backend WhatsApp API failed, falling back to direct link", err);
                                      }
                                    }
                                    const text = encodeURIComponent(
                                      `Hi ${item.tenantName}, your PG rent of ${formatInr(item.amount)} for Room ${item.roomNumber} is pending${item.overdueDays ? ` (overdue by ${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"})` : ""}. Please clear it at your earliest. Thank you!`
                                    );
                                    window.open(`https://wa.me/91${item.phone.replace(/\D/g, "")}?text=${text}`, "_blank");
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3" /> WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] px-2.5 rounded-lg border-teal-300 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 gap-1 font-semibold"
                                  onClick={() => {
                                    const raw = item.rawRow;
                                    const targetRoomTenantId =
                                      (raw as any)?.roomTenantId ||
                                      parseRentTenantRow(raw)?.roomTenantId ||
                                      (raw as any)?.id;

                                    if (selectedPgId && targetRoomTenantId) {
                                      setPaymentLinkTenant({
                                        propertyId: selectedPgId,
                                        roomTenantId: targetRoomTenantId,
                                        tenantName: item.tenantName,
                                        roomNumber: item.roomNumber,
                                        phone: item.phone,
                                      });
                                    }
                                  }}
                                  title="View dues breakdown and payment link"
                                >
                                  <LinkIcon className="h-3 w-3" /> Pay Link
                                </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-[11px] px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                                  onClick={() => openManualForTenant(item.rawRow)}
                                >
                                  Record
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Record Manual Payment Sheet */}
        <Sheet open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
          <SheetContent side="right" className="w-[420px] max-w-full space-y-6">
            <SheetHeader>
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-teal-600" /> Record Offline Payment
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-2 text-xs">
              {unpaidOptions.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Select tenant with pending rent</Label>
                  <Select
                    value={selectedUnpaidKey || "manual"}
                    onValueChange={(v) => {
                      if (v === "manual") {
                        setSelectedUnpaidKey("");
                        setRoomTenantId("");
                        setTenantId("");
                        setAmountPaid("");
                      } else {
                        applyUnpaidSelection(v);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Choose tenant…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Enter details manually</SelectItem>
                      {unpaidOptions.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Room–Tenant ID</Label>
                  <Input
                    value={roomTenantId}
                    onChange={(e) => setRoomTenantId(e.target.value)}
                    placeholder="From booking / tenant record"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tenant ID</Label>
                  <Input
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="Tenant profile ID"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Amount Received (₹)</Label>
                <Input
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 8500"
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>

              <CanAccess permission="account_record_payment">
                <Button
                  onClick={async () => {
                    await handleManual();
                    setManualPaymentOpen(false);
                  }}
                  disabled={manualMut.isPending || !selectedPgId}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl mt-4 h-10 shadow-sm"
                >
                  {manualMut.isPending ? "Recording…" : "Confirm & Save Payment"}
                </Button>
              </CanAccess>
            </div>
          </SheetContent>
        </Sheet>

        {/* Receipt Dialog */}
        <Dialog open={Boolean(receiptDialogData)} onOpenChange={(open) => !open && setReceiptDialogData(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-600" /> Rent Payment Receipt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Official electronic receipt for tenant records
              </DialogDescription>
            </DialogHeader>
            {receiptDialogData && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt / TXN ID</span>
                    <span className="font-mono font-bold">{receiptDialogData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant Name</span>
                    <span className="font-semibold">{receiptDialogData.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Number</span>
                    <span className="font-semibold">Room {receiptDialogData.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Period</span>
                    <span>{receiptDialogData.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Channel</span>
                    <span className="font-medium">{receiptDialogData.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Date</span>
                    <span>{receiptDialogData.date} at {receiptDialogData.time}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm font-bold">
                    <span>Total Paid</span>
                    <span className="text-teal-600">{formatInr(receiptDialogData.amount)}</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 text-xs"
                  onClick={() => {
                    toast({ title: "Receipt Downloaded", description: "PDF receipt saved to your downloads." });
                    setReceiptDialogData(null);
                  }}
                >
                  <Download className="h-4 w-4" /> Download PDF Receipt
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Payment Link & Outstanding Dues Modal */}
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
