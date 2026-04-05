import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/context/PermissionContext";
import { NoAccessPage } from "@/components/PermissionGuard";
import { ROLE_PRESETS } from "@/constants/rolePresets";
import { PermissionEditor } from "@/components/team/PermissionEditor";
import { getStaff, patchStaffPermissions } from "@/api/staff";
import { toast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

function mergeEnabled(
  preset: Record<string, PresetCell>,
  permissionList: string[]
): Record<string, boolean> {
  const set = new Set(permissionList);
  const out: Record<string, boolean> = {};
  for (const [k, cell] of Object.entries(preset)) {
    if (cell === "always") out[k] = true;
    else out[k] = set.has(k);
  }
  return out;
}

export default function EditStaffPermissions() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { isOwner } = usePermissions();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => getStaff(staffId!),
    enabled: Boolean(staffId) && isOwner,
  });

  const staff = q.data;
  const roleKey = staff?.role?.toLowerCase() ?? "";
  const preset = roleKey && ROLE_PRESETS[roleKey] ? ROLE_PRESETS[roleKey] : null;

  useEffect(() => {
    if (!staff || !preset) return;
    setEnabled(mergeEnabled(preset, staff.permissions ?? []));
  }, [staff, preset]);

  const onToggle = (key: string, value: boolean) => {
    const cell = preset?.[key];
    if (cell === "always") return;
    setEnabled((prev) => ({ ...prev, [key]: value }));
  };

  const resetDefaults = () => {
    if (!preset) return;
    const fromPreset: Record<string, boolean> = {};
    for (const [k, cell] of Object.entries(preset)) {
      fromPreset[k] = cell === "always" || cell === true;
    }
    setEnabled(fromPreset);
  };

  const handleSave = async () => {
    if (!staffId) return;
    const permissions = Object.entries(enabled)
      .filter(([, v]) => v)
      .map(([k]) => k);
    try {
      setSaving(true);
      await patchStaffPermissions(staffId, permissions);
      toast({ title: "Permissions updated" });
      void q.refetch();
    } catch (e: unknown) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const title = useMemo(() => staff?.name ?? "Staff member", [staff?.name]);

  if (!isOwner) {
    return <NoAccessPage />;
  }

  if (!staffId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Invalid staff id. <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/team")}>Back to team</Button>
      </div>
    );
  }

  if (q.isLoading || !staff) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preset) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Unknown role &quot;{staff.role}&quot;. Cannot edit permissions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Permissions — ${title}`} description="Adjust what this staff member can access." />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base capitalize">{staff.role}</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={resetDefaults}>
            Reset to role defaults
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <PermissionEditor preset={preset} enabled={enabled} onToggle={onToggle} />
          <Button className="w-full sm:w-auto" disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
