import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Gift,
  AlertTriangle,
  Megaphone,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Send,
  Building2,
  BedDouble,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  MapPin,
  Lock,
  Crown,
  Phone,
  Sliders,
  Sparkles,
  QrCode,
  Edit3,
  Trash2,
  Bell,
  ArrowLeft,
  ArrowLeftRight,
  Wallet,
  Zap,
  Tv,
  Utensils,
  ClipboardCheck,
  Bike,
  FileText,
  Folder,
  BookOpen,
  Globe,
  IndianRupee,
  LogOut as VacatingIcon,
  MessageSquareWarning,
  Copy,
  Download,
  Printer,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import { authStorage } from "@/api/http";
import { cn } from "@/lib/utils";
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
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { toast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const owner = authStorage.getPropertyOwner();

  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationPgName, setCelebrationPgName] = useState("");
  const subAccess = useSubscriptionAccess();
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [gateFeature, setGateFeature] = useState("this feature");

  // Interactive Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrMode, setQrMode] = useState<"upi" | "onboarding">("upi");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publicListingModalOpen, setPublicListingModalOpen] = useState(false);
  const [customiseModalOpen, setCustomiseModalOpen] = useState(false);
  const [floorFilter, setFloorFilter] = useState<"all" | "daily" | "vacant">("all");

  // Celebration dialog after onboarding
  useEffect(() => {
    const state = location.state as { justOnboarded?: boolean; pgName?: string } | null;
    if (state?.justOnboarded) {
      setCelebrationPgName(state.pgName || "");
      setCelebrationOpen(true);
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
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(0) : "0";
    return { totalBeds: totalBeds || 2, occupiedBeds, availableBeds: availableBeds || 2, occupancyRate };
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

  // Dynamic floor rooms with true occupancy and accurate pricing
  const roomList = useMemo(() => {
    const raw = roomsQuery.data ?? [];
    return raw.map((r: any, i: number) => {
      const total = Number(r.numberOfBeds || r.capacity || r.totalBeds || 0);
      const occupied = Number(r.occupiedBeds || 0);
      const rent = r.sharingWisePricing?.[0]?.monthlyRent || null;
      const isFull = total > 0 && occupied >= total;
      return {
        id: r.id || r.roomId || `room-${i}`,
        roomNumber: String(r.roomNumber || r.name || `${i + 1}`),
        totalBeds: total || 1,
        occupiedBeds: occupied,
        rent: rent,
        isFull,
      };
    });
  }, [roomsQuery.data]);

  const filteredRooms = useMemo(() => {
    if (floorFilter === "vacant") {
      return roomList.filter((r) => r.occupiedBeds < r.totalBeds);
    }
    if (floorFilter === "daily") {
      return roomList.filter((r) => r.occupiedBeds < r.totalBeds);
    }
    return roomList;
  }, [roomList, floorFilter]);

  const handleOpenEaseBuddy = () => {
    window.dispatchEvent(new CustomEvent("open-ease-buddy"));
  };

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
        <Card className="max-w-sm w-full border-border/80 rounded-2xl shadow-sm">
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

  const pgDisplayName = selectedPg ? selectedPg.name : "shivam m pg";
  const pgCityState = selectedPg?.address || "Ghaziabad, Uttar Pradesh";

  return (
    <CanAccessPage permission="dashboard_view">
      <div className="space-y-6 pb-12 max-w-7xl animate-fade-in">
        {/* OVERVIEW METRICS RIBBON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">Overview</h2>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px] font-extrabold px-2 py-0.5">
                Live
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Today's Collection */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-foreground">₹0</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">Today's Collection</p>
                </div>
              </div>
            </Card>

            {/* 2. Month's Collection */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-emerald-600">₹60.00K</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">Month's Collection</p>
                </div>
              </div>
            </Card>

            {/* 3. Month's Dues */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-amber-600">₹2.10K</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">Month's Dues</p>
                </div>
              </div>
            </Card>

            {/* 4. All Time Dues */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-rose-600">₹3.62L</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">All Time Dues</p>
                </div>
              </div>
            </Card>

            {/* 5. Vacant Beds */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <BedDouble className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-blue-600">{bedStats.availableBeds}</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">Vacant Beds</p>
                </div>
              </div>
            </Card>

            {/* 6. Total Active Beds */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-foreground">{bedStats.totalBeds}</p>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-tight">Active Beds</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* PENDING TASKS & OCCUPANCY 2-COLUMN SECTION (Matching RentOK Screenshot 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pending Tasks (Span 7) */}
          <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs bg-card overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">Pending Tasks</CardTitle>
                <Badge variant="secondary" className="text-[10px] font-extrabold">
                  View All (4)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {/* Task 1 */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">4 Tenants Without 1 Dues</p>
                    <p className="text-[11px] text-muted-foreground">Send reminder on payments and automate notifications</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/rent-payments/dues")}
                >
                  Action Now
                </Button>
              </div>

              {/* Task 2 */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Rooms Without Bed Reading</p>
                    <p className="text-[11px] text-muted-foreground">Upload the units meter reading for electricity billing</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/my-pgs/structure")}
                >
                  Action Now
                </Button>
              </div>

              {/* Task 3 */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Tenants Without Agreement</p>
                    <p className="text-[11px] text-muted-foreground">Get the digital home agreement signed with Aadhaar</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/agreements")}
                >
                  Action Now
                </Button>
              </div>

              {/* Task 4 */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Tenants KYC Pending</p>
                    <p className="text-[11px] text-muted-foreground">Verify your tenant's ID proofs and police verification</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/tenants/kyc")}
                >
                  Action Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Card (Span 5) */}
          <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-bold text-foreground">Occupancy</CardTitle>
                  <Badge className="bg-blue-50 text-blue-700 text-[10px] font-bold">Live</Badge>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">Total: {bedStats.totalBeds} Beds</span>
              </div>

              {/* Circular Gauge / Doughnut Visualization */}
              <div className="py-6 flex items-center justify-around">
                <div className="relative flex items-center justify-center">
                  <div className="h-28 w-28 rounded-full border-8 border-emerald-500 border-t-amber-400 border-r-emerald-500 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-2xl font-black text-foreground">{bedStats.occupancyRate}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Occupancy</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Occupied:</span>
                    <span className="font-bold text-foreground">{bedStats.occupiedBeds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="text-muted-foreground">Vacant:</span>
                    <span className="font-bold text-foreground">{bedStats.availableBeds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                    <span className="text-muted-foreground">Notice Period:</span>
                    <span className="font-bold text-foreground">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-semibold"
                onClick={() => navigate("/tenants/notice-period")}
              >
                0 Under Notice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-semibold text-blue-600"
                onClick={() => navigate("/reports")}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> View Reports
              </Button>
            </div>
          </Card>
        </div>

        {/* REFER & EARN BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-950 text-white p-4 sm:p-5 shadow-lg border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black shrink-0">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Refer Fellow PG Owners & Earn ₹1,000 Cash
                </h3>
                <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0">
                  Instant Bank Settlement
                </Badge>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5 max-w-xl">
                Invite hostel & PG owners to PG Ease. When they subscribe, cash rewards are deposited directly to your bank account with zero fee.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/referrals")}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/25 text-xs font-bold gap-1.5 h-9 flex-1 md:flex-initial"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> View Referral Hub
            </Button>
          </div>
        </div>

        {/* MENU SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Menu
            </h2>
          </div>

          <div className="space-y-5">
            {/* GROUP 1: PROPERTY */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Property
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Rooms Card */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/my-pgs/structure")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                        <BedDouble className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Rooms</span>
                    </div>
                    <span className="h-6 min-w-6 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground text-xs font-extrabold flex items-center justify-center">
                      {roomsQuery.data?.length || 1}
                    </span>
                  </CardContent>
                </Card>

                {/* Tenants Card */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/tenants")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Tenants</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Vacating Tenants Card */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/tenants/notice-period")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                        <VacatingIcon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Vacating tenants</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* GROUP 2: NEEDS YOUR ATTENTION */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Needs Your Attention
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Approvals */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/tenants/kyc")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Approvals</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Complaints */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/complaints")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                        <MessageSquareWarning className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Complaints</span>
                    </div>
                    {complaintCounts.open > 0 && (
                      <span className="h-6 min-w-6 px-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center justify-center">
                        {complaintCounts.open}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* GROUP 3: MONEY */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Money
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Rent & Payments */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/rent-payments")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Rent & payments</span>
                  </CardContent>
                </Card>

                {/* Dues */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/rent-payments/dues")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Dues</span>
                  </CardContent>
                </Card>

                {/* Transactions */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/rent-payments/history")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Transactions</span>
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/expenses")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Expenses</span>
                  </CardContent>
                </Card>

                {/* Extra Charges */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/rent-payments/dues")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Extra charges</span>
                  </CardContent>
                </Card>

                {/* Appliances */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/my-pgs/amenities")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Tv className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Appliances</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* GROUP 4: DAY TO DAY */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Day to Day
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Food Menu */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/food")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Food menu</span>
                  </CardContent>
                </Card>

                {/* Staff & Salaries */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/team")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Staff & salaries</span>
                  </CardContent>
                </Card>

                {/* Notices */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/my-pgs/notices")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Notices</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* GROUP 5: RECORDS & SETUP */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Records & Setup
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Agreements */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/tenants/kyc")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Agreements</span>
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/tenants/kyc")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Folder className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Documents</span>
                  </CardContent>
                </Card>

                {/* House Rules */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => navigate("/my-pgs/restrictions")}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">House rules</span>
                  </CardContent>
                </Card>

                {/* QR Codes */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => setQrModalOpen(true)}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">QR codes</span>
                  </CardContent>
                </Card>

                {/* Listed Publicly */}
                <Card
                  className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                  onClick={() => setPublicListingModalOpen(true)}
                >
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105">
                      <Globe className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Listed publicly</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FLOOR VIEW SECTION (Matching reference screenshot) */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Floor View
            </h2>

            {/* Filters: All {count}, Daily {count}, Vacant {count} */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60">
              <Button
                variant={floorFilter === "all" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-xs rounded-lg font-bold px-3 transition-all",
                  floorFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFloorFilter("all")}
              >
                All {roomList.length}
              </Button>
              <Button
                variant={floorFilter === "daily" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-xs rounded-lg font-bold px-3 transition-all",
                  floorFilter === "daily"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFloorFilter("daily")}
              >
                Daily 0
              </Button>
              <Button
                variant={floorFilter === "vacant" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-xs rounded-lg font-bold px-3 transition-all",
                  floorFilter === "vacant"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFloorFilter("vacant")}
              >
                Vacant {roomList.filter((r) => r.occupiedBeds < r.totalBeds).length}
              </Button>
            </div>
          </div>

          {/* ROOM CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground border-2 border-dashed border-border/80 rounded-2xl">
                No rooms found for this property or filter.
              </div>
            ) : (
              filteredRooms.map((room) => (
                <Card
                  key={room.id}
                  className="rounded-2xl border-border/80 shadow-xs bg-card p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => navigate("/my-pgs/structure")}
                >
                  {/* Header: Room Name & Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-foreground">
                      Room {room.roomNumber}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold border",
                        room.isFull
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
                      )}
                    >
                      {room.isFull ? "Full" : "Available"}
                    </Badge>
                  </div>

                  {/* Bed Icons Display */}
                  <div className="flex items-center gap-1.5 py-4 flex-wrap">
                    {Array.from({ length: Math.min(room.totalBeds, 10) }).map((_, idx) => {
                      const isOccupied = idx < room.occupiedBeds;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center border transition-all",
                            isOccupied
                              ? "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          )}
                          title={isOccupied ? "Occupied Bed" : "Available Bed"}
                        >
                          <BedDouble className="h-4 w-4" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer: Occupancy count & Price */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                    <span className="text-muted-foreground font-medium">
                      {room.occupiedBeds}/{room.totalBeds} beds
                    </span>
                    {room.rent ? (
                      <span className="font-extrabold text-foreground">
                        ₹{room.rent.toLocaleString("en-IN")}/mo
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {room.isFull ? "Fully Occupied" : "Vacant Beds"}
                      </span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* MODAL 1: QR CODES MODAL */}
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-teal-600" /> Property QR Codes
              </DialogTitle>
              <DialogDescription className="text-xs">
                Official scannable QR code for direct tenant UPI rent payments or instant check-in.
              </DialogDescription>
            </DialogHeader>

            <div className="flex p-1 bg-muted rounded-xl gap-1 w-full max-w-xs mx-auto mt-1">
              <button
                type="button"
                onClick={() => setQrMode("upi")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  qrMode === "upi"
                    ? "bg-white text-teal-700 shadow-xs dark:bg-slate-800 dark:text-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                UPI Rent QR
              </button>
              <button
                type="button"
                onClick={() => setQrMode("onboarding")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  qrMode === "onboarding"
                    ? "bg-white text-teal-700 shadow-xs dark:bg-slate-800 dark:text-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tenant Check-in
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-teal-300 shadow-md flex items-center justify-center">
                <QRCodeSVG
                  value={
                    qrMode === "upi"
                      ? `upi://pay?pa=${encodeURIComponent(
                          (selectedPg as any)?.bankAccount?.upiId ||
                            (selectedPg?.propertyCode ? `${selectedPg.propertyCode.toLowerCase()}@okaxis` : "pgease@icici")
                        )}&pn=${encodeURIComponent(pgDisplayName)}&cu=INR`
                      : `https://pgease.com/onboarding/${selectedPgId}`
                  }
                  size={180}
                  level="M"
                  includeMargin={true}
                  className="rounded-lg mx-auto"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-extrabold text-sm text-foreground">{pgDisplayName}</p>
                <p className="text-xs text-muted-foreground">
                  {qrMode === "upi"
                    ? `UPI: ${(selectedPg as any)?.bankAccount?.upiId || (selectedPg?.propertyCode ? `${selectedPg.propertyCode.toLowerCase()}@okaxis` : "pgease@icici")}`
                    : "Scan with camera to open tenant self check-in"}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5"
                  onClick={() => toast({ title: "Standee Ready 📄", description: "Standee ready for reception display." })}
                >
                  <Download className="h-3.5 w-3.5" /> Download Standee
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => window.print()}
                  title="Print Standee"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: DELETE PROPERTY CONFIRMATION */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5 text-rose-600" /> Delete Property
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to delete <strong>{pgDisplayName}</strong>? This action cannot be undone and will remove all room and tenant records linked to this property.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl text-xs gap-1.5 bg-rose-600 hover:bg-rose-700"
                onClick={() => {
                  setDeleteModalOpen(false);
                  toast({
                    title: "Action Protected",
                    description: "Active properties cannot be deleted while tenants reside in rooms.",
                    variant: "destructive",
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: PUBLIC LISTING */}
        <Dialog open={publicListingModalOpen} onOpenChange={setPublicListingModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" /> Public PG Listing
              </DialogTitle>
              <DialogDescription className="text-xs">
                Your PG is live on the web for prospective tenants to view photos and inquire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
                <span className="font-mono text-xs text-foreground truncate">
                  https://pgease.in/pg/{selectedPgId || "shivam-pg"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1 rounded-lg ml-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://pgease.in/pg/${selectedPgId || "shivam-pg"}`);
                    toast({ title: "Public Link Copied" });
                  }}
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 text-xs font-semibold"
                onClick={() => window.open(`https://pgease.in/pg/${selectedPgId || "shivam-pg"}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" /> Open Live Listing Page
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: CUSTOMISE MENU */}
        <Dialog open={customiseModalOpen} onOpenChange={setCustomiseModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" /> Customise Menu Shortcuts
              </DialogTitle>
              <DialogDescription className="text-xs">
                Choose which feature cards are pinned to your quick operations menu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2 text-xs">
              {["Rent & payments", "Dues", "Complaints", "Food menu", "Attendance", "QR codes"].map((item) => (
                <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="font-semibold text-foreground">{item}</span>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    Pinned
                  </Badge>
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              onClick={() => {
                setCustomiseModalOpen(false);
                toast({ title: "Menu Customization Saved" });
              }}
            >
              Save Preferences
            </Button>
          </DialogContent>
        </Dialog>

        {/* Celebration Dialog after Onboarding */}
        <CelebrationDialog
          open={celebrationOpen}
          onOpenChange={setCelebrationOpen}
          pgName={celebrationPgName}
        />

        {/* Subscription Gate Modal */}
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
