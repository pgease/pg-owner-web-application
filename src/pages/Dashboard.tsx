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
import { useEntitlements } from "@/hooks/useEntitlements";
import { CelebrationDialog } from "@/components/CelebrationDialog";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { formatInr } from "@/lib/rentDashboard";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { PendingRentCard } from "@/components/dashboard/PendingRentCard";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { MonthlyKpiDashboard } from "@/components/dashboard/MonthlyKpiDashboard";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, selectedPgId } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const subAccess = useSubscriptionAccess();
  const entitlements = useEntitlements();

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
  const cheerful = !entitlements.isLoading && (entitlements.isTrial || entitlements.isPro) && !entitlements.isExpired;
  const planLine = entitlements.isTrial
    ? `Pro Trial · ${entitlements.daysRemaining} ${entitlements.daysRemaining === 1 ? "day" : "days"} left`
    : entitlements.isPro
      ? "Pro"
      : "Lite";
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

        <section
          className={cn(
            "rounded-md border px-4 py-4 sm:px-5",
            cheerful
              ? "border-[#B7DEDE] bg-gradient-to-r from-[#E8F4F4] via-white to-[#F4FBFB]"
              : "border-[#E2E6EA] bg-white",
          )}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#008080]">{planLine}</p>
          <h2 className="mt-1 text-[18px] font-semibold leading-snug text-[#18212B]">
            {cheerful ? `Welcome back to ${selectedPg?.name ?? "your PG"}` : selectedPg?.name ?? "Your PG"}
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] leading-5 text-[#3D4A57]">
            {cheerful
              ? `${currentMonthName} is open. Collect what’s due, fill empty beds, and clear the list below.`
              : `${currentMonthName}: occupancy, rent still due, and the items that need a decision.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/rent-payments")}>
              <IndianRupee className="h-4 w-4" /> Record payment
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/tenants")}>
              <Users className="h-4 w-4" /> View tenants
            </Button>
          </div>
        </section>

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
            {/* Month-Wise Comprehensive Operational & Pro KPIs (PG-OWNER-KPIS.md) */}
            <MonthlyKpiDashboard
              propertyId={selectedPgId}
              propertyName={selectedPg?.name}
            />

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
