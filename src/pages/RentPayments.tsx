import { useMemo, useState } from "react";
import { IndianRupee, Loader2, Users, Wallet, BedDouble, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
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
import { usePostManualRentMutation, useRentCollectionDashboard } from "@/hooks/usePropertyOwnerQueries";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import type { RentDashboardTenantRow } from "@/api/propertyOwner";
import { amountFromRow, formatInr, parseRentTenantRow } from "@/lib/rentDashboard";

function TenantTable({
  rows,
  emptyLabel,
}: {
  rows: RentDashboardTenantRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center border rounded-md bg-muted/20">{emptyLabel}</p>
    );
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const parsed = parseRentTenantRow(row);
            const amt = amountFromRow(row);
            const room = row.roomNumber ?? row.room_number ?? "—";
            return (
              <TableRow key={parsed ? `${parsed.roomTenantId}-${i}` : i}>
                <TableCell className="font-medium">
                  {parsed?.label ?? String(row.tenantName ?? row.name ?? row.tenant_name ?? "—")}
                </TableCell>
                <TableCell className="text-muted-foreground">{String(room)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {amt != null ? formatInr(amt) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const RentPayments = () => {
  const { selectedPgId, properties, setSelectedPgId } = useApp();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const [roomTenantId, setRoomTenantId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedUnpaidKey, setSelectedUnpaidKey] = useState<string>("");

  const rentQuery = useRentCollectionDashboard(selectedPgId, month, year);
  const dashboard = rentQuery.data;

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
      toast({ title: "Payment recorded" });
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

  return (
    <CanAccessPage permission="account_view_dues">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rent & Payments"
        description="View collection for the selected month and record cash or offline payments."
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label>PG</Label>
          <Select value={selectedPgId ?? "none"} onValueChange={(v) => { if (v !== "none") setSelectedPgId(v); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select PG" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Month</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v, 10))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Rent collection — {month}/{year}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedPgId ? (
            <p className="text-sm text-muted-foreground">Select a PG to load this period.</p>
          ) : rentQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
            </div>
          ) : rentQuery.isError ? (
            <p className="text-sm text-destructive">Could not load rent dashboard. Try again.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      <Wallet className="h-3.5 w-3.5" /> Collected (period)
                    </div>
                    <p className="text-2xl font-semibold tabular-nums mt-1">
                      {formatInr(dashboard?.totalCollectedThisPeriod ?? 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      <IndianRupee className="h-3.5 w-3.5" /> All-time revenue
                    </div>
                    <p className="text-2xl font-semibold tabular-nums mt-1">
                      {formatInr(dashboard?.totalRevenueAllTime ?? 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Paid
                    </div>
                    <p className="text-2xl font-semibold tabular-nums mt-1">{dashboard?.paidCount ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Unpaid
                    </div>
                    <p className="text-2xl font-semibold tabular-nums mt-1">{dashboard?.unpaidCount ?? 0}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/30">
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> Empty beds: <strong className="text-foreground">{dashboard?.emptyBedsCount ?? 0}</strong>
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Tenants paid / unpaid:{" "}
                  <strong className="text-foreground">
                    {dashboard?.paidCount ?? 0} / {dashboard?.unpaidCount ?? 0}
                  </strong>
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Paid this period</h3>
                  <TenantTable rows={dashboard?.paidTenants ?? []} emptyLabel="No paid tenants for this period." />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Pending payment</h3>
                  <TenantTable rows={dashboard?.unpaidTenants ?? []} emptyLabel="No unpaid tenants for this period." />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record manual payment</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Use when rent was collected offline. The period matches the month and year selected above.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          {unpaidOptions.length > 0 && (
            <div className="space-y-1">
              <Label>Select tenant with pending rent</Label>
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
                <SelectTrigger>
                  <SelectValue placeholder="Choose tenant…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter details manually</SelectItem>
                  {unpaidOptions.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Room–tenant ID</Label>
              <Input
                value={roomTenantId}
                onChange={(e) => setRoomTenantId(e.target.value)}
                placeholder="From booking / tenant record"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label>Tenant ID</Label>
              <Input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Tenant profile ID"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="space-y-1 max-w-xs">
            <Label>Amount received (₹)</Label>
            <Input value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} inputMode="decimal" placeholder="e.g. 8500" />
          </div>
          <CanAccess permission="account_record_payment">
            <Button onClick={handleManual} disabled={manualMut.isPending || !selectedPgId}>
              {manualMut.isPending ? "Saving…" : "Record payment"}
            </Button>
          </CanAccess>
        </CardContent>
      </Card>
    </div>
    </CanAccessPage>
  );
};

export default RentPayments;
