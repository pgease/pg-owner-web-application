import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CanAccessPage } from "@/components/PermissionGuard";
import { Plus, Shield, Building2, Phone, Mail, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useStaffList,
  useDesignationsQuery,
  useCreateStaffMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import StaffRoles from "./StaffRoles";

const INITIAL_FORM = {
  name: "",
  email: "",
  mobileContactNumber: "",
  countryCode: "+91",
  designation: "",
  staffPermissionTierId: "",
};

const StaffListContent = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [compact, setCompact] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const selectedPg = Array.isArray(properties)
    ? properties.find((p) => p.id === selectedPgId)
    : null;

  const {
    data: staff = [],
    isLoading,
    isError,
    refetch,
  } = useStaffList(selectedPgId);

  const { data: designations = [] } = useDesignationsQuery();
  const { hasFeature, planDisplayName } = useFeatureAccess();

  const createStaffMutation = useCreateStaffMutation(selectedPgId);

  // Check staff management feature access via central feature key
  const isFreePlan = !hasFeature("staff_roles_permissions");

  const handleAddStaff = async () => {
    if (
      !selectedPgId ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.mobileContactNumber.trim()
    ) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    try {
      await createStaffMutation.mutateAsync({
        propertyId: selectedPgId,
        name: form.name.trim(),
        email: form.email.trim(),
        mobileContactNumber: form.mobileContactNumber
          .replace(/\D/g, "")
          .slice(0, 10),
        countryCode: form.countryCode || undefined,
        designation: form.designation || undefined,
        staffPermissionTierId: form.staffPermissionTierId || undefined,
      });
      toast({ title: "Staff added successfully" });
      setAddOpen(false);
      setForm(INITIAL_FORM);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add staff";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const staffList = Array.isArray(staff) ? staff : [];

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter((s: any) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const phone = (s.mobileContactNumber || "").toLowerCase();
      const designation = (s.designation || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || designation.includes(q);
    });
  }, [staffList, searchQuery]);

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Staff Member",
      render: (s) => (
        <div>
          <div className="font-medium text-sm text-[var(--gray-900)]">{s.name}</div>
          <div className="text-xs text-[var(--gray-500)]">{s.email}</div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Contact",
      render: (s) => (
        <span className="text-sm text-[var(--gray-700)] tabular-nums">
          {s.countryCode ? `${s.countryCode} ` : "+91 "}
          {s.mobileContactNumber}
        </span>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (s) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)]">
          {s.designation || "General Staff"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (s) => (
        <span className="text-xs text-[var(--gray-600)] tabular-nums">
          {s.permissions?.length ?? 0} assigned
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusBadge label="Active" tone="success" />,
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            items={[
              {
                label: "Call",
                icon: <Phone className="h-4 w-4" />,
                onClick: () => {
                  window.location.href = `tel:${s.countryCode || "+91"}${s.mobileContactNumber}`;
                },
              },
              {
                label: "Send Email",
                icon: <Mail className="h-4 w-4" />,
                onClick: () => {
                  window.location.href = `mailto:${s.email}`;
                },
              },
              {
                label: "Manage Roles & Permissions",
                icon: <UserCheck className="h-4 w-4" />,
                onClick: () => navigate("/staff/roles"),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description={`Manage team members, roles, and permissions${selectedPg ? ` for ${selectedPg.name}` : ""}.`}
        action={
          <Button
            size="sm"
            className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            disabled={!selectedPgId}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        }
      />

      {isFreePlan && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)] p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--brand-600)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--gray-900)]">
                Current plan: {planDisplayName || "Lite"}
              </p>
              <p className="text-xs text-[var(--gray-600)]">
                Role-based access control and advanced staff permissions are available on Pro plan.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-[var(--gray-300)]"
            onClick={() => navigate("/plans")}
          >
            View Plans
          </Button>
        </div>
      )}

      {!selectedPgId ? (
        <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
          <EmptyState
            icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
            title="Select a property"
            description="Choose a PG from the switcher in the top bar to view its staff."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-md border border-[var(--gray-200)]">
            <div className="flex-1 max-w-sm">
              <SearchInput
                placeholder="Search staff by name, email, phone..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            <div className="flex items-center gap-2">
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

          <DataTable
            columns={columns}
            data={filteredStaff}
            keyExtractor={(s) => s.id}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            compact={compact}
            emptyTitle="No staff members yet"
            emptyDescription="Add managers, wardens, or maintenance staff to manage your PG operations."
            emptyAction={
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add staff
              </Button>
            }
          />
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
              Add Staff Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">
                Full Name <span className="text-[#B42318]">*</span>
              </Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">
                Email Address <span className="text-[#B42318]">*</span>
              </Label>
              <Input
                type="email"
                placeholder="ramesh@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">
                Mobile Number <span className="text-[#B42318]">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={form.countryCode}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, countryCode: v }))
                  }
                >
                  <SelectTrigger className="w-20 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="10-digit number"
                  value={form.mobileContactNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mobileContactNumber: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    }))
                  }
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </div>
            {designations.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Designation (optional)
                </Label>
                <Select
                  value={form.designation}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, designation: v }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
              className="border-[var(--gray-300)]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
              onClick={handleAddStaff}
              disabled={createStaffMutation.isPending}
            >
              {createStaffMutation.isPending ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Staff = () => {
  const location = useLocation();
  if (location.pathname === "/staff/roles") {
    return (
      <CanAccessPage permission="team_property_access">
        <StaffRoles />
      </CanAccessPage>
    );
  }
  return (
    <CanAccessPage permission="team_view_members">
      <StaffListContent />
    </CanAccessPage>
  );
};

export default Staff;
