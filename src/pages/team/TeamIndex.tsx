import { Link } from "react-router-dom";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/context/PermissionContext";
import { CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import { useStaffList } from "@/hooks/usePropertyOwnerQueries";
import { useMemo } from "react";

function TeamIndexInner() {
  const { isOwner } = usePermissions();
  const { selectedPgId } = useApp();
  const pgId = selectedPgId ?? undefined;

  const q = useStaffList(pgId);

  const rows = useMemo(() => {
    const list = Array.isArray(q.data) ? q.data : [];
    return list.map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.permissionTierName || s.designation || "Staff",
      phone: s.mobileContactNumber || s.phone || "",
      permissions: s.permissions || [],
    }));
  }, [q.data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Team"
        description="Staff members for the selected property."
        actions={
          isOwner ? (
            <Button size="sm" className="gap-2" asChild>
              <Link to="/team/add-staff">
                <Plus className="h-4 w-4" /> Add staff
              </Link>
            </Button>
          ) : null
        }
      />

      {!pgId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Select a PG from the header to load team members.
          </CardContent>
        </Card>
      ) : q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : q.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Could not load team. Ensure the staff API is available.
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No staff yet. {isOwner ? "Add your first team member." : ""}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{s.role} · {s.phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.permissions?.length ?? 0} permissions</p>
                </div>
                {isOwner ? (
                  <Button size="sm" variant="outline" className="gap-2" asChild>
                    <Link to={`/team/${s.id}/permissions`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit permissions
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamIndex() {
  return (
    <CanAccessPage permission="team_view_members">
      <TeamIndexInner />
    </CanAccessPage>
  );
}
