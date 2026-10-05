import { useMemo, useState } from "react";
import { Building2, Check, Clock, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { type Complaint, type UpdateComplaintStatusPayload, type PropertyTenant } from "@/api/propertyOwner";
import { useComplaints, useUpdateComplaintStatus, usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FilterBar } from "@/components/common/FilterBar";
import { StatCard } from "@/components/common/StatCard";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type StatusTab = "all" | "open" | "in_progress" | "resolved";

const STATUS_OPTIONS: { value: Exclude<StatusTab, "all">; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

function norm(value?: string) {
  return String(value ?? "").toLowerCase().trim();
}

function statusLabel(status?: string) {
  const value = norm(status);
  if (value === "open") return "Open";
  if (value === "in_progress") return "In progress";
  if (value === "resolved") return "Resolved";
  return status?.trim() || "Open";
}

function statusTone(status?: string): "error" | "info" | "success" | "neutral" {
  const value = norm(status);
  if (value === "open") return "error";
  if (value === "in_progress") return "info";
  if (value === "resolved") return "success";
  return "neutral";
}

function priorityLabel(priority?: string) {
  if (!priority?.trim()) return "Not set";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function priorityTone(priority?: string): "error" | "warning" | "neutral" {
  const value = norm(priority);
  if (value === "high") return "error";
  if (value === "medium") return "warning";
  return "neutral";
}

function roomLine(tenant?: PropertyTenant) {
  if (!tenant) return "Room not linked";
  const room = tenant.roomNumber ? `Room ${tenant.roomNumber}` : "Room not set";
  return tenant.bedNumber ? `${room} · Bed ${tenant.bedNumber}` : room;
}

const Complaints = () => {
  const { selectedPgId, properties } = useApp();
  const selectedPg = properties.find((property) => property.id === selectedPgId);
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("open");
  const [updateRemarks, setUpdateRemarks] = useState("");

  const { data: rawComplaints = [], isLoading, isError, isFetching, refetch } = useComplaints(selectedPgId);
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const updateMutation = useUpdateComplaintStatus(selectedPgId);

  const tenantMap = useMemo(() => {
    const map = new Map<string, PropertyTenant>();
    const list = (tenantsQuery.data as PropertyTenant[] | undefined) ?? [];
    list.forEach((tenant) => {
      if (tenant.id) map.set(tenant.id, tenant);
    });
    return map;
  }, [tenantsQuery.data]);

  const counts = useMemo(() => {
    return {
      open: rawComplaints.filter((complaint) => norm(complaint.status) === "open").length,
      in_progress: rawComplaints.filter((complaint) => norm(complaint.status) === "in_progress").length,
      resolved: rawComplaints.filter((complaint) => norm(complaint.status) === "resolved").length,
    };
  }, [rawComplaints]);

  const filteredComplaints = useMemo(() => {
    return rawComplaints.filter((complaint) => {
      const status = norm(complaint.status);
      if (activeTab !== "all" && status !== activeTab) return false;
      if (priorityFilter !== "all" && norm(complaint.priority) !== priorityFilter) return false;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const tenant = complaint.tenantId ? tenantMap.get(complaint.tenantId) : undefined;
      const haystack = [tenant?.name, complaint.subject, complaint.description, complaint.category, complaint.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rawComplaints, activeTab, priorityFilter, searchQuery, tenantMap]);

  const openDrawer = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatus(complaint.status || "open");
    setUpdateRemarks(complaint.remarks || "");
    setDrawerOpen(true);
  };

  const handleUpdate = async (statusOverride?: string) => {
    if (!selectedComplaint) return;
    const nextStatus = statusOverride || updateStatus;
    try {
      const payload: UpdateComplaintStatusPayload = {
        status: nextStatus,
        ...(updateRemarks.trim() ? { remarks: updateRemarks.trim() } : {}),
      };
      await updateMutation.mutateAsync({ complaintId: selectedComplaint.id, payload });
      toast({ title: `Complaint marked as ${statusLabel(nextStatus).toLowerCase()}` });
      setDrawerOpen(false);
      setSelectedComplaint(null);
    } catch {
      toast({ title: "Couldn't update this complaint", description: "Try again in a moment.", variant: "destructive" });
    }
  };

  const handleQuickStatusChange = async (complaint: Complaint, nextStatus: string) => {
    try {
      const payload: UpdateComplaintStatusPayload = { status: nextStatus };
      await updateMutation.mutateAsync({ complaintId: complaint.id, payload });
      toast({ title: `Complaint marked as ${statusLabel(nextStatus).toLowerCase()}` });
    } catch {
      toast({ title: "Couldn't update this complaint", description: "Try again in a moment.", variant: "destructive" });
    }
  };

  const selectedTenant = selectedComplaint?.tenantId ? tenantMap.get(selectedComplaint.tenantId) : undefined;
  const filtersActive = (activeTab === "all" ? 0 : 1) + (priorityFilter === "all" ? 0 : 1) + (searchQuery.trim() ? 1 : 0);

  return (
    <CanAccessPage permission="complaint_view_all">
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Complaints"
          description={selectedPg ? `Issues raised by tenants at ${selectedPg.name}.` : "Issues raised by tenants from their app."}
        />

        {!selectedPgId ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Select a property"
            description="Choose a PG to see its complaints."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Open"
                value={isLoading ? "—" : counts.open}
                tone={counts.open > 0 ? "warning" : "default"}
                icon={<MessageSquareWarning className="h-4 w-4" />}
                hint="Needs a response"
                onClick={() => setActiveTab((tab) => (tab === "open" ? "all" : "open"))}
              />
              <StatCard
                label="In progress"
                value={isLoading ? "—" : counts.in_progress}
                tone="info"
                icon={<Clock className="h-4 w-4" />}
                hint="Being worked on"
                onClick={() => setActiveTab((tab) => (tab === "in_progress" ? "all" : "in_progress"))}
              />
              <StatCard
                label="Resolved"
                value={isLoading ? "—" : counts.resolved}
                tone="success"
                icon={<Check className="h-4 w-4" />}
                hint="Closed"
                onClick={() => setActiveTab((tab) => (tab === "resolved" ? "all" : "resolved"))}
              />
            </div>

            <FilterBar
              activeCount={filtersActive}
              onReset={() => {
                setActiveTab("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
            >
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tenant, subject, or category"
                aria-label="Search complaints"
                className="h-9 w-full sm:max-w-xs"
              />
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
                {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={activeTab === status ? "default" : "outline"}
                    onClick={() => setActiveTab(status)}
                  >
                    {status === "all" ? "All" : status === "in_progress" ? "In progress" : statusLabel(status)}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by priority">
                {["all", "high", "medium", "low"].map((priority) => (
                  <Button
                    key={priority}
                    type="button"
                    size="sm"
                    variant={priorityFilter === priority ? "default" : "outline"}
                    onClick={() => setPriorityFilter(priority)}
                    className="capitalize"
                  >
                    {priority === "all" ? "Any priority" : priority}
                  </Button>
                ))}
              </div>
            </FilterBar>

            <div className="overflow-hidden rounded-md border border-[var(--gray-200)] bg-white">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="Couldn't load complaints"
                  description="Complaints didn't load. Try again."
                  onRetry={() => void refetch()}
                  retrying={isFetching}
                />
              ) : filteredComplaints.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareWarning className="h-6 w-6" />}
                  title={rawComplaints.length === 0 ? "No complaints" : "No complaints match these filters"}
                  description={
                    rawComplaints.length === 0
                      ? "When a tenant raises an issue from their app, it shows up here."
                      : "Clear the search or filters to see every complaint."
                  }
                />
              ) : (
                <ul className="divide-y divide-[var(--gray-200)]">
                  {filteredComplaints.map((complaint) => {
                    const tenant = complaint.tenantId ? tenantMap.get(complaint.tenantId) : undefined;
                    const status = norm(complaint.status);
                    return (
                      <li key={complaint.id}>
                        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start">
                          <button type="button" onClick={() => openDrawer(complaint)} className="min-w-0 flex-1 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--gray-900)]">
                                {complaint.subject?.trim() || complaint.description?.trim() || "Complaint"}
                              </p>
                              <StatusBadge label={statusLabel(complaint.status)} tone={statusTone(complaint.status)} size="sm" />
                              <StatusBadge label={priorityLabel(complaint.priority)} tone={priorityTone(complaint.priority)} size="sm" />
                            </div>
                            {complaint.description && complaint.subject ? (
                              <p className="mt-1 line-clamp-2 text-sm text-[var(--gray-700)]">{complaint.description}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-[var(--gray-500)]">
                              {tenant?.name || "Tenant"} · {roomLine(tenant)} · {complaint.category?.trim() || "Category not set"} · {complaint.createdAt ? formatDate(complaint.createdAt) : "—"}
                            </p>
                          </button>
                          <CanAccess permission="complaint_edit_assign">
                            <div className="flex shrink-0 gap-2">
                              {status === "open" ? (
                                <Button size="sm" variant="outline" onClick={() => void handleQuickStatusChange(complaint, "in_progress")}>
                                  Start
                                </Button>
                              ) : null}
                              {status !== "resolved" ? (
                                <Button size="sm" onClick={() => void handleQuickStatusChange(complaint, "resolved")}>
                                  Resolve
                                </Button>
                              ) : null}
                            </div>
                          </CanAccess>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md">
            <SheetHeader className="border-b border-[var(--gray-200)] p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-[var(--gray-500)]">#{selectedComplaint?.id?.slice(0, 8)}</span>
                {selectedComplaint ? (
                  <StatusBadge label={statusLabel(selectedComplaint.status)} tone={statusTone(selectedComplaint.status)} size="sm" />
                ) : null}
              </div>
              <SheetTitle className="mt-1 text-lg font-semibold text-[var(--gray-900)]">
                {selectedComplaint?.subject?.trim() || "Complaint"}
              </SheetTitle>
              <SheetDescription>
                Raised {selectedComplaint?.createdAt ? formatDate(selectedComplaint.createdAt) : "—"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 p-6">
              <div className="space-y-2 rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--gray-500)]">Tenant</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--gray-900)]">{selectedTenant?.name || "Tenant"}</p>
                    <p className="text-xs text-[var(--gray-600)]">{roomLine(selectedTenant)}</p>
                  </div>
                  {selectedTenant?.phone ? (
                    <a href={`tel:${selectedTenant.phone}`} className="text-xs font-medium text-[var(--brand-700)] hover:underline">
                      {selectedTenant.phone}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--gray-500)]">Category</p>
                  <p className="text-sm font-medium text-[var(--gray-900)]">{selectedComplaint?.category?.trim() || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--gray-500)]">Priority</p>
                  <p className="text-sm font-medium text-[var(--gray-900)]">{priorityLabel(selectedComplaint?.priority)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[var(--gray-500)]">What they reported</p>
                <p className="mt-1.5 whitespace-pre-wrap rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)] p-3 text-sm leading-relaxed text-[var(--gray-800)]">
                  {selectedComplaint?.description?.trim() || selectedComplaint?.subject?.trim() || "No details provided."}
                </p>
              </div>

              <CanAccess permission="complaint_edit_assign">
                <div className="space-y-4 border-t border-[var(--gray-200)] pt-4">
                  <div className="space-y-2">
                    <Label id="complaint-status-label">Status</Label>
                    <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="complaint-status-label">
                      {STATUS_OPTIONS.map((option) => {
                        const selected = norm(updateStatus) === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setUpdateStatus(option.value)}
                            className={cn(
                              "h-10 rounded-md border text-sm font-medium",
                              selected
                                ? "border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                                : "border-[var(--gray-200)] bg-white text-[var(--gray-700)]",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complaint-remarks">Note for the tenant</Label>
                    <Textarea
                      id="complaint-remarks"
                      placeholder="Optional. What was done, or when it will be fixed."
                      value={updateRemarks}
                      onChange={(event) => setUpdateRemarks(event.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => void handleUpdate()}
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </CanAccess>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </CanAccessPage>
  );
};

export default Complaints;
