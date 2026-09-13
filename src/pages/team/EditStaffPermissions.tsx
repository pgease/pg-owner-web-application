import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Shield,
  User,
  Phone,
  Mail,
  Briefcase,
  Save,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/context/PermissionContext";
import { NoAccessPage } from "@/components/PermissionGuard";
import { ROLE_PRESETS, type PresetCell } from "@/constants/rolePresets";
import { PermissionEditor } from "@/components/team/PermissionEditor";
import { getStaff, updateStaff, deleteStaff } from "@/api/staff";
import { useToast } from "@/components/ui/use-toast";
import { queryKeys } from "@/hooks/usePropertyOwnerQueries";

const PREDEFINED_ROLES = [
  { key: "manager", title: "Manager", desc: "Full administrative access to tenants, rents, and rooms" },
  { key: "caretaker", title: "Caretaker", desc: "Day-to-day operations, check-ins, and maintenance" },
  { key: "cleaner", title: "Cleaner", desc: "Housekeeping and complaint tracking" },
  { key: "warden", title: "Warden", desc: "Gate control, student/tenant discipline, and security" },
  { key: "custom", title: "Custom Role", desc: "Tailored custom permissions" },
];

function buildPreset(roleKey: string): Record<string, PresetCell> {
  const normalized = roleKey.toLowerCase().trim();
  if (ROLE_PRESETS[normalized]) {
    return ROLE_PRESETS[normalized];
  }
  // Fallback preset: allow all permissions from manager as customizable toggles
  const fallback: Record<string, PresetCell> = {};
  for (const [k] of Object.entries(ROLE_PRESETS.manager)) {
    fallback[k] = false;
  }
  return fallback;
}

export default function EditStaffPermissions() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { isOwner } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const q = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => getStaff(staffId!),
    enabled: Boolean(staffId) && isOwner,
  });

  const staff = q.data;

  // Active preset based on selected role
  const preset = useMemo(() => buildPreset(selectedRole), [selectedRole]);

  // Sync state when staff data is loaded
  useEffect(() => {
    if (!staff) return;

    setName(staff.name || "");
    setPhone(staff.phone || "");
    setEmail(staff.email || "");

    const staffRole = (staff.role || staff.designation || "manager").toLowerCase().trim();
    const matchedRole = PREDEFINED_ROLES.some((r) => r.key === staffRole) ? staffRole : "custom";
    setSelectedRole(matchedRole);

    const activePreset = buildPreset(matchedRole);
    const set = new Set(staff.permissions ?? []);

    const out: Record<string, boolean> = {};
    for (const [k, cell] of Object.entries(activePreset)) {
      if (cell === "always") out[k] = true;
      else out[k] = set.has(k) || (set.size === 0 && cell === true);
    }
    setEnabled(out);
  }, [staff]);

  const onToggle = (key: string, value: boolean) => {
    const cell = preset?.[key];
    if (cell === "always") return;
    setEnabled((prev) => ({ ...prev, [key]: value }));
  };

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    const newPreset = buildPreset(newRole);
    const newEnabled: Record<string, boolean> = {};
    for (const [k, cell] of Object.entries(newPreset)) {
      newEnabled[k] = cell === "always" || cell === true;
    }
    setEnabled(newEnabled);
    toast({
      title: `Role switched to ${newRole.toUpperCase()}`,
      description: "Default permissions for this role have been applied.",
    });
  };

  const resetToRoleDefaults = () => {
    const fromPreset: Record<string, boolean> = {};
    for (const [k, cell] of Object.entries(preset)) {
      fromPreset[k] = cell === "always" || cell === true;
    }
    setEnabled(fromPreset);
    toast({ title: "Permissions reset to role defaults" });
  };

  const selectAllPermissions = () => {
    const allOn: Record<string, boolean> = {};
    for (const [k] of Object.entries(preset)) {
      allOn[k] = true;
    }
    setEnabled(allOn);
  };

  const clearAllPermissions = () => {
    const allOff: Record<string, boolean> = {};
    for (const [k, cell] of Object.entries(preset)) {
      allOff[k] = cell === "always";
    }
    setEnabled(allOff);
  };

  const activePermissionsCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled]
  );

  const handleSave = async () => {
    if (!staffId) return;
    if (!name.trim()) {
      toast({ title: "Staff name is required", variant: "destructive" });
      return;
    }

    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      toast({ title: "Please enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }

    const permissions = Object.entries(enabled)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      setSaving(true);
      await updateStaff(staffId, {
        name: name.trim(),
        phone: digits,
        mobileContactNumber: digits,
        email: email.trim(),
        designation: selectedRole,
        role: selectedRole,
        permissions,
      });

      toast({
        title: "Staff & Permissions Updated! ✓",
        description: `Changes for ${name.trim()} have been saved successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() });
      void q.refetch();
    } catch (e: unknown) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not update staff",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffId) return;
    try {
      setDeleting(true);
      await deleteStaff(staffId);
      toast({ title: "Staff member deactivated" });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() });
      navigate("/team", { replace: true });
    } catch (e: any) {
      toast({
        title: "Could not deactivate staff",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteAlertOpen(false);
    }
  };

  if (!isOwner) {
    return <NoAccessPage />;
  }

  if (!staffId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Invalid staff ID.{" "}
        <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/team")}>
          Back to team
        </Button>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading staff profile & permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/team"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Team List
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-indigo-500" /> Edit Staff & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update role assignment, contact details, and feature privileges for{" "}
            <span className="font-semibold text-foreground">{staff?.name || "staff member"}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
            onClick={() => setDeleteAlertOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Deactivate
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* CARD 1: Staff Details & Role Configuration */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" /> Staff Profile & Assigned Role
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Staff member identity, contact information, and primary job designation.
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize text-xs font-semibold px-2.5 py-0.5 border-primary/40 bg-primary/5 text-primary">
              {selectedRole}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="text-xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile Number
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground px-2 py-2 bg-muted border rounded-md">
                  +91
                </span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  maxLength={10}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
              </Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pgease.local"
                className="text-xs"
              />
            </div>
          </div>

          {/* Role Selector Grid */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Assigned Role & Access Preset
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {PREDEFINED_ROLES.map((r) => {
                const isSelected = selectedRole === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleChange(r.key)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold capitalize text-foreground">
                        {r.title}
                      </span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Permission Editor */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b bg-muted/10 p-5">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> Feature Permissions
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Customize granular privileges across all PG Ease operational modules.
            </CardDescription>
          </div>

          {/* Preset Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
              {activePermissionsCount} Active Permissions
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={selectAllPermissions}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={clearAllPermissions}
            >
              Clear All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-primary hover:bg-primary/10"
              onClick={resetToRoleDefaults}
            >
              <RotateCcw className="h-3 w-3" /> Reset Defaults
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <PermissionEditor preset={preset} enabled={enabled} onToggle={onToggle} />

          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Locked badges (<span className="font-semibold">Locked</span>) represent mandatory core privileges for the assigned role.
            </div>
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ALERT DIALOG: DEACTIVATE STAFF */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Deactivate Staff Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <span className="font-semibold text-foreground">{name}</span>?
              They will immediately lose login access to the PG Ease staff application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteStaff}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
