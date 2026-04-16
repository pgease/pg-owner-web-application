import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  Megaphone,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Send,
  Building2,
  BedDouble,
  BarChart3,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  BedDouble as BedIcon,
  DoorOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import {
  useAllRoomsAndCounts,
  useBlocks,
  useComplaints,
  useDashboardDetails,
  useDashboardKpis,
  usePropertyTenants,
  useStaffList,
} from "@/hooks/usePropertyOwnerQueries";
import { CelebrationDialog } from "@/components/CelebrationDialog";

const manageItems = [
  { title: "Staff Management", desc: "Manage your team", icon: Users, path: "/staff" },
  { title: "Complaints", desc: "Manage tenants issues", icon: AlertTriangle, path: "/complaints" },
  { title: "Announcement", desc: "Broadcast updates to all tenants", icon: Megaphone, path: "/support" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, selectedPgId } = useApp();
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationPgName, setCelebrationPgName] = useState("");

  const isKpiPage = location.pathname === "/kpis";

  // Celebration dialog after onboarding
  useEffect(() => {
    const state = location.state as { justOnboarded?: boolean; pgName?: string } | null;
    if (state?.justOnboarded) {
      setCelebrationPgName(state.pgName || "");
      setCelebrationOpen(true);
      // Clear navigation state so refresh won't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const roomsQuery = useAllRoomsAndCounts(selectedPgId);
  const complaintsQuery = useComplaints(selectedPgId);
  const staffQuery = useStaffList(selectedPgId);
  const dashboardDetailsQuery = useDashboardDetails(selectedPgId);
  const dashboardKpisQuery = useDashboardKpis();
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const blocksQuery = useBlocks(selectedPgId);

  const isLoading = roomsQuery.isLoading || complaintsQuery.isLoading || staffQuery.isLoading;
  const isError = roomsQuery.isError || complaintsQuery.isError || staffQuery.isError;
  
  const tenantCount = (tenantsQuery.data as unknown[] | undefined)?.length ?? 0;
  const blocksCount = (blocksQuery.data ?? []).length;

  const bedStats = useMemo(() => {
    const rooms = roomsQuery.data ?? [];
    const totalBeds = rooms.reduce((sum, r) => sum + (r.totalBeds ?? 0), 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedBeds ?? 0), 0);
    const availableBeds = rooms.reduce((sum, r) => sum + (r.availableBeds ?? 0), 0);
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0.0";
    return { totalBeds, occupiedBeds, availableBeds, occupancyRate };
  }, [roomsQuery.data]);

  const complaintCounts = useMemo(() => {
    const complaints = complaintsQuery.data ?? [];
    return {
      open: complaints.filter((c) => c.status === "open").length,
      inProgress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      total: complaints.length,
    };
  }, [complaintsQuery.data]);

  const staffCount = (staffQuery.data ?? []).length;

  const handleRetry = () => {
    if (roomsQuery.isError) roomsQuery.refetch();
    if (complaintsQuery.isError) complaintsQuery.refetch();
    if (staffQuery.isError) staffQuery.refetch();
    if (dashboardDetailsQuery.isError) dashboardDetailsQuery.refetch();
    if (dashboardKpisQuery.isError) dashboardKpisQuery.refetch();
  };

  if (!selectedPgId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-sm w-full border-border/80">
          <CardContent className="p-6 text-center space-y-3">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              Select a PG from the header to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overviewStats = [
    { label: "Total PGs", value: String(properties.length), sub: "Properties", icon: Building2 },
    { label: "Total Beds", value: String(bedStats.totalBeds), sub: "Across all rooms", icon: BedDouble },
    { label: "Occupied Beds", value: String(bedStats.occupiedBeds), sub: "Currently filled", icon: Users },
    { label: "Available Beds", value: String(bedStats.availableBeds), sub: "Vacant", icon: BedDouble },
  ];

  const kpiStats = [
    { label: "Occupancy Rate", value: `${bedStats.occupancyRate}%`, sub: `${bedStats.occupiedBeds} of ${bedStats.totalBeds} beds`, icon: BarChart3 },
    { label: "Staff Members", value: String(staffCount), sub: "Active staff", icon: Users },
    { label: "Total Complaints", value: String(complaintCounts.total), sub: `${complaintCounts.open} open`, icon: AlertTriangle },
    { label: "Available Beds", value: String(bedStats.availableBeds), sub: `${bedStats.totalBeds} total beds`, icon: BedDouble },
  ];

  return (
    <CanAccessPage permission="dashboard_access">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isKpiPage ? "KPIs" : "Dashboard Overview"}
        description={
          isKpiPage
            ? "Key performance indicators for your properties"
            : "Welcome back. Here's your PG overview."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span> Invite
            </Button>
            <CanAccess permission="tenant_add">
              <Button size="sm" className="gap-2" onClick={() => navigate("/tenants/add")}>
                <UserPlus className="h-4 w-4" /> Add Tenant
              </Button>
            </CanAccess>
          </div>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading dashboard data…</span>
        </div>
      )}

      {!isLoading && isError && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              Failed to load some dashboard data. Please try again.
            </p>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          {/* Stats grid */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {isKpiPage ? "Key metrics" : "At a glance"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(isKpiPage ? kpiStats : overviewStats).map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="overflow-hidden border-border/80 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{stat.sub}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Getting started prompts */}
          {!isKpiPage && (blocksCount === 0 || tenantCount === 0) && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Getting started
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {blocksCount === 0 && (
                  <Card className="border-primary/30 bg-primary/[0.03] hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/structure")}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-primary/15 p-3 shrink-0">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Set up your PG structure</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Add blocks, floors, rooms & beds so you can start adding tenants easily.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary shrink-0" />
                    </CardContent>
                  </Card>
                )}
                {tenantCount === 0 && (
                  <Card className="border-primary/30 bg-primary/[0.03] hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/tenants/add")}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-primary/15 p-3 shrink-0">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Add your first tenant</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          No tenants yet. Add a tenant manually, send an invite, or import via Excel.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary shrink-0" />
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              API dashboard
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    GET /dashboard-details/:propertyId
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {dashboardDetailsQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : dashboardDetailsQuery.isError ? (
                    <p className="text-xs text-destructive">Unavailable</p>
                  ) : (
                    <pre className="text-[11px] bg-muted/40 rounded-md p-3 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(dashboardDetailsQuery.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    GET /dashboard/kpis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {dashboardKpisQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : dashboardKpisQuery.isError ? (
                    <p className="text-xs text-destructive">Unavailable</p>
                  ) : (
                    <pre className="text-[11px] bg-muted/40 rounded-md p-3 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(dashboardKpisQuery.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Occupancy & Complaints — shown on overview only */}
          {!isKpiPage && (
            <>
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Occupancy
                </h2>
                <Card className="border-border/80">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold tracking-tight">{bedStats.occupancyRate}%</p>
                        <p className="text-sm text-muted-foreground">
                          {bedStats.occupiedBeds} occupied out of {bedStats.totalBeds} total beds
                        </p>
                      </div>
                    </div>
                    {bedStats.totalBeds > 0 && (
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${bedStats.occupancyRate}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Complaints summary
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="border-border/80">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-amber-500/15 p-2.5">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{complaintCounts.open}</p>
                        <p className="text-xs text-muted-foreground">Open</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/80">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-blue-500/15 p-2.5">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{complaintCounts.inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/80">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-emerald-500/15 p-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{complaintCounts.resolved}</p>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Staff
                </h2>
                <Card className="border-border/80">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold tracking-tight">{staffCount}</p>
                      <p className="text-sm text-muted-foreground">Active staff members</p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}

          <div className="border-t border-border/80" />

          {/* Manage */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Manage
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {manageItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all border-border/80"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-background border border-border/80 p-2.5 shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      <CelebrationDialog
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        pgName={celebrationPgName}
      />
    </div>
    </CanAccessPage>
  );
};

export default Dashboard;
