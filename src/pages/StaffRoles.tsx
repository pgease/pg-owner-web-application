import { useState } from "react";
import { Loader2, Link2, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  useAssignStaffRoleMutation,
  useCreateStaffPermissionDefinitionMutation,
  useCreateStaffPermissionTierMutation,
  useLinkPermissionToTierMutation,
  useStaffList,
  useStaffMemberRolesQuery,
  useStaffPermissionTiers,
  useStaffPermissionsByIdQuery,
  useStaffPermissionsQuery,
  useStaffPermissionsAssignMutation,
  useUpdateStaffPermissionsMutation,
} from "@/hooks/usePropertyOwnerQueries";

const StaffRoles = () => {
  const { selectedPgId, properties } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const { data: staff = [], isLoading: staffLoading } = useStaffList(selectedPgId);
  const { data: tiers = [], isLoading: tiersLoading } = useStaffPermissionTiers();
  const { data: permissions = [] } = useStaffPermissionsQuery();

  const createTier = useCreateStaffPermissionTierMutation();
  const linkTier = useLinkPermissionToTierMutation();
  const assignRole = useAssignStaffRoleMutation(selectedPgId);
  const assignPerms = useStaffPermissionsAssignMutation(selectedPgId);
  const updatePerms = useUpdateStaffPermissionsMutation(selectedPgId);
  const createDef = useCreateStaffPermissionDefinitionMutation();

  const [tierName, setTierName] = useState("");
  const [tierDesc, setTierDesc] = useState("");
  const [linkTierId, setLinkTierId] = useState("");
  const [linkPermId, setLinkPermId] = useState("");
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignTierId, setAssignTierId] = useState("");
  const [defFeatureKey, setDefFeatureKey] = useState("");
  const [defFeatureId, setDefFeatureId] = useState("");
  const [defAction, setDefAction] = useState("");
  const [permAssignStaffId, setPermAssignStaffId] = useState("");
  const [permAssignIds, setPermAssignIds] = useState("");
  const [permAssignTierName, setPermAssignTierName] = useState("");
  const [inspectStaffId, setInspectStaffId] = useState("");
  const [updStaffId, setUpdStaffId] = useState("");
  const [updPermIds, setUpdPermIds] = useState("");
  const rolesInspect = useStaffMemberRolesQuery(inspectStaffId || null);
  const permsInspect = useStaffPermissionsByIdQuery(inspectStaffId || null);

  const staffList = Array.isArray(staff) ? staff : [];
  const tierList = Array.isArray(tiers) ? (tiers as { id: string; name?: string }[]) : [];
  const permList = Array.isArray(permissions) ? (permissions as { id: string; name?: string }[]) : [];

  const handleCreateTier = async () => {
    if (!tierName.trim()) return;
    try {
      await createTier.mutateAsync({ name: tierName.trim(), description: tierDesc.trim() || undefined, active: true });
      toast({ title: "Permission tier created" });
      setTierName("");
      setTierDesc("");
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleLink = async () => {
    if (!linkTierId || !linkPermId) return;
    try {
      await linkTier.mutateAsync({ tierId: linkTierId, permissionId: linkPermId });
      toast({ title: "Permission linked to tier" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!assignStaffId || !assignTierId) return;
    try {
      await assignRole.mutateAsync({ staffId: assignStaffId, permissionTierId: assignTierId });
      toast({ title: "Role assigned" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleAssignPermissionsBatch = async () => {
    if (!permAssignStaffId || !permAssignTierName.trim()) return;
    const ids = permAssignIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    try {
      await assignPerms.mutateAsync({
        staffId: permAssignStaffId,
        payload: { permissions: ids, permissionTierName: permAssignTierName.trim() },
      });
      toast({ title: "Permissions assigned" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleUpdatePermissions = async () => {
    if (!updStaffId) return;
    const ids = updPermIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    try {
      await updatePerms.mutateAsync({ staffId: updStaffId, payload: { permissions: ids } });
      toast({ title: "Permissions updated" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleCreateDef = async () => {
    if (!defFeatureKey.trim() || !defFeatureId.trim() || !defAction.trim()) return;
    try {
      await createDef.mutateAsync({
        featureKey: defFeatureKey.trim(),
        featureId: defFeatureId.trim(),
        action: defAction.trim(),
        active: true,
      });
      toast({ title: "Permission definition created" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const loading = staffLoading || tiersLoading;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader
        title="Roles & permission tiers"
        description={
          selectedPg
            ? `Staff permission tiers, links, and role assignment for ${selectedPg.name}`
            : "Select a PG from the header for staff-scoped actions."
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Create permission tier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={tierName} onChange={(e) => setTierName(e.target.value)} placeholder="Receptionist" />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input value={tierDesc} onChange={(e) => setTierDesc(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <Button size="sm" onClick={handleCreateTier} disabled={createTier.isPending}>
                {createTier.isPending ? "Saving…" : "Create tier"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Link permission to tier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tier</Label>
                  <Select value={linkTierId} onValueChange={setLinkTierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierList.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name ?? t.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Permission</Label>
                  <Select value={linkPermId} onValueChange={setLinkPermId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name ?? p.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleLink} disabled={linkTier.isPending}>
                {linkTier.isPending ? "Linking…" : "Link"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign role to staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Staff member</Label>
                  <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Permission tier</Label>
                  <Select value={assignTierId} onValueChange={setAssignTierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierList.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name ?? t.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAssign} disabled={!selectedPgId || assignRole.isPending}>
                {assignRole.isPending ? "Assigning…" : "Assign role"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">POST /staff/permissions/assign/:staffId</CardTitle>
              <p className="text-xs text-muted-foreground">
                Comma-separated permission UUIDs + tier name (matches Postman body).
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Staff</Label>
                <Select value={permAssignStaffId} onValueChange={setPermAssignStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>permissionTierName</Label>
                <Input value={permAssignTierName} onChange={(e) => setPermAssignTierName(e.target.value)} placeholder="Receptionist" />
              </div>
              <div className="space-y-1">
                <Label>permission UUIDs (comma-separated)</Label>
                <Input value={permAssignIds} onChange={(e) => setPermAssignIds(e.target.value)} placeholder="uuid1, uuid2" />
              </div>
              <Button size="sm" variant="outline" onClick={handleAssignPermissionsBatch} disabled={assignPerms.isPending}>
                {assignPerms.isPending ? "Assigning…" : "Assign permissions"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspect staff — GET /staff/:id/roles & permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Staff</Label>
                <Select value={inspectStaffId} onValueChange={setInspectStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Roles</p>
                  <pre className="text-[11px] bg-muted/40 rounded-md p-2 max-h-32 overflow-auto">
                    {rolesInspect.isFetching ? "…" : JSON.stringify(rolesInspect.data, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Permissions</p>
                  <pre className="text-[11px] bg-muted/40 rounded-md p-2 max-h-32 overflow-auto">
                    {permsInspect.isFetching ? "…" : JSON.stringify(permsInspect.data, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">POST /update-staff-permissions/:staffId</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Staff</Label>
                <Select value={updStaffId} onValueChange={setUpdStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>permission UUIDs (comma-separated)</Label>
                <Input value={updPermIds} onChange={(e) => setUpdPermIds(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleUpdatePermissions} disabled={updatePerms.isPending}>
                {updatePerms.isPending ? "Saving…" : "Update permissions"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create staff permission definition (advanced)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>featureKey</Label>
                  <Input value={defFeatureKey} onChange={(e) => setDefFeatureKey(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>featureId (UUID)</Label>
                  <Input value={defFeatureId} onChange={(e) => setDefFeatureId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>action</Label>
                  <Input value={defAction} onChange={(e) => setDefAction(e.target.value)} placeholder="read" />
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={handleCreateDef} disabled={createDef.isPending}>
                {createDef.isPending ? "Creating…" : "POST /staff/permissions"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StaffRoles;
