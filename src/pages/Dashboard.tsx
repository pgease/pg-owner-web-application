import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, UserPlus, IndianRupee, BedDouble, Users, MessageSquareWarning, RefreshCw, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { useApp } from "@/context/AppContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { CelebrationDialog } from "@/components/CelebrationDialog";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { formatInr } from "@/lib/rentDashboard";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { PendingRentCard } from "@/components/dashboard/PendingRentCard";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, selectedPgId } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const subAccess = useSubscriptionAccess();

  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationPgName, setCelebrationPgName] = useState("");
  const [gateModalOpen, setGateModalOpen] = useState(false);

  // Celebration dialog right after onboarding.
  useEffect(() => {
    const state = location.state as { justOnboarded?: boolean; pgName?: string } | null;
    if (state?.justOnboarded) {
      setCelebrationPgName(state.pgName || "");
      setCelebrationOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Show the expired-plan prompt once per session.
  useEffect(() => {
    if (subAccess.isExpired && !sessionStorage.getItem("trial_expired_gate_prompted")) {
      setGateModalOpen(true);
      sessionStorage.setItem("trial_expired_gate_prompted", "true");
    }
  }, [subAccess.isExpired]);

  const data = useDashboardData(selectedPgId);

  const handleAddProperty = () => {
    if (subAccess.isExpired) setGateModalOpen(true);
    else navigate("/onboarding", { state: { forceShowForm: true } });
  };

  if (!selectedPgId) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <div className="register-card p-6">
          <EmptyState
            icon={<Building2 />}
            title={list.length ? "Select a property to continue" : "Add your first property"}
            description={
              list.length
                ? "Use the property switcher in the top bar to choose which PG you want to manage."
                : "Set up your PG once — rooms, beds and tenants — and this dashboard will show what needs your attention every day."
            }
            action={!list.length ? <Button onClick={handleAddProperty}>Add property</Button> : undefined}
          />
        </div>
        <TrialExpiredGateModal open={gateModalOpen} onOpenChange={setGateModalOpen} featureName="Add New Property" />
      </div>
    );
  }

  const { beds, tenants, complaints, rent, loading, isError } = data;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = MONTHS[rent.month - 1];
  const shortMonthName = currentMonthName.slice(0, 3);

  return (
    <CanAccessPage permission="dashboard_view">
      <div className="space-y-6 pb-6">
        <PageHeader
          title={selectedPg?.name ?? "Dashboard"}
          description={selectedPg?.address || `Overview for ${currentMonthName} ${rent.year}`}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-[var(--gray-600)]"
                onClick={data.refetchAll}
                aria-label="Refresh dashboard"
                disabled={data.isFetching}
              >
                <RefreshCw className={cn("h-4 w-4", data.isFetching && "animate-spin")} />
              </Button>
              <CanAccess permission="tenant_add">
                <Button className="gap-1.5" onClick={() => navigate("/tenants/add")}>
                  <UserPlus className="h-4 w-4" /> Add tenant
                </Button>
              </CanAccess>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-1.5">
                    Quick actions <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate("/rent-payments")} className="gap-2">
                    <IndianRupee className="h-4 w-4 text-[var(--brand-600)]" /> Record rent payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-pgs/structure")} className="gap-2">
                    <BedDouble className="h-4 w-4 text-[var(--gray-600)]" /> Add room or bed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/tenants/kyc")} className="gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verify KYC
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/complaints")} className="gap-2">
                    <MessageSquareWarning className="h-4 w-4 text-amber-600" /> View complaints
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        {isError ? (
          <div className="register-card p-6">
            <ErrorState
              title="Couldn't load your dashboard"
              description="We couldn't reach the server. Check your connection and try again."
              onRetry={data.refetchAll}
              retrying={data.isFetching}
            />
          </div>
        ) : (
          <>
            {/* Overview Operational Metrics */}
            <section aria-label="Key operational metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <MetricDisplay
                label={`Collected (${shortMonthName})`}
                value={rent.collectedThisMonth != null ? formatInr(rent.collectedThisMonth) : "—"}
                subText={rent.paidCount != null ? `${rent.paidCount} tenant${rent.paidCount === 1 ? "" : "s"} paid` : "This month"}
                tone="success"
                loading={loading.rent}
                to="/rent-payments"
              />
              <MetricDisplay
                label={`Pending (${shortMonthName})`}
                value={rent.pendingAmount != null ? formatInr(rent.pendingAmount) : rent.unpaidCount != null ? rent.unpaidCount : "—"}
                subText={rent.unpaidCount != null ? `${rent.unpaidCount} tenant${rent.unpaidCount === 1 ? "" : "s"} pending` : "This month"}
                tone={(rent.unpaidCount ?? 0) > 0 ? "warning" : "default"}
                loading={loading.rent}
                to="/rent-payments/dues"
              />
              <MetricDisplay
                label="Overdue rent"
                value={(rent.unpaidCount ?? 0) > 0 ? `${rent.unpaidCount}` : "0"}
                subText={(rent.unpaidCount ?? 0) > 0 ? "Needs immediate reminder" : "None overdue"}
                tone={(rent.unpaidCount ?? 0) > 0 ? "danger" : "default"}
                loading={loading.rent}
                to="/rent-payments/dues"
              />
              <MetricDisplay
                label="Occupied beds"
                value={loading.rooms ? "" : `${beds.occupiedBeds}/${beds.totalBeds}`}
                subText={loading.rooms ? undefined : `${beds.occupancyPct}% occupancy`}
                loading={loading.rooms}
                to="/my-pgs/structure"
              />
              <MetricDisplay
                label="Vacant beds"
                value={beds.vacantBeds}
                subText={beds.vacantBeds > 0 ? "Ready for check-in" : "Fully occupied"}
                loading={loading.rooms}
                to="/tenants/vacant-rooms"
              />
              <MetricDisplay
                label="Open complaints"
                value={complaints.open}
                subText={complaints.inProgress > 0 ? `${complaints.inProgress} in progress` : `${complaints.total} total`}
                tone={complaints.open > 0 ? "danger" : "default"}
                loading={loading.complaints}
                to="/complaints"
              />
            </section>

            {/* Attention + occupancy */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <AttentionList data={data} />
              </div>
              <div className="lg:col-span-5">
                <OccupancyCard data={data} />
              </div>
            </div>

            {/* Pending Rent Quick Collection */}
            <PendingRentCard data={data} />

            {/* Rooms Structure / Bed Grid */}
            <RoomGrid data={data} />
          </>
        )}

        <CelebrationDialog open={celebrationOpen} onClose={() => setCelebrationOpen(false)} pgName={celebrationPgName} />
        <TrialExpiredGateModal open={gateModalOpen} onOpenChange={setGateModalOpen} featureName="PG Management" />
      </div>
    </CanAccessPage>
  );
};

export default Dashboard;
