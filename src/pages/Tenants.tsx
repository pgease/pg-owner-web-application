import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowRightLeft,
  UserMinus,
  Clock,
  Download,
  IndianRupee,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SearchInput } from "@/components/common/SearchInput";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DataTable } from "@/components/common/DataTable";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import type { PropertyTenant } from "@/api/propertyOwner";
import { roomHasVacancyForAllocation } from "@/api/propertyOwner";
import {
  useBlocks,
  useFloors,
  usePropertyTenants,
  useRoomsList,
  useMoveTenantMutation,
  useSetTenantNoticeMutation,
  useCancelTenantNoticeMutation,
  useMoveOutTenantMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { toast } from "@/components/ui/use-toast";
import {
  tenantDisplayName,
  tenantInitials,
  tenantPhotoUrl,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantBlock,
  tenantFloor,
  tenantBedNo,
  tenantStayStatus,
} from "@/lib/tenantDisplay";
import { formatDate, formatINR } from "@/lib/formatters";
import { TenantDetailDrawer } from "@/components/tenants/TenantDetailDrawer";
import { cn } from "@/lib/utils";

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function waLink(phone: string): string | null {
  const d = phoneDigits(phone);
  if (d.length < 10) return null;
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}`;
}

const Tenants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, selectedPgId } = useApp();
  const entitlements = useEntitlements();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredFeature, setTrialExpiredFeature] = useState("");

  const handleAddTenantClick = (e: React.MouseEvent) => {
    if (entitlements.isExpired) {
      e.preventDefault();
      setTrialExpiredFeature("Add Tenant");
      setTrialExpiredOpen(true);
      return;
    }
    if (entitlements.isBedQuotaFull) {
      e.preventDefault();
      toast({
        title: "Bed Quota Exceeded",
        description: `Your subscription limit of ${entitlements.bedsUsage?.max || 0} beds has been reached. Please upgrade your plan to add more tenants.`,
        variant: "destructive",
      });
      navigate("/plans");
      return;
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "verified" | "pending">("all");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "notice" | "moved_out">("all");
  const [density, setDensity] = useState<"default" | "compact">("default");

  // Drawer inspection state
  const [activeDrawerTenant, setActiveDrawerTenant] = useState<PropertyTenant | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Move Tenant State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedTenantForMove, setSelectedTenantForMove] = useState<PropertyTenant | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState<string>("");
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [targetBedNumber, setTargetBedNumber] = useState<number>(1);
  const [transferDate, setTransferDate] = useState<string>("");
  const [newRent, setNewRent] = useState<string>("");
  const [newDeposit, setNewDeposit] = useState<string>("");
  const [transferDeposit, setTransferDeposit] = useState<boolean>(true);
  const [moveRemarks, setMoveRemarks] = useState<string>("");

  // Vacate / Move Out State
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [selectedTenantForVacate, setSelectedTenantForVacate] = useState<PropertyTenant | null>(null);
  const [vacateDate, setVacateDate] = useState<string>("");
  const [vacateReason, setVacateReason] = useState<string>("");
  const [vacateRemarks, setVacateRemarks] = useState<string>("");

  // Notice Period State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [selectedTenantForNotice, setSelectedTenantForNotice] = useState<PropertyTenant | null>(null);
  const [noticeMoveOutDate, setNoticeMoveOutDate] = useState<string>("");
  const [noticeReason, setNoticeReason] = useState<string>("Standard 30-day notice");

  // Cancel Notice State
  const [cancelNoticeAlertOpen, setCancelNoticeAlertOpen] = useState(false);
  const [selectedTenantForCancelNotice, setSelectedTenantForCancelNotice] = useState<PropertyTenant | null>(null);

  const moveMutation = useMoveTenantMutation(selectedPgId);
  const setNoticeMutation = useSetTenantNoticeMutation(selectedPgId);
  const cancelNoticeMutation = useCancelTenantNoticeMutation(selectedPgId);
  const moveOutMutation = useMoveOutTenantMutation(selectedPgId);

  const effectiveTargetPropertyId = targetPropertyId || selectedPgId || "";
  const targetRoomsQuery = useRoomsList(effectiveTargetPropertyId, undefined, undefined, { requireBlockAndFloor: false });
  const targetRooms = targetRoomsQuery.data ?? [];

  const handleOpenMoveModal = (tenant?: PropertyTenant) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Move Tenant");
      setTrialExpiredOpen(true);
      return;
    }
    if (tenant) setSelectedTenantForMove(tenant);
    setTargetPropertyId(selectedPgId || "");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!selectedTenantForMove || !targetRoomId) {
      toast({ title: "Please select tenant and target room", variant: "destructive" });
      return;
    }
    try {
      await moveMutation.mutateAsync({
        roomTenantId: selectedTenantForMove.id,
        targetPropertyId: effectiveTargetPropertyId,
        targetRoomId,
        targetBedNumber: Number(targetBedNumber) || 1,
        transferDate: transferDate || new Date().toISOString().split("T")[0],
        newMonthlyRent: newRent ? Number(newRent) : undefined,
        newSecurityDeposit: newDeposit ? Number(newDeposit) : undefined,
        transferSecurityDeposit: transferDeposit,
        remarks: moveRemarks.trim() || undefined,
      });
      toast({
        title: "Tenant relocated successfully",
        description: `${tenantDisplayName(selectedTenantForMove)} moved to room successfully.`,
      });
      setMoveModalOpen(false);
      setSelectedTenantForMove(null);
    } catch (e: any) {
      toast({ title: "Could not move tenant", description: e?.message, variant: "destructive" });
    }
  };

  const handleOpenVacateModal = (tenant: PropertyTenant) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Move Out Tenant");
      setTrialExpiredOpen(true);
      return;
    }
    setSelectedTenantForVacate(tenant);
    setVacateDate(new Date().toISOString().split("T")[0]);
    setVacateReason("Tenancy completed smoothly");
    setVacateRemarks("");
    setVacateModalOpen(true);
  };

  const handleConfirmVacate = async () => {
    if (!selectedTenantForVacate) return;
    const roomTenantId = selectedTenantForVacate.roomTenant?.id || selectedTenantForVacate.id;
    try {
      await moveOutMutation.mutateAsync({
        roomTenantId,
        body: {
          moveOutDate: vacateDate || new Date().toISOString().split("T")[0],
          reason: vacateReason.trim() || "Tenancy completed smoothly",
          remarks: vacateRemarks.trim() || undefined,
        },
      });
      toast({
        title: "Tenant move-out completed",
        description: `${tenantDisplayName(selectedTenantForVacate)} has moved out. The bed is now free.`,
      });
      setVacateModalOpen(false);
      setSelectedTenantForVacate(null);
      tenantsQuery.refetch();
    } catch (e: any) {
      toast({
        title: "Failed to process move-out",
        description: e?.message || "Unable to complete tenant move-out",
        variant: "destructive",
      });
    }
  };

  const handleOpenNoticeModal = (tenant: PropertyTenant) => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Notice Period");
      setTrialExpiredOpen(true);
      return;
    }
    setSelectedTenantForNotice(tenant);
    setNoticeMoveOutDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setNoticeReason("Standard 30-day notice");
    setNoticeModalOpen(true);
  };

  const handleConfirmSetNotice = async () => {
    if (!selectedTenantForNotice || !noticeMoveOutDate) {
      toast({ title: "Please select an expected move-out date", variant: "destructive" });
      return;
    }
    const roomTenantId = selectedTenantForNotice.roomTenant?.id || selectedTenantForNotice.id;
    try {
      await setNoticeMutation.mutateAsync({
        roomTenantId,
        body: {
          expectedMoveOutDate: noticeMoveOutDate,
          reason: noticeReason.trim() || "Tenant served move-out notice",
        },
      });
      toast({
        title: "Notice period initiated",
        description: `${tenantDisplayName(selectedTenantForNotice)} is now on notice (leaving ${noticeMoveOutDate}).`,
      });
      setNoticeModalOpen(false);
      setSelectedTenantForNotice(null);
      tenantsQuery.refetch();
    } catch (e: any) {
      toast({
        title: "Failed to initiate notice",
        description: e?.message || "Unable to set notice period",
        variant: "destructive",
      });
    }
  };

  const handleOpenCancelNoticeModal = (tenant: PropertyTenant) => {
    setSelectedTenantForCancelNotice(tenant);
    setCancelNoticeAlertOpen(true);
  };

  const handleConfirmCancelNotice = async () => {
    if (!selectedTenantForCancelNotice) return;
    const roomTenantId = selectedTenantForCancelNotice.roomTenant?.id || selectedTenantForCancelNotice.id;
    try {
      await cancelNoticeMutation.mutateAsync(roomTenantId);
      toast({
        title: "Notice cancelled",
        description: `${tenantDisplayName(selectedTenantForCancelNotice)} has been restored to active stay.`,
      });
      setCancelNoticeAlertOpen(false);
      setSelectedTenantForCancelNotice(null);
      tenantsQuery.refetch();
    } catch (e: any) {
      toast({
        title: "Failed to cancel notice",
        description: e?.message || "Unable to cancel notice",
        variant: "destructive",
      });
    }
  };

  const list = Array.isArray(properties) ? properties : [];
  const blocksQuery = useBlocks(selectedPgId);
  const blocks = blocksQuery.data ?? [];
  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(selectedPgId, effectiveBlockId || undefined);
  const floors = floorsQuery.data ?? [];
  const allPropertyRoomsQuery = useRoomsList(selectedPgId, undefined, undefined, { requireBlockAndFloor: false });
  const allPropertyRooms = allPropertyRoomsQuery.data ?? [];

  const isVacantRoomsPage = location.pathname === "/tenants/vacant-rooms";
  const tenantsQuery = usePropertyTenants(isVacantRoomsPage ? null : selectedPgId);

  const filteredTenants = useMemo(() => {
    const rows = tenantsQuery.data ?? [];
    let next = rows;

    if (selectedBlockId && selectedBlockId !== "all") {
      next = next.filter((t) => (t.block?.id ?? "") === selectedBlockId);
    }
    if (selectedFloorId && selectedFloorId !== "all") {
      next = next.filter((t) => (t.floor?.id ?? "") === selectedFloorId);
    }
    if (selectedRoomId && selectedRoomId !== "all") {
      next = next.filter((t) => (t.room?.id ?? "") === selectedRoomId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      next = next.filter((row) => {
        const blob = [
          tenantDisplayName(row),
          tenantPhone(row),
          tenantRoomNo(row),
          tenantFloor(row),
          tenantBlock(row),
        ].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }
    if (kycFilter === "verified") {
      next = next.filter((t) => tenantVerificationLabel(t) === "verified");
    } else if (kycFilter === "pending") {
      next = next.filter((t) => tenantVerificationLabel(t) !== "verified");
    }

    if (statusFilter === "active") {
      next = next.filter((t) => tenantStayStatus(t) === "ACTIVE");
    } else if (statusFilter === "notice") {
      next = next.filter((t) => tenantStayStatus(t) === "UNDER_NOTICE");
    } else if (statusFilter === "moved_out") {
      next = next.filter((t) => tenantStayStatus(t) === "MOVED_OUT");
    }

    return next;
  }, [tenantsQuery.data, searchQuery, kycFilter, statusFilter, selectedBlockId, selectedFloorId, selectedRoomId]);

  const rawTenantsList = tenantsQuery.data ?? [];
  const statusCounts = useMemo(() => {
    let active = 0;
    let notice = 0;
    let movedOut = 0;
    for (const t of rawTenantsList) {
      const st = tenantStayStatus(t);
      if (st === "UNDER_NOTICE") notice++;
      else if (st === "MOVED_OUT") movedOut++;
      else active++;
    }
    return {
      all: rawTenantsList.length,
      active,
      notice,
      movedOut,
    };
  }, [rawTenantsList]);

  const kpi = useMemo(() => {
    const rows = tenantsQuery.data ?? [];
    const verified = rows.filter((t) => tenantVerificationLabel(t) === "verified").length;
    const onNotice = rows.filter((t) => t.notice?.isOnNotice).length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = rows.filter((t) => {
      const s = t.roomTenant?.startDate;
      if (!s) return false;
      const d = new Date(s).getTime();
      return !Number.isNaN(d) && d >= weekAgo;
    }).length;
    return {
      total: rows.length,
      verified,
      onNotice,
      recent,
    };
  }, [tenantsQuery.data]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTenants.length === 0) return;
    const headers = ["Name", "Phone", "Room", "Bed", "Rent", "Due Status", "KYC", "Stay Status", "Joined"];
    const rows = filteredTenants.map((t) => [
      `"${tenantDisplayName(t)}"`,
      `"${tenantPhone(t)}"`,
      `"${tenantRoomNo(t)}"`,
      `"${tenantBedNo(t)}"`,
      `"${tenantRentAmount(t)}"`,
      `"${tenantRentDueLabel(t)}"`,
      `"${tenantVerificationLabel(t)}"`,
      `"${tenantStayStatus(t)}"`,
      `"${formatDate((t as any).roomTenant?.startDate || t.createdAt)}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tenants_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (tenant: PropertyTenant) => {
    setActiveDrawerTenant(tenant);
    setDrawerOpen(true);
  };

  return (
    <CanAccessPage permission="tenant_view">
      <div className="space-y-5 pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--gray-900)]">Tenants</h1>
            <p className="text-xs text-[var(--gray-600)] mt-0.5">
              Directory of current and previous residents with room assignments and billing status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenMoveModal()}
              className="gap-1.5"
            >
              <ArrowRightLeft className="h-4 w-4" /> Move tenant
            </Button>
            <CanAccess permission="tenant_add">
              <Button size="sm" asChild className="gap-1.5">
                <Link to="/tenants/add" onClick={handleAddTenantClick}>
                  <Plus className="h-4 w-4" /> Add tenant
                </Link>
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricDisplay label="Total tenants" value={kpi.total} />
          <MetricDisplay label="KYC verified" value={kpi.verified} tone="success" />
          <MetricDisplay label="On notice" value={kpi.onNotice} tone={kpi.onNotice > 0 ? "warning" : "default"} />
          <MetricDisplay label="New (last 7 days)" value={kpi.recent} />
        </div>

        {/* Lifecycle Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--gray-200)] pb-2 pt-1 scrollbar-none">
          {(
            [
              ["all", `All (${statusCounts.all})`],
              ["active", `Active (${statusCounts.active})`],
              ["notice", `Under Notice (${statusCounts.notice})`],
              ["moved_out", `Moved Out (${statusCounts.movedOut})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors tabular-nums",
                statusFilter === key
                  ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold border border-[var(--brand-100)]"
                  : "text-[var(--gray-600)] hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search, FilterBar Chips, Density Toggle, Export */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search name, phone, room…"
              className="w-full sm:w-64"
            />

            {/* Block Filter */}
            <Select
              value={selectedBlockId || "all"}
              onValueChange={(v) => {
                setSelectedBlockId(v === "all" ? "" : v);
                setSelectedFloorId("");
                setSelectedRoomId("");
              }}
            >
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="All Blocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Floor Filter */}
            <Select
              value={selectedFloorId || "all"}
              onValueChange={(v) => {
                setSelectedFloorId(v === "all" ? "" : v);
                setSelectedRoomId("");
              }}
            >
              <SelectTrigger className="w-[125px] h-9 text-xs">
                <SelectValue placeholder="All Floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors
                  .filter((f) => !selectedBlockId || selectedBlockId === "all" || f.blockId === selectedBlockId)
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Room Filter */}
            <Select
              value={selectedRoomId || "all"}
              onValueChange={(v) => setSelectedRoomId(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[125px] h-9 text-xs">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {allPropertyRooms
                  .filter((r) => !selectedFloorId || selectedFloorId === "all" || r.floorId === selectedFloorId)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* KYC Status Filter */}
            <Select value={kycFilter} onValueChange={(v) => setKycFilter(v as typeof kycFilter)}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="KYC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Density Toggle */}
            <div className="flex rounded-md border border-[var(--gray-300)] p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setDensity("default")}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm transition-colors",
                  density === "default"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-medium"
                    : "text-[var(--gray-500)] hover:text-[var(--gray-900)]",
                )}
                title="Normal row height"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm transition-colors",
                  density === "compact"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-medium"
                    : "text-[var(--gray-500)] hover:text-[var(--gray-900)]",
                )}
                title="Compact row height"
              >
                Compact
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 h-9 text-xs"
              disabled={filteredTenants.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Standardized DataTable */}
        <DataTable
          columns={[
            {
              id: "tenant",
              header: "Tenant",
              sortable: true,
              render: (t: PropertyTenant) => {
                const photo = tenantPhotoUrl(t);
                return (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--brand-50)] border border-[var(--brand-100)] text-[var(--brand-700)] flex items-center justify-center font-medium text-xs shrink-0">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      tenantInitials(t)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-medium text-[var(--gray-900)] truncate">
                      {tenantDisplayName(t)}
                    </span>
                    <span className="block text-xs text-[var(--gray-500)] tabular-nums">
                      {tenantPhone(t)}
                    </span>
                  </div>
                </div>
                );
              },
            },
            {
              id: "roomBed",
              header: "Room / Bed",
              render: (t: PropertyTenant) => {
                const room = tenantRoomNo(t);
                const bed = tenantBedNo(t);
                return (
                  <div>
                    <span className="font-medium text-[var(--gray-900)]">
                      {room !== "—" ? `Room ${room}` : "—"}
                    </span>
                    <span className="text-xs text-[var(--gray-500)] block">
                      {bed !== "—" ? `Bed ${bed}` : ""}
                    </span>
                  </div>
                );
              },
            },
            {
              id: "rent",
              header: "Monthly Rent",
              align: "right",
              render: (t: PropertyTenant) => (
                <span className="tabular-nums font-medium text-[var(--gray-900)]">
                  {tenantRentAmount(t)}
                </span>
              ),
            },
            {
              id: "thisMonth",
              header: "This Month",
              render: (t: PropertyTenant) => {
                const isOverdue = t.isOverdue || t.rentDueDays && t.rentDueDays > 0;
                return (
                  <div className="flex flex-col gap-0.5">
                    <StatusBadge
                      status={isOverdue ? "overdue" : "pending"}
                      label={isOverdue ? `Overdue ${t.rentDueDays ?? ""}d` : "Pending"}
                      size="sm"
                    />
                  </div>
                );
              },
            },
            {
              id: "kyc",
              header: "KYC",
              render: (t: PropertyTenant) => {
                const isVerified = tenantVerificationLabel(t) === "verified";
                return (
                  <StatusBadge
                    status={isVerified ? "kyc_completed" : "kyc_pending"}
                    size="sm"
                  />
                );
              },
            },
            {
              id: "stayStatus",
              header: "Stay Status",
              render: (t: PropertyTenant) => {
                const st = tenantStayStatus(t);
                return (
                  <StatusBadge
                    status={st === "UNDER_NOTICE" ? "on_notice" : st === "MOVED_OUT" ? "moved_out" : "occupied"}
                    size="sm"
                  />
                );
              },
            },
            {
              id: "joined",
              header: "Joined",
              align: "right",
              render: (t: PropertyTenant) => (
                <span className="tabular-nums text-xs text-[var(--gray-600)]">
                  {formatDate((t as any).roomTenant?.startDate || t.createdAt)}
                </span>
              ),
            },
            {
              id: "actions",
              header: "",
              align: "right",
              render: (t: PropertyTenant) => {
                const phone = tenantPhone(t);
                const clean = phone !== "—" ? phone.replace(/\D/g, "") : "";
                const wa = clean.length >= 10 ? `https://wa.me/${clean.length === 10 ? `91${clean}` : clean}` : null;
                const stay = tenantStayStatus(t);

                return (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2.5 text-xs"
                      onClick={() =>
                        navigate("/rent-payments", {
                          state: { recordForTenantId: t.id, tenantName: tenantDisplayName(t) },
                        })
                      }
                    >
                      Record
                    </Button>

                    <ActionMenu
                      items={[
                        {
                          label: "View profile",
                          icon: <ExternalLink className="h-3.5 w-3.5" />,
                          onClick: () => navigate(`/tenants/${t.id}`),
                        },
                        {
                          label: "Move tenant",
                          icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
                          onClick: () => handleOpenMoveModal(t),
                        },
                        ...(stay !== "UNDER_NOTICE"
                          ? [
                              {
                                label: "Initiate notice",
                                icon: <Clock className="h-3.5 w-3.5 text-amber-600" />,
                                onClick: () => handleOpenNoticeModal(t),
                              },
                            ]
                          : [
                              {
                                label: "Cancel notice",
                                icon: <Clock className="h-3.5 w-3.5 text-emerald-600" />,
                                onClick: () => handleOpenCancelNoticeModal(t),
                              },
                            ]),
                        {
                          label: "Move out",
                          icon: <UserMinus className="h-3.5 w-3.5 text-[#B42318]" />,
                          destructive: true,
                          onClick: () => handleOpenVacateModal(t),
                        },
                        ...(clean
                          ? [
                              {
                                label: "Call tenant",
                                icon: <Phone className="h-3.5 w-3.5 text-emerald-600" />,
                                onClick: () => window.open(`tel:${clean}`, "_self"),
                              },
                            ]
                          : []),
                        ...(wa
                          ? [
                              {
                                label: "WhatsApp chat",
                                icon: <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />,
                                onClick: () => window.open(wa, "_blank"),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                );
              },
            },
          ]}
          data={filteredTenants}
          keyExtractor={(t) => t.id}
          loading={tenantsQuery.isLoading}
          density={density}
          onRowClick={handleRowClick}
          emptyState={
            <EmptyState
              title={tenantsQuery.data?.length === 0 ? "No tenants registered yet" : "No tenants match your search"}
              description={
                tenantsQuery.data?.length === 0
                  ? "Add your first tenant to assign rooms, beds, and track rent collection."
                  : "Try clearing search filters or selecting another block."
              }
              action={
                tenantsQuery.data?.length === 0 ? (
                  <Button asChild size="sm">
                    <Link to="/tenants/add" onClick={handleAddTenantClick}>Add first tenant</Link>
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )
              }
            />
          }
        />

        {/* Tenant Detail Drawer (Opened on row click) */}
        <TenantDetailDrawer
          tenant={activeDrawerTenant}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onMoveTenant={handleOpenMoveModal}
          onNoticeTenant={handleOpenNoticeModal}
          onVacateTenant={handleOpenVacateModal}
          onRecordPayment={(t) =>
            navigate("/rent-payments", {
              state: { recordForTenantId: t.id, tenantName: tenantDisplayName(t) },
            })
          }
          onSendReminder={(t) => {
            const clean = phoneDigits(t.phone ?? "");
            if (clean) window.open(`https://wa.me/${clean.length === 10 ? `91${clean}` : clean}?text=Hi%20${encodeURIComponent(tenantDisplayName(t))},%20this%20is%20a%20reminder%20regarding%20your%20monthly%20PG%20rent.`, "_blank");
          }}
        />

        {/* MOVE TENANT DIALOG MODAL */}
        <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[var(--brand-700)] font-semibold">
                <ArrowRightLeft className="h-5 w-5" /> Move Tenant
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1.5">
                <Label>Select Tenant to Relocate</Label>
                <Select
                  value={selectedTenantForMove?.id || ""}
                  onValueChange={(id) => {
                    const found = (tenantsQuery.data || []).find((t) => t.id === id);
                    if (found) setSelectedTenantForMove(found);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Choose Tenant" /></SelectTrigger>
                  <SelectContent>
                    {(tenantsQuery.data || []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {tenantDisplayName(t)} (Room {tenantRoomNo(t)}, Bed {tenantBedNo(t)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target PG Property</Label>
                <Select value={effectiveTargetPropertyId} onValueChange={setTargetPropertyId}>
                  <SelectTrigger><SelectValue placeholder="Select Target PG" /></SelectTrigger>
                  <SelectContent>
                    {list.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target Room</Label>
                  <Select value={targetRoomId} onValueChange={setTargetRoomId}>
                    <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                    <SelectContent>
                      {targetRooms.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.availableBeds ?? 1} bed free)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Bed Number</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={targetBedNumber}
                    onChange={(e) => setTargetBedNumber(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Transfer Effective Date</Label>
                  <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>New Monthly Rent (Optional)</Label>
                  <Input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>New Security Deposit (Optional)</Label>
                <Input
                  type="number"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="transferDeposit"
                  checked={transferDeposit}
                  onCheckedChange={(c) => setTransferDeposit(Boolean(c))}
                />
                <Label htmlFor="transferDeposit" className="text-xs font-medium text-[var(--gray-700)] cursor-pointer">
                  Transfer existing paid Security Deposit to new stay
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label>Relocation Reason / Remarks</Label>
                <Textarea
                  value={moveRemarks}
                  onChange={(e) => setMoveRemarks(e.target.value)}
                  placeholder="e.g. Relocating to larger room on 2nd floor"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setMoveModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmMove}
                disabled={moveMutation.isPending || !selectedTenantForMove || !targetRoomId}
              >
                {moveMutation.isPending ? "Relocating..." : "Confirm Tenant Relocation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: VACATE / MOVE-OUT TENANT MODAL */}
        <Dialog open={vacateModalOpen} onOpenChange={setVacateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-[#B42318]">
                <UserMinus className="h-5 w-5" /> Vacate & Check Out Tenant
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Release bed allocation and complete stay for{" "}
                <strong className="text-[var(--gray-900)]">
                  {selectedTenantForVacate ? tenantDisplayName(selectedTenantForVacate) : "tenant"}
                </strong>. All transaction history remains preserved.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Move Out Date</Label>
                <Input
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Checkout Reason (Optional)</Label>
                <Textarea
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  placeholder="e.g. Job transfer, completed college exams"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" size="sm" onClick={() => setVacateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirmVacate}
                disabled={moveOutMutation.isPending}
              >
                {moveOutMutation.isPending ? "Processing..." : "Confirm Move-Out & Free Bed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: INITIATE NOTICE PERIOD DIALOG */}
        <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-amber-700">
                <Clock className="h-5 w-5 text-amber-600" /> Initiate Notice Period
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Mark <strong className="text-[var(--gray-900)]">{selectedTenantForNotice ? tenantDisplayName(selectedTenantForNotice) : "tenant"}</strong> as vacating. Status will change to <span className="font-semibold text-amber-700">On notice</span>.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Scheduled Move-Out Date *</Label>
                <Input
                  type="date"
                  value={noticeMoveOutDate}
                  onChange={(e) => setNoticeMoveOutDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notice Reason / Notes</Label>
                <Input
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  placeholder="e.g. Relocating to another city"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" size="sm" onClick={() => setNoticeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSetNotice}
                disabled={setNoticeMutation.isPending || !noticeMoveOutDate}
              >
                {setNoticeMutation.isPending ? "Setting Notice..." : "Initiate Notice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: CANCEL NOTICE DIALOG */}
        <Dialog open={cancelNoticeAlertOpen} onOpenChange={setCancelNoticeAlertOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-[var(--gray-900)]">
                Cancel Notice Period
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Are you sure you want to cancel the move-out notice for <strong className="text-[var(--gray-900)]">{selectedTenantForCancelNotice ? tenantDisplayName(selectedTenantForCancelNotice) : "tenant"}</strong>?
              </p>
            </DialogHeader>

            <div className="py-2 text-xs text-[var(--gray-600)]">
              This will restore the tenant to Active stay status and remove the scheduled vacating deadline.
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" size="sm" onClick={() => setCancelNoticeAlertOpen(false)}>
                Keep Notice
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCancelNotice}
                disabled={cancelNoticeMutation.isPending}
              >
                {cancelNoticeMutation.isPending ? "Cancelling..." : "Confirm Cancel Notice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TrialExpiredGateModal
          open={trialExpiredOpen}
          onOpenChange={setTrialExpiredOpen}
          featureName={trialExpiredFeature}
        />
      </div>
    </CanAccessPage>
  );
};

export default Tenants;
