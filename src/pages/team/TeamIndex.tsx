import { Link } from "react-router-dom";
import { Plus, Loader2, Pencil, Shield, User, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/context/PermissionContext";
import { CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import { useStaffList } from "@/hooks/usePropertyOwnerQueries";
import { useMemo } from "react";

const ROLE_BADGE_STYLES: Record<string, string> = {
  manager: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  caretaker: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  cleaner: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warden: "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

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
      roleKey: (s.designation || s.permissionTierName || "staff").toLowerCase().trim(),
      phone: s.mobileContactNumber || s.phone || "",
      permissions: s.permissions || [],
      active: s.active !== false,
    }));
  }, [q.data]);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto p-4 md:p-6 pb-20">
      <PageHeader
        title="Team & Staff Management"
        description="Manage property team members, roles, and administrative access privileges."
        actions={
          isOwner ? (
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" asChild>
              <Link to="/team/add-staff">
                <Plus className="h-4 w-4" /> Add staff
              </Link>
            </Button>
          ) : null
        }
      />

      {!pgId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Select a PG from the top header to load and manage team members.
          </CardContent>
        </Card>
      ) : q.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading team members...</span>
        </div>
      ) : q.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            Could not load team. Ensure the staff API is available.
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <User className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">No staff members yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add managers, caretakers, or cleaners to delegate operations and grant secure app access.
              </p>
            </div>
            {isOwner && (
              <Button size="sm" className="gap-2 mt-2" asChild>
                <Link to="/team/add-staff">
                  <Plus className="h-3.5 w-3.5" /> Add First Team Member
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {rows.map((s) => {
            const badgeStyle =
              ROLE_BADGE_STYLES[s.roleKey] ||
              "border-border bg-muted/40 text-muted-foreground";

            return (
              <Card key={s.id} className="border-border/60 hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                      {(s.name || "S")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground">{s.name}</p>
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${badgeStyle}`}>
                          {s.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground/70" /> {s.phone || "No phone"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-600" />
                        <span className="font-semibold text-foreground">
                          {s.permissions?.length ?? 0}
                        </span>{" "}
                        active privileges
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" asChild>
                        <Link to={`/team/${s.id}/permissions`}>
                          <Pencil className="h-3.5 w-3.5" /> Edit role & permissions
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
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
