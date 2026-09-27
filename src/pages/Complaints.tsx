import { useState } from "react";
import { MessageSquareWarning, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { type Complaint, type UpdateComplaintStatusPayload } from "@/api/propertyOwner";
import { useComplaints, useUpdateComplaintStatus } from "@/hooks/usePropertyOwnerQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

const statusOptions: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const Complaints = () => {
  const { selectedPgId } = useApp();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState<{ status: string; remarks: string }>({ status: "", remarks: "" });

  const { data: complaints = [], isLoading: loading, isError, refetch } = useComplaints(selectedPgId, priorityFilter);
  const updateMutation = useUpdateComplaintStatus(selectedPgId, priorityFilter);

  const openUpdate = (c: Complaint) => {
    setUpdatingId(c.id);
    setUpdateForm({ status: c.status || "open", remarks: c.remarks || "" });
    setUpdateOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!updatingId) return;
    try {
      const payload: UpdateComplaintStatusPayload = {
        status: updateForm.status,
        ...(updateForm.remarks.trim() ? { remarks: updateForm.remarks.trim() } : {}),
      };
      await updateMutation.mutateAsync({ complaintId: updatingId, payload });
      toast({ title: "Complaint updated" });
      setUpdateOpen(false);
      setUpdatingId(null);
    } catch (e) {
      toast({ title: "Failed to update complaint", variant: "destructive" });
    }
  };

  const openCount = complaints.filter((c) => (c.status || "").toLowerCase() === "open").length;
  const inProgressCount = complaints.filter((c) => (c.status || "").toLowerCase() === "in_progress").length;
  const resolvedCount = complaints.filter((c) => (c.status || "").toLowerCase() === "resolved").length;

  return (
    <CanAccessPage permission="complaint_view_all">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Complaints"
        description="Complaints raised by tenants from their app. Update the status here so they know it's being handled."
      />

      {!selectedPgId ? (
        <Card>
          <EmptyState
            icon={<Building2 />}
            title="Select a property"
            description="Choose a PG from the switcher in the top bar to see its complaints."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Open" value={openCount} tone={openCount > 0 ? "danger" : "default"} icon={<MessageSquareWarning />} loading={loading} hint="Waiting for action" />
            <StatCard label="In progress" value={inProgressCount} tone={inProgressCount > 0 ? "warning" : "default"} icon={<MessageSquareWarning />} loading={loading} hint="Being handled" />
            <StatCard label="Resolved" value={resolvedCount} tone="success" icon={<MessageSquareWarning />} loading={loading} hint="Closed" />
          </div>

          <FilterBar activeCount={priorityFilter === "all" ? 0 : 1} onReset={() => setPriorityFilter("all")}>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <DataTableContainer>
              {loading ? (
                <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading complaints">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="Couldn't load complaints"
                  description="Check your connection and try again."
                  onRetry={() => refetch()}
                />
              ) : complaints.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareWarning />}
                  title={priorityFilter === "all" ? "No complaints yet" : "No complaints with this priority"}
                  description={
                    priorityFilter === "all"
                      ? "When tenants raise a complaint from their app, it will show up here."
                      : "Try a different priority or clear the filter."
                  }
                  action={priorityFilter !== "all" ? <Button variant="outline" size="sm" onClick={() => setPriorityFilter("all")}>Clear filter</Button> : undefined}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((c) => {
                      const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
                      return (
                        <TableRow key={c.id} className="cursor-pointer">
                          <TableCell className="font-mono text-xs">{c.id.slice(0, 8)}…</TableCell>
                          <TableCell><Badge variant="outline">{c.category || "—"}</Badge></TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{c.subject || c.description || "—"}</TableCell>
                          <TableCell>{c.priority ? <StatusBadge status={c.priority} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="text-sm">{date}</TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                          <TableCell>
                            <CanAccess permission="complaint_edit_assign">
                              <Button variant="ghost" size="sm" onClick={() => openUpdate(c)}>Update</Button>
                            </CanAccess>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
          </DataTableContainer>
        </>
      )}

      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent side="right" className="w-[400px] max-w-full space-y-6">
          <SheetHeader>
            <SheetTitle>Update Complaint Status</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={updateForm.status} onValueChange={(v) => setUpdateForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Remarks (optional)</Label>
              <Textarea
                placeholder="e.g. Already cleaned"
                value={updateForm.remarks}
                onChange={(e) => setUpdateForm((p) => ({ ...p, remarks: e.target.value }))}
                rows={3}
              />
            </div>
            <CanAccess permission="complaint_edit_assign">
              <Button onClick={handleUpdateStatus} disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </CanAccess>
          </div>
        </SheetContent>
      </Sheet>
    </div>
    </CanAccessPage>
  );
};

export default Complaints;
