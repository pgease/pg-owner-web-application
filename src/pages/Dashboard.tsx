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
import { StatCard } from "@/components/common/StatCard";
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
        <div className="rounded-lg border bg-card">
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

  return (
    <CanAccessPage permission="dashboard_view">
      <div className="space-y-6 pb-8">
        <PageHeader
          title={selectedPg?.name ?? "Dashboard"}
          description={selectedPg?.address || `Here's what's happening at your PG in ${MONTHS[rent.month - 1]}.`}
          actions={
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
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
                  <Button variant="outline" className="gap-1.5">
                    Quick actions <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate("/rent-payments")} className="gap-2">
                    <IndianRupee className="h-4 w-4" /> Record rent payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-pgs/structure")} className="gap-2">
                    <BedDouble className="h-4 w-4" /> Add room or bed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/tenants/kyc")} className="gap-2">
                    <ShieldCheck className="h-4 w-4" /> Verify KYC
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/complaints")} className="gap-2">
                    <MessageSquareWarning className="h-4 w-4" /> View complaints
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        {isError ? (
          <div className="rounded-lg border bg-card">
            <ErrorState
              title="Couldn't load your dashboard"
              description="We couldn't reach the server. Check your connection and try again."
              onRetry={data.refetchAll}
              retrying={data.isFetching}
            />
          </div>
        ) : (
          <>
            {/* Overview */}
            <section aria-label="Overview" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Occupied beds"
                value={loading.rooms ? "" : `${beds.occupiedBeds}/${beds.totalBeds}`}
                hint={loading.rooms ? undefined : `${beds.occupancyPct}% occupancy`}
                icon={<BedDouble />}
                tone="brand"
                loading={loading.rooms}
                onClick={() => navigate("/my-pgs/structure")}
              />
              <StatCard
                label="Vacant beds"
                value={beds.vacantBeds}
                hint={beds.vacantBeds > 0 ? "Ready for new tenants" : "Fully occupied"}
                icon={<BedDouble />}
                tone={beds.vacantBeds > 0 ? "info" : "default"}
                loading={loading.rooms}
                onClick={() => navigate("/tenants/vacant-rooms")}
              />
              <StatCard
                label="Tenants"
                value={tenants.total}
                hint={tenants.onNotice > 0 ? `${tenants.onNotice} on notice` : "Active tenants"}
                icon={<Users />}
                loading={loading.tenants}
                onClick={() => navigate("/tenants")}
              />
              <StatCard
                label="Rent collected"
                value={rent.collectedThisMonth != null ? formatInr(rent.collectedThisMonth) : "—"}
                hint={rent.paidCount != null ? `${rent.paidCount} tenant${rent.paidCount === 1 ? "" : "s"} paid · ${MONTHS[rent.month - 1].slice(0, 3)}` : "This month"}
                icon={<IndianRupee />}
                tone="success"
                loading={loading.rent}
                onClick={() => navigate("/rent-payments")}
              />
              <StatCard
                label="Rent pending"
                value={rent.pendingAmount != null ? formatInr(rent.pendingAmount) : rent.unpaidCount != null ? rent.unpaidCount : "—"}
                hint={rent.unpaidCount != null ? `${rent.unpaidCount} tenant${rent.unpaidCount === 1 ? "" : "s"} unpaid` : "This month"}
                icon={<IndianRupee />}
                tone={(rent.unpaidCount ?? 0) > 0 ? "danger" : "default"}
                loading={loading.rent}
                onClick={() => navigate("/rent-payments/dues")}
              />
              <StatCard
                label="Open complaints"
                value={complaints.open}
                hint={complaints.inProgress > 0 ? `${complaints.inProgress} in progress` : `${complaints.total} total`}
                icon={<MessageSquareWarning />}
                tone={complaints.open > 0 ? "warning" : "default"}
                loading={loading.complaints}
                onClick={() => navigate("/complaints")}
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

            <PendingRentCard data={data} />

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
