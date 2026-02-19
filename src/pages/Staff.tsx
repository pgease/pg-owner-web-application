import { useState, useEffect } from "react";
import { UserCog, Plus, Shield, Phone, Mail, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  getAllStaffWithPermissions,
  createStaff,
  getDesignations,
  getMyFeatures,
  type CreateStaffPayload,
  type Designation,
  type StaffWithPermissions,
} from "@/api/propertyOwner";

const Staff = () => {
  const { selectedPgId, properties } = useApp();
  const [staff, setStaff] = useState<StaffWithPermissions[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [planInfo, setPlanInfo] = useState<{ planDisplayName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobileContactNumber: "",
    countryCode: "+91",
    designation: "",
    staffPermissionTierId: "",
  });

  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const loadStaff = async () => {
    if (!selectedPgId) {
      setStaff([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await getAllStaffWithPermissions(selectedPgId);
      setStaff(Array.isArray(list) ? list : []);
    } catch (e) {
      setStaff([]);
      toast({ title: "Failed to load staff", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDesignations = async () => {
    try {
      const list = await getDesignations();
      setDesignations(Array.isArray(list) ? list : []);
    } catch {
      setDesignations([]);
    }
  };

  const loadPlanInfo = async () => {
    try {
      const res = await getMyFeatures();
      setPlanInfo(
        res && typeof res === "object" && "planDisplayName" in res
          ? { planDisplayName: (res as { planDisplayName: string }).planDisplayName }
          : null
      );
    } catch {
      setPlanInfo(null);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedPgId]);

  useEffect(() => {
    loadDesignations();
    loadPlanInfo();
  }, []);

  const handleAddStaff = async () => {
    if (!selectedPgId || !form.name.trim() || !form.email.trim() || !form.mobileContactNumber.trim()) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const payload: CreateStaffPayload = {
        propertyId: selectedPgId,
        name: form.name.trim(),
        email: form.email.trim(),
        mobileContactNumber: form.mobileContactNumber.replace(/\D/g, "").slice(0, 10),
        countryCode: form.countryCode || undefined,
        designation: form.designation || undefined,
        staffPermissionTierId: form.staffPermissionTierId || undefined,
      };
      await createStaff(payload);
      toast({ title: "Staff added successfully" });
      setAddOpen(false);
      setForm({ name: "", email: "", mobileContactNumber: "", countryCode: "+91", designation: "", staffPermissionTierId: "" });
      loadStaff();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add staff";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Manage your PG staff and roles {selectedPg ? `— ${selectedPg.name}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          disabled={!selectedPgId}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {planInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Current plan: {planInfo.planDisplayName}</p>
            <p className="text-xs text-muted-foreground">
              Staff roles & advanced permissions are available on higher plans. Upgrade to assign complaints, track activity, and manage staff permissions.
            </p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => window.location.href = "/plans"}>
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
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {staff.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No staff yet. Add staff to get started.
              </CardContent>
            </Card>
          ) : (
            staff.map((s) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.designation || "Staff"} · {selectedPg?.name ?? ""}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <div className="flex gap-2">
                <Select value={form.countryCode} onValueChange={(v) => setForm((p) => ({ ...p, countryCode: v }))}>
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
                  onChange={(e) => setForm((p) => ({ ...p, mobileContactNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className="flex-1"
                />
              </div>
            </div>
            {designations.length > 0 && (
              <div className="space-y-2">
                <Label>Designation (optional)</Label>
                <Select value={form.designation} onValueChange={(v) => setForm((p) => ({ ...p, designation: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStaff} disabled={submitting}>
                {submitting ? (
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
