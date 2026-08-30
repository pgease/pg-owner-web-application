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
  X,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { PieChart, Pie, Cell } from "recharts";
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
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
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
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Rentok-style Header with Integrated Property/City Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Dashboard</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-brand-600" />
                  <span>{selectedPg ? selectedPg.name : "Saksham Pg"}</span>
                  <button className="text-slate-400 hover:text-slate-600 ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>{selectedPg?.address ? (selectedPg.address.split(",").slice(-2, -1)[0]?.trim() || "Ghaziabad") : "Ghaziabad"}</span>
                  <button className="text-slate-400 hover:text-slate-600 ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 self-end">
            <Button size="sm" variant="outline" className="gap-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span> Invite
            </Button>
            <CanAccess permission="tenant_add">
              <Button size="sm" className="gap-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm shadow-brand-600/10" onClick={() => navigate("/tenants/add")}>
                <UserPlus className="h-4 w-4" /> Add Tenant
              </Button>
            </CanAccess>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="ml-2 text-sm text-slate-500 font-medium">Loading dashboard data…</span>
          </div>
        )}

        {!isLoading && isError && (
          <Card className="border-destructive/30 rounded-2xl bg-destructive/[0.02]">
            <CardContent className="p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Failed to load dashboard metrics. Please retry.
              </p>
              <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            {/* Rentok-style Metrics Section */}
            <section className="space-y-3">
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">User Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
                
                {/* Rooms Card */}
                <Card className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-center items-center py-6 hover:shadow-md transition-shadow">
                  <p className="text-5xl font-extrabold text-slate-800 tracking-tight">
                    {roomsQuery.data?.length || 0}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-400 mt-2">
                    Rooms
                  </p>
                </Card>

                {/* Beds Card */}
                <Card className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-center items-center py-6 hover:shadow-md transition-shadow">
                  <p className="text-5xl font-extrabold text-slate-800 tracking-tight">
                    {bedStats.totalBeds}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-400 mt-2">
                    Beds
                  </p>
                </Card>

                {/* Current Tenants Card */}
                <Card className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-center items-center py-6 hover:shadow-md transition-shadow">
                  <p className="text-5xl font-extrabold text-slate-800 tracking-tight">
                    {tenantCount}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-400 mt-2">
                    Current Tenants
                  </p>
                </Card>

                {/* Bookings Card */}
                <Card className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-center items-center py-6 hover:shadow-md transition-shadow">
                  <p className="text-5xl font-extrabold text-slate-800 tracking-tight">
                    0
                  </p>
                  <p className="text-[13px] font-semibold text-slate-400 mt-2">
                    Bookings
                  </p>
                </Card>

                {/* Tenant Vs Booking Doughnut Chart */}
                <Card className="md:col-span-4 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tenant Vs Booking
                  </h3>
                  <div className="flex items-center justify-between flex-1 min-h-[90px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-brand-600 inline-block" />
                      <span className="text-sm font-semibold text-slate-700">Tenant</span>
                      <span className="text-sm font-bold text-slate-800 ml-1">100%</span>
                    </div>
                    
                    {/* Recharts Pie (Doughnut Ring) */}
                    <div className="w-[80px] h-[80px] relative flex items-center justify-center">
                      <PieChart width={80} height={80}>
                        <Pie
                          data={[{ value: 100 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={26}
                          outerRadius={36}
                          dataKey="value"
                        >
                          <Cell fill="#2563eb" />
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400">100%</span>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
            </section>

            {/* Current Month's All Issues */}
            <section className="space-y-3">
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Current Month's All Issues</h2>
              
              <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px]">
                {complaintCounts.total === 0 ? (
                  <div className="text-center space-y-4 flex flex-col items-center justify-center">
                    <svg
                      width="120"
                      height="80"
                      viewBox="0 0 120 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-40"
                    >
                      <path
                        d="M60 10V50"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M60 15L90 45H60V15Z"
                        fill="#e2e8f0"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M60 22L38 45H60V22Z"
                        fill="#f1f5f9"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 54C40 50 80 50 100 54L92 64H28L20 54Z"
                        fill="#cbd5e1"
                        stroke="#475569"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 68C30 66 90 66 110 68"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-sm font-semibold text-slate-400">No results!</p>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {complaintsQuery.data?.slice(0, 3).map((complaint) => (
                      <div key={complaint.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{complaint.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Room {complaint.roomNumber} • Raised by {complaint.tenantName}</p>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                          complaint.status === "open" ? "bg-amber-100 text-amber-800" :
                          complaint.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                          "bg-emerald-100 text-emerald-800"
                        )}>
                          {complaint.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* Quick Setup Promo for new PGs */}
            {!isKpiPage && (blocksCount === 0 || tenantCount === 0) && (
              <section className="space-y-3">
                <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Getting started</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {blocksCount === 0 && (
                    <Card className="border border-brand-100 bg-brand-50/20 hover:border-brand-300 transition-colors cursor-pointer rounded-2xl"
                      onClick={() => navigate("/my-pgs/structure")}
                    >
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className="rounded-xl bg-brand-500/10 p-3 shrink-0">
                          <Layers className="h-6 w-6 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">Set up your PG structure</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Add blocks, floors, rooms & beds so you can start adding tenants easily.
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-brand-600 shrink-0" />
                      </CardContent>
                    </Card>
                  )}
                  {tenantCount === 0 && (
                    <Card className="border border-brand-100 bg-brand-50/20 hover:border-brand-300 transition-colors cursor-pointer rounded-2xl"
                      onClick={() => navigate("/tenants/add")}
                    >
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className="rounded-xl bg-brand-500/10 p-3 shrink-0">
                          <UserPlus className="h-6 w-6 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">Add your first tenant</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            No tenants yet. Add a tenant manually, send an invite, or import via Excel.
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-brand-600 shrink-0" />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {/* Quick Actions / Shortcuts Panel */}
            <section className="space-y-3">
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Quick Shortcuts</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {manageItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.title}
                      className="cursor-pointer hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all border border-slate-100 rounded-2xl"
                      onClick={() => navigate(item.path)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 shadow-sm">
                          <Icon className="h-5 w-5 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
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
