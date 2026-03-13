import { useState } from "react";
import { Plus, Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import {
  useStaffList,
  useDesignationsQuery,
  useMyFeaturesQuery,
  useCreateStaffMutation,
} from "@/hooks/usePropertyOwnerQueries";

const INITIAL_FORM = {
  name: "",
  email: "",
  mobileContactNumber: "",
  countryCode: "+91",
  designation: "",
  staffPermissionTierId: "",
};

const Staff = () => {
  const { selectedPgId, properties } = useApp();
  const [addOpen, setAddOpen] = useState(false);
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
  const { data: featuresData } = useMyFeaturesQuery();

  const createStaffMutation = useCreateStaffMutation(selectedPgId);

  const isFreePlan =
    featuresData &&
    (/free/i.test(featuresData.planDisplayName ?? "") ||
      /free/i.test(featuresData.planName ?? ""));

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Staff"
        description={`Manage your PG staff and roles${selectedPg ? ` — ${selectedPg.name}` : ""}`}
        actions={
          <Button
            size="sm"
            className="gap-2"
            disabled={!selectedPgId}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      {isFreePlan && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">
              Current plan: {featuresData?.planDisplayName}
            </p>
            <p className="text-xs text-muted-foreground">
              Staff roles & advanced permissions are available on higher plans.
              Upgrade to assign complaints, track activity, and manage staff
              permissions.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto shrink-0"
            onClick={() => (window.location.href = "/plans")}
          >
            Upgrade
          </Button>
        </div>
      )}

      {!selectedPgId ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Select a PG from the header to view and manage staff.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load staff. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : staffList.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No staff members yet. Click "Add Staff" to get started.
          </CardContent>
        </Card>
      ) : (
        <DataTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.countryCode ? `${s.countryCode} ` : ""}
                    {s.mobileContactNumber}
                  </TableCell>
                  <TableCell>
                    {s.designation ? (
                      <Badge variant="secondary">{s.designation}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {s.permissions?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableContainer>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <div className="flex gap-2">
                <Select
                  value={form.countryCode}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, countryCode: v }))
                  }
                >
                  <SelectTrigger className="w-20">
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
                  className="flex-1"
                />
              </div>
            </div>
            {designations.length > 0 && (
              <div className="space-y-2">
                <Label>Designation (optional)</Label>
                <Select
                  value={form.designation}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, designation: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddStaff}
                disabled={createStaffMutation.isPending}
              >
                {createStaffMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding...
                  </>
                ) : (
                  "Add Staff"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
