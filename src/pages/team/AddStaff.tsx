import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Brush,
  Shield,
  UserCog,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/context/PermissionContext";
import { NoAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import { ROLE_PRESETS, ROLE_LABELS, type PresetCell } from "@/constants/rolePresets";
import { getPermissionDisplayName } from "@/constants/permissions";
import { PermissionEditor } from "@/components/team/PermissionEditor";
import { createStaff as createOwnerStaff, updateStaffPermissions } from "@/api/propertyOwner";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const ROLES = ["manager", "caretaker", "cleaner", "warden"] as const;
type RoleKey = (typeof ROLES)[number];

const ROLE_ICONS: Record<RoleKey, typeof Briefcase> = {
  manager: Briefcase,
  caretaker: UserCog,
  cleaner: Brush,
  warden: Shield,
};

function presetToEnabled(preset: Record<string, PresetCell>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(preset)) {
    out[k] = v === "always" || v === true;
  }
  return out;
}

export default function AddStaff() {
  const navigate = useNavigate();
  const { isOwner, pgId: tokenPgId } = usePermissions();
  const { selectedPgId } = useApp();
  const pgId = tokenPgId ?? selectedPgId ?? "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleKey | "">("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const preset = role ? ROLE_PRESETS[role] : null;

  const permissionCount = useMemo(
    () => Object.entries(enabled).filter(([, v]) => v).length,
    [enabled]
  );

  const selectRole = (r: RoleKey) => {
    setRole(r);
    setEnabled(presetToEnabled(ROLE_PRESETS[r]));
  };

  const onToggle = (key: string, value: boolean) => {
    const cell = preset?.[key];
    if (cell === "always") return;
    setEnabled((prev) => ({ ...prev, [key]: value }));
  };

  const resetDefaults = () => {
    if (!role) return;
    setEnabled(presetToEnabled(ROLE_PRESETS[role]));
  };

  const handleSave = async () => {
    const digits = phone.replace(/\D/g, "").slice(0, 10);
    if (!name.trim() || digits.length !== 10 || !role || !pgId) {
      toast({ title: "Fill name, 10-digit mobile, role, and select a PG", variant: "destructive" });
      return;
    }
    const permissions = Object.entries(enabled)
      .filter(([, v]) => v)
      .map(([k]) => k);
    try {
      setSaving(true);
      const res = await createOwnerStaff({
        propertyId: pgId,
        name: name.trim(),
        email: `${name.trim().toLowerCase().replace(/\s+/g, "")}_${digits}@pgease.local`,
        mobileContactNumber: digits,
        designation: role,
        countryCode: "+91",
      });
      if (res?.id && permissions.length > 0) {
        await updateStaffPermissions(res.id, { permissions });
      }
      toast({ title: "Staff added successfully" });
      navigate("/team", { replace: true });
    } catch (e: unknown) {
      toast({
        title: "Could not add staff",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return <NoAccessPage />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-8">
      <PageHeader title="Add staff" description="Invite a team member and set their access." />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1 — Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <Label>Staff name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Mobile number</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground shrink-0">+91</span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="10-digit number"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map((r) => {
                  const meta = ROLE_LABELS[r];
                  const Icon = ROLE_ICONS[r];
                  const count = Object.keys(ROLE_PRESETS[r]).length;
                  const selected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => selectRole(r)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-colors hover:bg-muted/40",
                        selected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{meta.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">{meta.desc}</p>
                          <p className="text-[11px] text-muted-foreground mt-2">{count} permission slots</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              className="w-full md:w-auto"
              disabled={!name.trim() || phone.replace(/\D/g, "").length !== 10 || !role}
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && preset && role && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Step 2 — Permissions</CardTitle>
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={resetDefaults}>
              Reset to role defaults
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <PermissionEditor preset={preset} enabled={enabled} onToggle={onToggle} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && role && preset && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3 — Review & save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-xl">
            <p className="text-sm">
              You are adding <strong>{name.trim()}</strong> as{" "}
              <strong className="capitalize">{role}</strong> with <strong>{permissionCount}</strong> permissions.
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(enabled)
                .filter(([, v]) => v)
                .map(([k]) => (
                  <li key={k}>{getPermissionDisplayName(k)}</li>
                ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Edit
              </Button>
              <Button className="flex-1" disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save staff"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile sticky save on step 3 */}
      {step === 3 ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur md:hidden z-40">
          <Button className="w-full" size="lg" disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save staff"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
