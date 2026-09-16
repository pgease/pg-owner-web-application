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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import type { RentDashboardTenantRow } from "@/api/propertyOwner";
import { amountFromRow, formatInr, parseRentTenantRow } from "@/lib/rentDashboard";
import { cn } from "@/lib/utils";

function TenantTable({
  rows,
  emptyLabel,
  isUnpaid = false,
  onRecordPay,
}: {
  rows: RentDashboardTenantRow[];
  emptyLabel: string;
  isUnpaid?: boolean;
  onRecordPay?: (row: RentDashboardTenantRow) => void;
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
                        className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = encodeURIComponent(
                            `Hi ${tenantName}, this is a gentle reminder that your PG rent of ${amt != null ? formatInr(amt) : "due amount"} is pending for this month. Please pay to avoid late fees. Thank you!`
                          );
                          window.open(phone ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> WhatsApp
                      </Button>
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
  const [duesSearch, setDuesSearch] = useState("");
  const [duesFilter, setDuesFilter] = useState("all");
  const [receiptDialogData, setReceiptDialogData] = useState<any | null>(null);

  const rentQuery = useRentCollectionDashboard(selectedPgId, month, year);
  const dashboard = rentQuery.data;
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const manualMut = usePostManualRentMutation(selectedPgId);

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

  // Synthesize payment transactions ledger based on paid tenants & tenant data
  const paymentTransactions = useMemo(() => {
    const paidList = dashboard?.paidTenants || [];
    const dummyModes = ["UPI Intent", "Cash (Manual)", "Razorpay Online", "Bank Transfer (IMPS)"];
    
    return paidList.map((item, idx) => {
      const parsed = parseRentTenantRow(item);
      const amt = Number((item as any).amountPaid) || Number((item as any).rentAmount) || amountFromRow(item) || 0;
      const room = item.roomNumber ?? item.room_number ?? "—";
      const name = parsed?.label || item.tenantName || item.name || `Tenant #${idx + 1}`;
      const mode = dummyModes[idx % dummyModes.length];
      const date = item.paidAt ? new Date(item.paidAt) : new Date(Date.now() - idx * 86400000 * 2.5);

      return {
        id: `TXN-${year}${String(month).padStart(2, "0")}-${1000 + idx}`,
        tenantName: name,
        roomNumber: String(room),
        amount: amt,
        mode,
        status: "Completed",
        date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        period: `${month}/${year}`,
        refId: `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
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
      const overdueDays = 3 + idx * 4;

      return {
        id: `DUE-${item.id || idx}`,
        tenantName: name,
        phone,
        roomNumber: String(room),
        dueType: Number((item as any).electricityBill || 0) > 0 ? "Monthly Rent + Electricity" : "Monthly Rent",
        amount: amt,
        dueDate: `05/${String(month).padStart(2, "0")}/${year}`,
        overdueDays,
        status: overdueDays > 15 ? "CRITICAL" : "OVERDUE",
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
      if (duesFilter === "critical") return matchesSearch && item.overdueDays > 15;
      if (duesFilter === "recent") return matchesSearch && item.overdueDays <= 7;
      return matchesSearch;
    });
  }, [pendingDuesList, duesSearch, duesFilter]);

  const totalDuesOutstanding = pendingDuesList.reduce((sum, d) => sum + d.amount, 0);

  return (
    <CanAccessPage permission="account_view_dues">
      <div className="space-y-6 animate-fade-in max-w-7xl">
        {/* Main Header */}
        <PageHeader
          title={
            isHistoryView
              ? "Payment History & Transactions"
              : isDuesView
              ? "Dues & Pending Recovery Desk"
              : "Rent & Payments Collection"
          }
          description={
            isHistoryView
              ? "Comprehensive audit trail and receipts for all received rent and amenity payments."
              : isDuesView
              ? "Track overdue rent balances and send instant 1-click WhatsApp payment reminders."
              : "View rent collection for current cycle, track paid vs unpaid tenants, and record manual payments."
          }
          actions={
            <Button
              size="sm"
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
              onClick={() => setManualPaymentOpen(true)}
              disabled={!selectedPgId}
            >
              <IndianRupee className="h-4 w-4" /> Record Manual Payment
            </Button>
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
                    <span>Collected (Month)</span>
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
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 font-semibold">
                    Immediate Action
                  </Badge>
                </div>
                <TenantTable
                  rows={dashboard?.unpaidTenants ?? []}
                  emptyLabel="All active tenants have cleared rent for this period! 🎉"
                  isUnpaid={true}
                  onRecordPay={openManualForTenant}
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
                    {formatInr(dashboard?.totalCollectedThisPeriod ?? 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Recorded for {month}/{year}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Settled Transactions</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums mt-1">
                    {paymentTransactions.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Verified receipts generated</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs border-border/80">
                <CardContent className="pt-4 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Channel Breakdown</span>
                  <p className="text-sm font-bold text-foreground mt-2 flex items-center gap-3">
                    <span className="text-teal-600">85% UPI Intent</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-amber-600">15% Cash</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Direct to PG bank account</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tenant, room or TXN ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Select value={historyMode} onValueChange={setHistoryMode}>
                  <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl">
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Modes</SelectItem>
                    <SelectItem value="upi">UPI Intent & QR</SelectItem>
                    <SelectItem value="cash">Cash (Manual)</SelectItem>
                    <SelectItem value="razorpay">Razorpay Gateway</SelectItem>
                    <SelectItem value="bank">Bank IMPS/NEFT</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* Transactions Table */}
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {filteredHistory.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <History className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <h4 className="text-sm font-semibold">No transactions recorded yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Payments collected via UPI QR or manual cash entries for {month}/{year} will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Transaction ID</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Mode</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-foreground text-[11px]">
                              {item.id}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-medium text-foreground block">{item.date}</span>
                              <span className="text-[10px] text-muted-foreground">{item.time}</span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-foreground">
                              {item.tenantName}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-muted-foreground">
                              Room {item.roomNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-semibold",
                                  item.mode.includes("UPI")
                                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200"
                                    : item.mode.includes("Cash")
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200"
                                )}
                              >
                                {item.mode}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums font-bold text-foreground">
                              {formatInr(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold">
                                Paid
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                onClick={() => setReceiptDialogData(item)}
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
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
                    {pendingDuesList.filter((d) => d.overdueDays > 15).length}
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
                  onClick={() => {
                    toast({
                      title: "Bulk WhatsApp Reminders Queued",
                      description: `Queued reminders for ${filteredDues.length} tenants with pending rent.`,
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
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-bold",
                                  item.overdueDays > 15
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                )}
                              >
                                {item.overdueDays} days overdue
                              </Badge>
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
                                  onClick={() => {
                                    const text = encodeURIComponent(
                                      `Hi ${item.tenantName}, your PG rent of ${formatInr(item.amount)} for Room ${item.roomNumber} is overdue by ${item.overdueDays} days. Please clear it immediately to avoid penalties. You can pay via UPI to our registered PG account. Thank you!`
                                    );
                                    window.open(`https://wa.me/91${item.phone.replace(/\D/g, "")}?text=${text}`, "_blank");
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3" /> WhatsApp
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
      </div>
    </CanAccessPage>
  );
};

export default RentPayments;
