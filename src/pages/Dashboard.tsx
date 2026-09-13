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
  Crown,
  Phone,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell } from "recharts";
import {
  useAllRoomsAndCounts,
  useBlocks,
  useComplaints,
  useDashboardDetails,
  usePropertyTenants,
  useStaffList,
  useAnalyticsRevenue,
  useAnalyticsOccupancy,
} from "@/hooks/usePropertyOwnerQueries";
import { CelebrationDialog } from "@/components/CelebrationDialog";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { FirstLoginTrialModal } from "@/components/common/FirstLoginTrialModal";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { Sparkles, Lock } from "lucide-react";

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
  const subAccess = useSubscriptionAccess();
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [gateFeature, setGateFeature] = useState("this feature");

  const isKpiPage = false;

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

  // Prompt gate modal when trial is expired
  useEffect(() => {
    if (subAccess.isExpired) {
      const alreadyShown = sessionStorage.getItem("trial_expired_gate_prompted");
      if (!alreadyShown) {
        setGateFeature("PG Management");
        setGateModalOpen(true);
        sessionStorage.setItem("trial_expired_gate_prompted", "true");
      }
    }
  }, [subAccess.isExpired]);

  const roomsQuery = useAllRoomsAndCounts(selectedPgId);
  const complaintsQuery = useComplaints(selectedPgId);
  const staffQuery = useStaffList(selectedPgId);
  const dashboardDetailsQuery = useDashboardDetails(selectedPgId);
  const tenantsQuery = usePropertyTenants(selectedPgId);
  const blocksQuery = useBlocks(selectedPgId);
  
  const revenueQuery = useAnalyticsRevenue(selectedPgId);
  const occupancyQuery = useAnalyticsOccupancy(selectedPgId);

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

  const quickActions = [
    { title: "Tenants", desc: "View all active & checked out tenants", icon: Users, path: "/tenants" },
    { title: "Complaints", desc: "Manage tenants issues", icon: AlertTriangle, path: "/complaints" },
    { title: "Announcement", desc: "Broadcast updates to all tenants", icon: Megaphone, path: "/support" },
  ];

  const staffCount = (staffQuery.data ?? []).length;

  const handleRetry = () => {
    if (roomsQuery.isError) roomsQuery.refetch();
    if (complaintsQuery.isError) complaintsQuery.refetch();
    if (staffQuery.isError) staffQuery.refetch();
    if (dashboardDetailsQuery.isError) dashboardDetailsQuery.refetch();
    if (revenueQuery.isError) revenueQuery.refetch();
    if (occupancyQuery.isError) occupancyQuery.refetch();
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



  return (
    <CanAccessPage permission="dashboard_view">
      <div className="space-y-6 pb-12">
        {/* Top bar with PG selector & actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 shadow-sm shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedPg ? selectedPg.name : "PG Operations"}
                </h1>
                {subAccess.currentPlan === "PRO" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time operational dashboard & property occupancy overview
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 self-end">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "gap-2 rounded-xl transition-all",
                !subAccess.canPerformOperations
                  ? "border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => {
                if (!subAccess.canPerformOperations) {
                  setGateFeature("Import Excel");
                  setGateModalOpen(true);
                }
              }}
            >
              {!subAccess.canPerformOperations ? (
                <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Import</span> Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "gap-2 rounded-xl transition-all",
                !subAccess.canPerformOperations
                  ? "border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => {
                if (!subAccess.canPerformOperations) {
                  setGateFeature("Send Invite");
                  setGateModalOpen(true);
                }
              }}
            >
              {!subAccess.canPerformOperations ? (
                <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send</span> Invite
            </Button>
            <CanAccess permission="tenant_add">
              <Button
                size="sm"
                className={cn(
                  "gap-2 rounded-xl transition-all shadow-sm",
                  !subAccess.canAddTenant
                    ? "bg-destructive hover:bg-destructive/90 text-white"
                    : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/10"
                )}
                onClick={() => {
                  if (!subAccess.canAddTenant) {
                    setGateFeature("Add Tenant");
                    setGateModalOpen(true);
                  } else {
                    navigate("/tenants/add");
                  }
                }}
              >
                {!subAccess.canAddTenant ? (
                  <Lock className="h-4 w-4 shrink-0" />
                ) : (
                  <UserPlus className="h-4 w-4 shrink-0" />
                )}
                Add Tenant
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Trial Status Banner */}
        {subAccess.isTrial && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/50 dark:border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0 font-black">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Lite Plan 45-Day Free Trial
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {subAccess.trialDaysRemaining} days remaining
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct UPI collection (0% fee), manual verify & Dedicated Account Manager are active.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold gap-1.5 shrink-0 shadow-sm"
              onClick={() => navigate("/plans")}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Upgrade to Pro (₹49/bed)
            </Button>
          </div>
        )}

        {/* Subscription Expired Alert Banner */}
        {subAccess.isExpired && (
          <div className="bg-gradient-to-r from-red-500/15 via-rose-500/10 to-amber-500/10 border-2 border-red-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-red-500 shrink-0 font-black">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">
                    Your Subscription is Over
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30 uppercase tracking-wider">
                    All Operations Locked
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Your 45-day free trial has concluded. Adding tenants, building creation, notice period tracking, and rent collections are restricted. Contact support or buy a plan to reactivate operations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-center">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-initial border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold gap-1.5"
                onClick={() => {
                  setGateFeature("Account Operations");
                  setGateModalOpen(true);
                }}
              >
                <Phone className="h-3.5 w-3.5 text-teal-600" />
                Contact Support
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-initial bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-brand-600/20"
                onClick={() => navigate("/plans")}
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                Buy Plan (₹29/₹49)
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
              <div className="md:col-span-2 h-[120px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
              <div className="md:col-span-2 h-[120px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
              <div className="md:col-span-2 h-[120px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
              <div className="md:col-span-2 h-[120px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
              <div className="md:col-span-4 h-[120px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[280px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
              <div className="h-[280px] bg-slate-100/80 dark:bg-slate-900/60 animate-pulse rounded-2xl" />
            </div>
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

            {/* Analytics API Section */}
            <section className="space-y-4 pt-2">
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Real-Time Performance Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Revenue Analytics Card */}
                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                  {!subAccess.canViewRentAnalytics && (
                    <div className="absolute inset-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 mb-2">
                        <Lock className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rent Analytics Locked</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 mb-3">
                        Your 45-day free trial has ended. Subscribe to Lite (₹29/bed) or Pro (₹49/bed) to unlock revenue analytics.
                      </p>
                      <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs shadow-sm" onClick={() => navigate("/plans")}>
                        View Subscription Plans
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Revenue Trend
                      </h3>
                      <p className="text-xl font-bold text-slate-800 mt-1">
                        Monthly Collections
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                      Live API
                    </span>
                  </div>
                  
                  {revenueQuery.isLoading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-end gap-3 pt-6 px-2">
                      {/* Simple Bar Chart Visualization */}
                      {[
                        { month: "Jan", amount: 45000 },
                        { month: "Feb", amount: 52000 },
                        { month: "Mar", amount: 49000 },
                        { month: "Apr", amount: 62000 },
                        { month: "May", amount: 58000 },
                        { month: "Jun", amount: 75000 },
                      ].map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="w-full bg-teal-100 dark:bg-teal-950/20 group-hover:bg-teal-500 rounded-t-lg transition-colors relative" style={{ height: `${(item.amount / 80000) * 100}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                              ₹{(item.amount / 1000).toFixed(0)}k
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Occupancy Analytics Card */}
                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Occupancy Analytics
                      </h3>
                      <p className="text-xl font-bold text-slate-800 mt-1">
                        Bed Allocation Status
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                      Live API
                    </span>
                  </div>

                  {occupancyQuery.isLoading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-around gap-4">
                      {/* Gauge style donut */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-[120px] h-[120px] relative flex items-center justify-center">
                          <PieChart width={120} height={120}>
                            <Pie
                              data={[
                                { name: "Occupied", value: bedStats.occupiedBeds || 1 },
                                { name: "Available", value: bedStats.availableBeds || 1 },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={48}
                              dataKey="value"
                            >
                              <Cell fill="#0d9488" />
                              <Cell fill="#e2e8f0" />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-black text-slate-800">{bedStats.occupancyRate}%</span>
                            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Filled</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-teal-600 inline-block" />
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Occupied Beds</span>
                            <span className="text-sm font-bold text-slate-800 block">{bedStats.occupiedBeds} beds</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Available Beds</span>
                            <span className="text-sm font-bold text-slate-800 block">{bedStats.availableBeds} beds</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                          <p className="font-semibold text-sm text-slate-800 truncate">{complaint.subject || complaint.description || "No Subject"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Category: {complaint.category || "General"} • Priority: {complaint.priority || "Normal"}</p>
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

        {/* Plan Status Simulation Toolbar */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Plan Simulator Demo Toolbar:</span>
              <span className="text-[11px] text-slate-400 block">Switch live preview to expired subscription or active trial</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-[11px] rounded-lg border-amber-500/40 text-amber-300 hover:bg-amber-950/50 ${
                subAccess.isTrial ? "bg-amber-500/20 ring-1 ring-amber-400" : "bg-transparent"
              }`}
              onClick={() => subAccess.setDemoPlan("trial")}
            >
              🟢 45-Day Trial
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-[11px] rounded-lg border-red-500/40 text-red-300 hover:bg-red-950/50 ${
                subAccess.isExpired ? "bg-red-500/20 ring-1 ring-red-400" : "bg-transparent"
              }`}
              onClick={() => subAccess.setDemoPlan("expired")}
            >
              🔴 Expired Plan ⚠️
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-[11px] rounded-lg border-teal-500/40 text-teal-300 hover:bg-teal-950/50 ${
                subAccess.currentPlan === "PRO" && !subAccess.isExpired ? "bg-teal-500/20 ring-1 ring-teal-400" : "bg-transparent"
              }`}
              onClick={() => subAccess.setDemoPlan("pro")}
            >
              👑 Pro Active
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] text-slate-400 hover:text-white rounded-lg"
              onClick={() => subAccess.setDemoPlan("reset")}
            >
              Reset (Live API)
            </Button>
          </div>
        </div>

        <CelebrationDialog
          open={celebrationOpen}
          onClose={() => setCelebrationOpen(false)}
          pgName={celebrationPgName}
        />

        <FirstLoginTrialModal />

        <TrialExpiredGateModal
          open={gateModalOpen}
          onOpenChange={setGateModalOpen}
          featureName={gateFeature}
        />
      </div>
    </CanAccessPage>
  );
};

export default Dashboard;
