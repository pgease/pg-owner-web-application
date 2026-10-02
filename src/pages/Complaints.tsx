import { useState, useMemo } from "react";
import { MessageSquareWarning, Building2, Eye, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { type Complaint, type UpdateComplaintStatusPayload, type PropertyTenant } from "@/api/propertyOwner";
import { useComplaints, useUpdateComplaintStatus, usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { formatDate } from "@/lib/formatters";

type StatusTab = "all" | "open" | "in_progress" | "resolved";

const statusOptions: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const Complaints = () => {
  const { selectedPgId } = useApp();
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [compact, setCompact] = useState<boolean>(false);

  // Drawer state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("open");
  const [updateRemarks, setUpdateRemarks] = useState<string>("");

  // Fetch complaints (unfiltered at API level so counts are consistent with Dashboard)
  const { data: rawComplaints = [], isLoading, isError, refetch } = useComplaints(selectedPgId);
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const updateMutation = useUpdateComplaintStatus(selectedPgId);

  // Map tenantId to Tenant Info
  const tenantMap = useMemo(() => {
    const map = new Map<string, PropertyTenant>();
    const list = (tenantsQuery.data as PropertyTenant[] | undefined) ?? [];
    list.forEach((t) => {
      if (t.id) map.set(t.id, t);
    });
    return map;
  }, [tenantsQuery.data]);

  const norm = (s?: string) => String(s ?? "").toLowerCase().trim();

  // Counts for tabs (exact match with Dashboard)
  const counts = useMemo(() => {
    return {
      all: rawComplaints.length,
      open: rawComplaints.filter((c) => norm(c.status) === "open").length,
      in_progress: rawComplaints.filter((c) => norm(c.status) === "in_progress").length,
      resolved: rawComplaints.filter((c) => norm(c.status) === "resolved").length,
    };
  }, [rawComplaints]);

  // Filtered complaints based on tab, priority, and search
  const filteredComplaints = useMemo(() => {
    return rawComplaints.filter((c) => {
      const status = norm(c.status);
      if (activeTab === "open" && status !== "open") return false;
      if (activeTab === "in_progress" && status !== "in_progress") return false;
      if (activeTab === "resolved" && status !== "resolved") return false;

      if (priorityFilter !== "all" && norm(c.priority) !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tenant = c.tenantId ? tenantMap.get(c.tenantId) : undefined;
        const tenantName = (tenant?.name || "").toLowerCase();
        const subject = (c.subject || "").toLowerCase();
        const desc = (c.description || "").toLowerCase();
        const category = (c.category || "").toLowerCase();
        const id = (c.id || "").toLowerCase();

        if (
          !tenantName.includes(q) &&
          !subject.includes(q) &&
          !desc.includes(q) &&
          !category.includes(q) &&
          !id.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rawComplaints, activeTab, priorityFilter, searchQuery, tenantMap]);

  const openDrawer = (c: Complaint) => {
    setSelectedComplaint(c);
    setUpdateStatus(c.status || "open");
    setUpdateRemarks(c.remarks || "");
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
      toast({ title: `Complaint marked as ${nextStatus.replace("_", " ")}` });
      setDrawerOpen(false);
      setSelectedComplaint(null);
    } catch {
      toast({ title: "Failed to update complaint", variant: "destructive" });
    }
  };

  const handleQuickStatusChange = async (c: Complaint, nextStatus: string) => {
    try {
      const payload: UpdateComplaintStatusPayload = { status: nextStatus };
      await updateMutation.mutateAsync({ complaintId: c.id, payload });
      toast({ title: `Complaint marked as ${nextStatus.replace("_", " ")}` });
    } catch {
      toast({ title: "Failed to update complaint", variant: "destructive" });
    }
  };

  const columns: Column<Complaint>[] = [
    {
      key: "id",
      header: "Complaint",
      width: "120px",
      render: (c) => (
        <span className="font-mono text-xs text-[var(--gray-700)]">
          #{c.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "tenant",
      header: "Tenant / Room",
      render: (c) => {
        const tenant = c.tenantId ? tenantMap.get(c.tenantId) : undefined;
        return (
          <div>
            <div className="font-medium text-sm text-[var(--gray-900)]">
              {tenant ? tenant.name : "Tenant"}
            </div>
            <div className="text-xs text-[var(--gray-500)]">
              {tenant ? `Room ${tenant.roomNumber || "—"} · ${tenant.bedNumber || "Bed"}` : "Unlinked room"}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      render: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)]">
          {c.category || "General"}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (c) => (
        <div className="max-w-[280px]">
          <div className="text-sm font-medium text-[var(--gray-900)] truncate">
            {c.subject || c.description || "No subject"}
          </div>
          {c.description && c.subject && (
            <div className="text-xs text-[var(--gray-500)] truncate">
              {c.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (c) => {
        const p = norm(c.priority);
        let tone: "error" | "warning" | "neutral" = "neutral";
        if (p === "high") tone = "error";
        else if (p === "medium") tone = "warning";
        return (
          <StatusBadge
            label={c.priority ? c.priority.charAt(0).toUpperCase() + c.priority.slice(1) : "Normal"}
            tone={tone}
            size="sm"
          />
        );
      },
    },
    {
      key: "createdAt",
      header: "Raised on",
      render: (c) => (
        <span className="text-sm text-[var(--gray-600)] tabular-nums">
          {c.createdAt ? formatDate(c.createdAt) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => {
        const s = norm(c.status);
        let tone: "error" | "info" | "success" | "neutral" = "neutral";
        let label = "Pending";
        if (s === "open") {
          tone = "error";
          label = "Open";
        } else if (s === "in_progress") {
          tone = "info";
          label = "In progress";
        } else if (s === "resolved") {
          tone = "success";
          label = "Resolved";
        }
        return <StatusBadge label={label} tone={tone} />;
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <CanAccess permission="complaint_edit_assign">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => openDrawer(c)}
            >
              Update
            </Button>
          </CanAccess>
          <ActionMenu
            items={[
              {
                label: "View details",
                icon: <Eye className="h-4 w-4" />,
                onClick: () => openDrawer(c),
              },
              {
                label: "Mark In Progress",
                icon: <Clock className="h-4 w-4" />,
                disabled: norm(c.status) === "in_progress",
                onClick: () => handleQuickStatusChange(c, "in_progress"),
              },
              {
                label: "Mark Resolved",
                icon: <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />,
                disabled: norm(c.status) === "resolved",
                onClick: () => handleQuickStatusChange(c, "resolved"),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const selectedTenant = selectedComplaint?.tenantId
    ? tenantMap.get(selectedComplaint.tenantId)
    : undefined;

  return (
    <CanAccessPage permission="complaint_view_all">
      <div className="space-y-6">
        <PageHeader
          title="Complaints"
          description="Track and resolve issues raised by tenants from their app."
        />

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to see its complaints."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Tabs with exact counts matching Dashboard */}
            <div className="flex flex-wrap items-center gap-1 border-b border-[var(--gray-200)] pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "all"
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                }`}
              >
                All complaints
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[var(--gray-200)] text-[var(--gray-700)] tabular-nums">
                  {counts.all}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("open")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "open"
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                }`}
              >
                Open
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full tabular-nums ${
                    counts.open > 0 ? "bg-[#FEF1F0] text-[#B42318] font-semibold" : "bg-[var(--gray-200)] text-[var(--gray-700)]"
                  }`}
                >
                  {counts.open}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("in_progress")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "in_progress"
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                }`}
              >
                In progress
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#EEF5FF] text-[#1D5FC2] tabular-nums font-semibold">
                  {counts.in_progress}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resolved")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "resolved"
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                }`}
              >
                Resolved
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#ECFAF1] text-[#157F3D] tabular-nums font-semibold">
                  {counts.resolved}
                </span>
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-md border border-[var(--gray-200)]">
              <div className="flex-1 max-w-sm">
                <SearchInput
                  placeholder="Search by ID, tenant, category..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--gray-100)] p-0.5 rounded-md border border-[var(--gray-200)] text-xs">
                  {["all", "high", "medium", "low"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2 py-1 rounded capitalize font-medium transition-colors ${
                        priorityFilter === p
                          ? "bg-white text-[var(--gray-900)] shadow-sm"
                          : "text-[var(--gray-600)] hover:text-[var(--gray-900)]"
                      }`}
                    >
                      {p === "all" ? "All Priorities" : p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompact(!compact)}
                  className="h-8 text-xs border-[var(--gray-300)]"
                >
                  {compact ? "Default" : "Compact"}
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredComplaints}
              keyExtractor={(c) => c.id}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              compact={compact}
              onRowClick={(c) => openDrawer(c)}
              emptyTitle="No complaints found"
              emptyDescription={
                searchQuery || priorityFilter !== "all" || activeTab !== "all"
                  ? "No complaints match your current filters. Try resetting the search or filter."
                  : "When tenants raise a complaint from their app, it will appear here."
              }
            />
          </div>
        )}

        {/* Complaint Detail & Status Update Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-[480px] max-w-full overflow-y-auto p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-[var(--gray-200)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--gray-500)]">
                  #{selectedComplaint?.id}
                </span>
                {selectedComplaint && (
                  <StatusBadge
                    status={selectedComplaint.status}
                    tone={
                      norm(selectedComplaint.status) === "resolved"
                        ? "success"
                        : norm(selectedComplaint.status) === "in_progress"
                        ? "info"
                        : "error"
                    }
                  />
                )}
              </div>
              <SheetTitle className="text-lg font-semibold text-[var(--gray-900)] mt-1">
                {selectedComplaint?.subject || "Complaint Details"}
              </SheetTitle>
              <SheetDescription className="text-xs text-[var(--gray-500)]">
                Raised on {selectedComplaint?.createdAt ? formatDate(selectedComplaint.createdAt) : "—"}
              </SheetDescription>
            </SheetHeader>

            <div className="p-6 space-y-6 flex-1">
              {/* Tenant context */}
              <div className="bg-[var(--gray-50)] p-4 rounded-md border border-[var(--gray-200)] space-y-2">
                <div className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider">
                  Tenant Information
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-[var(--gray-900)]">
                      {selectedTenant?.name || "Tenant"}
                    </div>
                    <div className="text-xs text-[var(--gray-600)]">
                      Room {selectedTenant?.roomNumber || "—"} · Bed {selectedTenant?.bedNumber || "—"}
                    </div>
                  </div>
                  {selectedTenant?.phone && (
                    <a
                      href={`tel:${selectedTenant.phone}`}
                      className="text-xs font-medium text-[var(--brand-600)] hover:underline"
                    >
                      {selectedTenant.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-[var(--gray-500)]">Category</div>
                  <div className="text-sm font-medium text-[var(--gray-900)]">
                    {selectedComplaint?.category || "General"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-[var(--gray-500)]">Priority</div>
                  <div className="text-sm font-medium capitalize text-[var(--gray-900)]">
                    {selectedComplaint?.priority || "Normal"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs text-[var(--gray-500)]">Description</div>
                <div className="text-sm text-[var(--gray-800)] bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)] whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint?.description || selectedComplaint?.subject || "No details provided."}
                </div>
              </div>

              {/* Status Update Form */}
              <CanAccess permission="complaint_edit_assign">
                <div className="pt-4 border-t border-[var(--gray-200)] space-y-4">
                  <div className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider">
                    Update Status & Remarks
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[var(--gray-700)]">Status</Label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[var(--gray-700)]">
                      Resolution Remarks (optional)
                    </Label>
                    <Textarea
                      placeholder="e.g. Geyser technician visited and replaced coil"
                      value={updateRemarks}
                      onChange={(e) => setUpdateRemarks(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleUpdate()}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white h-9"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Status"}
                    </Button>
                  </div>
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
