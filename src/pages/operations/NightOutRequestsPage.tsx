import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Clock, MapPin, Moon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppContext";
import { createNightOutRequest, getNightOutRequests, updateNightOutRequestStatus } from "@/api/propertyOwner";
import { usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FilterBar } from "@/components/common/FilterBar";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";

type NightOutStatus = "pending" | "approved" | "rejected";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DATE_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + index);
  const when = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const label = index === 0 ? `Today · ${when}` : index === 1 ? `Tomorrow · ${when}` : when;
  return { value: dateKey(date), label };
});

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${pad(hours)}:${minutes}`;
  const label = new Date(2026, 0, 1, hours, Number(minutes)).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { value, label };
});

function combineWhen(day: string, time: string): Date | null {
  if (!day || !time) return null;
  const date = new Date(`${day}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  const record = value as { data?: unknown; requests?: unknown; tenants?: unknown } | null;
  if (Array.isArray(record?.data)) return record.data;
  if (Array.isArray(record?.requests)) return record.requests;
  if (Array.isArray(record?.tenants)) return record.tenants;
  return [];
}

function requestStatus(req: any): NightOutStatus {
  const value = String(req?.status || "pending").toLowerCase();
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function formatWhen(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function tenantName(req: any): string {
  if (!req) return "This tenant";
  return req.tenantName || req.tenant?.name || req.tenant?.fullName || "Tenant";
}

function roomLabel(req: any): string {
  const room = req.roomNumber || req.room?.roomNumber;
  return room ? `Room ${room}` : "Room not set";
}

export default function NightOutRequestsPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const [statusFilter, setStatusFilter] = useState<"all" | NightOutStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [remarks, setRemarks] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [leaveDay, setLeaveDay] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [returnDay, setReturnDay] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [reason, setReason] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const { data: tenantsData = [] } = usePropertyTenants(selectedPgId);
  const tenantsList = asList(tenantsData);

  const requestsQuery = useQuery({
    queryKey: ["nightOutRequests", selectedPgId],
    queryFn: () => (selectedPgId ? getNightOutRequests(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !selectedRequest) return;
      return updateNightOutRequestStatus(selectedPgId, selectedRequest.id || selectedRequest._id, actionType, remarks.trim() || undefined);
    },
    onSuccess: () => {
      toast({
        title: actionType === "approved" ? "Pass approved" : "Pass rejected",
        description: actionType === "approved" ? "The tenant can leave for the night." : "The tenant has been refused this pass.",
      });
      setSelectedRequest(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["nightOutRequests", selectedPgId] });
    },
    onError: () => {
      toast({ title: "Couldn't update this pass", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const createNightOutMutation = useMutation({
    mutationFn: async () => {
      const leaveAt = combineWhen(leaveDay, leaveTime);
      const returnAt = combineWhen(returnDay, returnTime);
      if (!selectedPgId || !selectedTenantId || !leaveAt || !returnAt) return;
      return createNightOutRequest(selectedPgId, {
        tenantId: selectedTenantId,
        leaveDate: leaveAt.toISOString(),
        returnDate: returnAt.toISOString(),
        reason: reason.trim() || undefined,
        destinationAddress: destinationAddress.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Night out pass issued", description: "It is saved for this tenant." });
      setAddOpen(false);
      setSelectedTenantId("");
      setLeaveDay("");
      setLeaveTime("");
      setReturnDay("");
      setReturnTime("");
      setReason("");
      setDestinationAddress("");
      queryClient.invalidateQueries({ queryKey: ["nightOutRequests", selectedPgId] });
    },
    onError: () => {
      toast({ title: "Couldn't issue this pass", description: "Check the details and try again.", variant: "destructive" });
    },
  });

  const requests = asList(requestsQuery.data);
  const counts = useMemo(() => {
    return requests.reduce(
      (acc, req) => {
        acc[requestStatus(req)] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<NightOutStatus, number>,
    );
  }, [requests]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== "all" && requestStatus(req) !== statusFilter) return false;
      if (!q) return true;
      return [tenantName(req), roomLabel(req), req.reason, req.destinationAddress].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [requests, search, statusFilter]);

  const leaveAt = combineWhen(leaveDay, leaveTime);
  const returnAt = combineWhen(returnDay, returnTime);
  const returnIsAfterLeave = Boolean(leaveAt && returnAt && returnAt > leaveAt);
  const canIssue = Boolean(selectedTenantId && returnIsAfterLeave);

  return (
    <CanAccessPage permission="nightout_view">
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Night Out Passes"
          description={selectedPg ? `Leave and return requests for ${selectedPg.name}.` : "Leave and return requests for this property."}
          actions={
            <Button className="gap-1.5" onClick={() => setAddOpen(true)} disabled={!selectedPgId}>
              <Plus className="h-4 w-4" /> Issue pass
            </Button>
          }
        />

        {!selectedPgId ? (
          <EmptyState icon={<Building2 className="h-6 w-6" />} title="Select a property" description="Choose a PG to see night out requests." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Pending" value={requestsQuery.isLoading ? "—" : counts.pending} tone={counts.pending > 0 ? "warning" : "default"} icon={<Clock className="h-4 w-4" />} hint="Waiting for a decision" />
              <StatCard label="Approved" value={requestsQuery.isLoading ? "—" : counts.approved} tone="success" icon={<Check className="h-4 w-4" />} hint="Allowed to stay out" />
              <StatCard label="Rejected" value={requestsQuery.isLoading ? "—" : counts.rejected} tone="danger" icon={<X className="h-4 w-4" />} hint="Not allowed" />
            </div>

            <FilterBar
              activeCount={(statusFilter === "all" ? 0 : 1) + (search.trim() ? 1 : 0)}
              onReset={() => {
                setStatusFilter("all");
                setSearch("");
              }}
            >
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant, room, or reason"
                aria-label="Search night out passes"
                className="h-9 w-full sm:max-w-xs"
              />
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </FilterBar>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {requestsQuery.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : requestsQuery.isError ? (
                <ErrorState
                  title="Couldn't load night out passes"
                  description="Requests didn't load. Try again."
                  onRetry={() => void requestsQuery.refetch()}
                  retrying={requestsQuery.isFetching}
                />
              ) : visible.length === 0 ? (
                <EmptyState
                  icon={<Moon className="h-6 w-6" />}
                  title={requests.length === 0 ? "No night out requests" : "No passes match these filters"}
                  description={requests.length === 0 ? "Requests from tenants will show up here. You can also issue a pass yourself." : "Clear the search or status filter to see every pass."}
                  action={
                    requests.length === 0 ? (
                      <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
                        <Plus className="h-4 w-4" /> Issue pass
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-[var(--gray-200)]">
                  {visible.map((req: any, idx: number) => {
                    const status = requestStatus(req);
                    const leave = req.leaveDate || req.fromDate;
                    const leaveDate = leave ? new Date(leave) : null;
                    const dayNum = leaveDate && !Number.isNaN(leaveDate.getTime()) ? leaveDate.getDate() : "—";
                    const month = leaveDate && !Number.isNaN(leaveDate.getTime()) ? leaveDate.toLocaleDateString("en-IN", { month: "short" }) : "";
                    return (
                      <li key={req.id || req._id || idx} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-[var(--gray-50)] text-[var(--gray-900)]">
                          <span className="text-lg font-semibold leading-none tabular-nums">{dayNum}</span>
                          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--gray-500)]">{month}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--gray-900)]">{tenantName(req)}</p>
                            <span className="text-xs text-[var(--gray-500)]">{roomLabel(req)}</span>
                            <StatusBadge status={status} tone={status === "pending" ? "warning" : undefined} size="sm" />
                          </div>
                          <p className="mt-1 text-sm text-[var(--gray-700)]">{req.reason || req.purpose || "No reason given"}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--gray-500)]">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> {formatWhen(leave)} → {formatWhen(req.returnDate || req.toDate)}</span>
                            {req.destinationAddress || req.destination ? (
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden /> {req.destinationAddress || req.destination}</span>
                            ) : null}
                          </p>
                        </div>
                        {status === "pending" ? (
                          <div className="flex shrink-0 gap-2 sm:flex-col">
                            <Button size="sm" onClick={() => { setSelectedRequest(req); setActionType("approved"); setRemarks(""); }}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setActionType("rejected"); setRemarks(""); }}>Reject</Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Issue a night out pass</DialogTitle>
              <DialogDescription>Record a pass for a tenant who is leaving overnight.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nightout-tenant">Tenant</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger id="nightout-tenant">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name || tenant.fullName || "Tenant"}
                        {tenant.roomNumber || tenant.room?.roomNumber ? ` · Room ${tenant.roomNumber || tenant.room?.roomNumber}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label id="nightout-leave-label">Leaves</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={leaveDay || undefined} onValueChange={setLeaveDay}>
                    <SelectTrigger id="nightout-leave-date" aria-labelledby="nightout-leave-label">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={leaveTime || undefined} onValueChange={setLeaveTime}>
                    <SelectTrigger id="nightout-leave-time" aria-label="Leave time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={`leave-${option.value}`} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label id="nightout-return-label">Returns</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={returnDay || undefined} onValueChange={setReturnDay}>
                    <SelectTrigger id="nightout-return-date" aria-labelledby="nightout-return-label">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_OPTIONS.map((option) => (
                        <SelectItem key={`return-${option.value}`} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={returnTime || undefined} onValueChange={setReturnTime}>
                    <SelectTrigger id="nightout-return-time" aria-label="Return time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={`return-time-${option.value}`} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {leaveAt && returnAt && !returnIsAfterLeave ? (
                  <p className="text-xs text-destructive">Return has to be after they leave.</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nightout-destination">Where they are going</Label>
                <Input id="nightout-destination" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="Address or area" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nightout-reason">Reason</Label>
                <Textarea id="nightout-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why they need to stay out" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => createNightOutMutation.mutate()} disabled={!canIssue || createNightOutMutation.isPending}>
                {createNightOutMutation.isPending ? "Issuing…" : "Issue pass"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{actionType === "approved" ? "Approve this pass?" : "Reject this pass?"}</DialogTitle>
              <DialogDescription>
                {actionType === "approved"
                  ? `${tenantName(selectedRequest)} will be allowed to stay out overnight.`
                  : `${tenantName(selectedRequest)} will not be allowed to stay out on this request.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="nightout-remarks">Note for the tenant</Label>
              <Textarea id="nightout-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Optional. For example, return by 8:00 AM." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
              <Button
                variant={actionType === "rejected" ? "destructive" : "default"}
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Saving…" : actionType === "approved" ? "Approve pass" : "Reject pass"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
