import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  Plus,
  AlertCircle,
  Edit2,
  ExternalLink,
  Loader2,
  XCircle,
  UserMinus,
  Building2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  usePropertyTenants,
  useSetTenantNoticeMutation,
  useClearTenantNoticeMutation,
  useMoveOutTenantMutation,
  queryKeys,
} from "@/hooks/usePropertyOwnerQueries";
import { FeatureGuard } from "@/components/common/FeatureGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { PropertyTenant } from "@/api/propertyOwner";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
import { formatINR, formatDate } from "@/lib/formatters";

export default function NoticePeriodPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedPgId, properties } = useApp();
  const currentPropertyId = selectedPgId;
  const currentProperty = properties.find((p) => p.id === selectedPgId);

  // Queries & Mutations
  const { data: tenants = [], isLoading, refetch } = usePropertyTenants(currentPropertyId);
  const setNoticeMut = useSetTenantNoticeMutation(currentPropertyId);
  const clearNoticeMut = useClearTenantNoticeMutation(currentPropertyId);
  const moveOutMut = useMoveOutTenantMutation(currentPropertyId);

  // Filter States
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "urgent">("active");

  // Modal States
  const [initiateModalOpen, setInitiateModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [moveOutModalOpen, setMoveOutModalOpen] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split("T")[0]);
  const [moveOutReason, setMoveOutReason] = useState("Notice period completed");
  const [moveOutRemarks, setMoveOutRemarks] = useState("");

  // Selected Tenant for Actions
  const [selectedTenant, setSelectedTenant] = useState<PropertyTenant | null>(null);

  // Initiate Form
  const [initiateForm, setInitiateForm] = useState({
    tenantId: "",
    noticeGivenAt: new Date().toISOString().split("T")[0],
    expectedMoveOutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "Standard 30-day notice",
  });

  // Extend / Edit Form
  const [extendForm, setExtendForm] = useState({
    expectedMoveOutDate: "",
    reason: "Notice date extension requested",
  });

  // Calculate helpers for notice metrics
  const tenantsWithNoticeStatus = useMemo(() => {
    return tenants.map((t) => {
      const roomTenantId = t.roomTenantId || t.roomTenant?.id || t.id;
      const noticeStartedAt = t.notice?.noticeStartedAt || t.noticeGivenAt;
      const vacateOn = t.notice?.vacateOn || t.expectedMoveOutDate;
      const isOnNotice = Boolean(
        t.isOnNotice ||
        t.notice?.isOnNotice ||
        t.noticeGivenAt ||
        t.expectedMoveOutDate ||
        (t as any).currentStay?.notice?.isOnNotice
      );

      let daysRemaining: number | null = null;
      if (vacateOn) {
        const vDate = new Date(vacateOn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        vDate.setHours(0, 0, 0, 0);
        daysRemaining = Math.ceil((vDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...t,
        computedRoomTenantId: roomTenantId,
        computedIsOnNotice: isOnNotice,
        computedNoticeStartedAt: noticeStartedAt,
        computedVacateOn: vacateOn,
        computedDaysRemaining: daysRemaining,
      };
    });
  }, [tenants]);

  // Filtered List
  const filteredTenants = useMemo(() => {
    return tenantsWithNoticeStatus.filter((t) => {
      // Tab filter
      if (activeTab === "active" && !t.computedIsOnNotice) return false;
      if (
        activeTab === "urgent" &&
        (!t.computedIsOnNotice || t.computedDaysRemaining === null || t.computedDaysRemaining > 7)
      ) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const name = (t.name || "").toLowerCase();
        const phone = (t.phone || t.mobileNumber || "").toLowerCase();
        const room = (t.roomNumber || t.roomNo || t.room?.roomNumber || "").toLowerCase();
        return name.includes(query) || phone.includes(query) || room.includes(query);
      }

      return true;
    });
  }, [tenantsWithNoticeStatus, activeTab, search]);

  // Metrics
  const activeNoticeCount = useMemo(
    () => tenantsWithNoticeStatus.filter((t) => t.computedIsOnNotice).length,
    [tenantsWithNoticeStatus]
  );

  const urgentCount = useMemo(
    () =>
      tenantsWithNoticeStatus.filter(
        (t) =>
          t.computedIsOnNotice &&
          t.computedDaysRemaining !== null &&
          t.computedDaysRemaining <= 7 &&
          t.computedDaysRemaining >= 0
      ).length,
    [tenantsWithNoticeStatus]
  );

  const leavingThisMonthCount = useMemo(
    () =>
      tenantsWithNoticeStatus.filter(
        (t) =>
          t.computedIsOnNotice &&
          t.computedDaysRemaining !== null &&
          t.computedDaysRemaining <= 30 &&
          t.computedDaysRemaining >= 0
      ).length,
    [tenantsWithNoticeStatus]
  );

  // Handlers
  const handleInitiateNotice = async () => {
    if (!initiateForm.tenantId) {
      toast({ title: "Please select a tenant", variant: "destructive" });
      return;
    }
    const targetTenant = tenantsWithNoticeStatus.find((t) => t.id === initiateForm.tenantId);
    if (!targetTenant) {
      toast({ title: "Tenant not found", variant: "destructive" });
      return;
    }
    const roomTenantId = targetTenant.computedRoomTenantId;
    if (!roomTenantId) {
      toast({ title: "Room assignment not found for this tenant", variant: "destructive" });
      return;
    }

    try {
      await setNoticeMut.mutateAsync({
        roomTenantId,
        body: {
          noticeGivenAt: initiateForm.noticeGivenAt,
          expectedMoveOutDate: initiateForm.expectedMoveOutDate,
          reason: initiateForm.reason,
        },
      });

      toast({
        title: "Notice Period Initiated",
        description: `Move-out scheduled for ${targetTenant.name} on ${initiateForm.expectedMoveOutDate}.`,
      });

      setInitiateModalOpen(false);
      setInitiateForm({
        tenantId: "",
        noticeGivenAt: new Date().toISOString().split("T")[0],
        expectedMoveOutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        reason: "Standard 30-day notice",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      refetch();
    } catch (e: any) {
      toast({
        title: "Failed to initiate notice",
        description: e?.message || "Please verify the date inputs",
        variant: "destructive",
      });
    }
  };

  const handleOpenExtendModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setExtendForm({
      expectedMoveOutDate:
        tenant.computedVacateOn ||
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      reason: "Vacate date extended",
    });
    setExtendModalOpen(true);
  };

  const handleUpdateNoticeDate = async () => {
    if (!selectedTenant) return;
    const roomTenantId = (selectedTenant as any).computedRoomTenantId;
    if (!roomTenantId) return;

    try {
      await setNoticeMut.mutateAsync({
        roomTenantId,
        body: {
          noticeGivenAt: (selectedTenant as any).computedNoticeStartedAt || new Date().toISOString().split("T")[0],
          expectedMoveOutDate: extendForm.expectedMoveOutDate,
          reason: extendForm.reason,
        },
      });

      toast({
        title: "Move-Out Date Updated",
        description: `New scheduled vacate date is ${extendForm.expectedMoveOutDate}.`,
      });

      setExtendModalOpen(false);
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      refetch();
    } catch (e: any) {
      toast({
        title: "Failed to update date",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenCancelAlert = (tenant: any) => {
    setSelectedTenant(tenant);
    setCancelAlertOpen(true);
  };

  const handleOpenMoveOutModal = (tenant: PropertyTenant) => {
    setSelectedTenant(tenant);
    setMoveOutDate(new Date().toISOString().split("T")[0]);
    setMoveOutReason("Notice period completed");
    setMoveOutRemarks("");
    setMoveOutModalOpen(true);
  };

  const handleConfirmMoveOut = async () => {
    if (!selectedTenant) return;
    const roomTenantId = (selectedTenant as any).computedRoomTenantId;
    if (!roomTenantId) return;

    try {
      await moveOutMut.mutateAsync({
        roomTenantId,
        body: {
          moveOutDate: moveOutDate || new Date().toISOString().split("T")[0],
          reason: moveOutReason.trim() || "Notice period completed",
          remarks: moveOutRemarks.trim() || undefined,
        },
      });
      toast({
        title: "Tenant Move-Out Completed",
        description: `${selectedTenant.name} has moved out. The bed is now freed and recurring rent invoicing is halted.`,
      });
      setMoveOutModalOpen(false);
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      refetch();
    } catch (e: any) {
      toast({
        title: "Failed to complete move-out",
        description: e?.message || "Unable to process move-out",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancelNotice = async () => {
    if (!selectedTenant) return;
    const roomTenantId = (selectedTenant as any).computedRoomTenantId;
    if (!roomTenantId) return;

    try {
      await clearNoticeMut.mutateAsync(roomTenantId);
      toast({
        title: "Notice Period Cancelled",
        description: `${selectedTenant.name} is now restored to regular active stay.`,
      });
      setCancelAlertOpen(false);
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants(currentPropertyId) });
      refetch();
    } catch (e: any) {
      toast({
        title: "Failed to cancel notice",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <FeatureGuard
      feature="notice_period_tracker"
      fallbackTitle="Notice Period is Locked"
      fallbackDescription="Notice Period Tracking is a premium capability not currently enabled on your subscription plan. Please enable it in the Admin Panel or upgrade your plan to unlock."
    >
      <div className="space-y-6">
        {/* Top Header */}
        <PageHeader
          title="Notice Period"
          description={`Track move-out notices, checkout timelines, and plan upcoming bed turnover for ${currentProperty?.name || "your PG"}.`}
          action={
            <Button
              onClick={() => setInitiateModalOpen(true)}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Record move-out notice
            </Button>
          }
        />

        {!currentPropertyId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to track notices."
            />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricDisplay
                label="Active Notices"
                value={activeNoticeCount}
                hint="Tenants serving checkout notice"
                tone={activeNoticeCount > 0 ? "warning" : "neutral"}
              />
              <MetricDisplay
                label="Leaving Soon"
                value={urgentCount}
                hint="Vacating within 7 days"
                tone={urgentCount > 0 ? "error" : "neutral"}
              />
              <MetricDisplay
                label="Vacating This Month"
                value={leavingThisMonthCount}
                hint="Beds freeing within 30 days"
                tone="neutral"
              />
              <MetricDisplay
                label="Total Residents"
                value={tenants.length}
                hint="Active occupants in PG"
                tone="neutral"
              />
            </div>

            {/* Main Notice List Card */}
            <div className="bg-white rounded-md border border-[var(--gray-200)] space-y-4 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "active"
                        ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                        : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                    }`}
                  >
                    Active notices ({activeNoticeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("urgent")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "urgent"
                        ? "bg-[#FEF1F0] text-[#B42318] font-semibold"
                        : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                    }`}
                  >
                    Urgent ≤ 7 days ({urgentCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "all"
                        ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                        : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
                    }`}
                  >
                    All residents ({tenants.length})
                  </button>
                </div>

                {/* Search Box */}
                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search name, room, phone..."
                    value={search}
                    onChange={setSearch}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-sm text-[var(--gray-500)]">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
                  Loading notice records...
                </div>
              ) : filteredTenants.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-10 w-10 text-[var(--gray-400)]" />}
                  title={
                    activeTab === "active"
                      ? "No tenants currently on notice"
                      : activeTab === "urgent"
                      ? "No urgent move-outs in the next 7 days"
                      : "No matching residents found"
                  }
                  description={
                    activeTab === "active"
                      ? "When a tenant gives notice to vacate, record it here to track checkout dates and plan bed turnover."
                      : "Try changing the tab or clearing the search query."
                  }
                  action={
                    activeTab === "active" ? (
                      <Button
                        size="sm"
                        onClick={() => setInitiateModalOpen(true)}
                        className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Record move-out notice
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                  <Table>
                    <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2.5 px-3">Tenant</TableHead>
                        <TableHead className="py-2.5 px-3">Room & Bed</TableHead>
                        <TableHead className="py-2.5 px-3">Notice Served</TableHead>
                        <TableHead className="py-2.5 px-3">Scheduled Move-Out</TableHead>
                        <TableHead className="py-2.5 px-3">Timeline</TableHead>
                        <TableHead className="py-2.5 px-3">Rent / Deposit</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenants.map((t) => {
                        const roomNumber = t.roomNumber || t.roomNo || t.room?.roomNumber || "—";
                        const bedNumber = t.bedNo || t.bed?.bedNumber || "Bed 1";
                        const noticeDate = t.computedNoticeStartedAt
                          ? formatDate(t.computedNoticeStartedAt)
                          : "—";

                        const vacateDate = t.computedVacateOn
                          ? formatDate(t.computedVacateOn)
                          : "—";

                        const daysLeft = t.computedDaysRemaining;

                        return (
                          <TableRow key={t.id} className="hover:bg-[var(--gray-50)] transition-colors">
                            {/* Tenant Column */}
                            <TableCell className="py-2.5 px-3 whitespace-nowrap">
                              <div>
                                <div
                                  className="text-sm font-medium text-[var(--gray-900)] hover:text-[var(--brand-600)] cursor-pointer flex items-center gap-1"
                                  onClick={() => navigate(`/tenants/${t.id}`)}
                                >
                                  {t.name}
                                  <ExternalLink className="h-3 w-3 text-[var(--gray-400)]" />
                                </div>
                                <div className="text-xs text-[var(--gray-500)]">
                                  {t.phone || t.mobileNumber}
                                </div>
                              </div>
                            </TableCell>

                            {/* Room & Bed */}
                            <TableCell className="py-2.5 px-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-[var(--gray-900)]">
                                Room {roomNumber}
                              </div>
                              <div className="text-xs text-[var(--gray-500)]">
                                {bedNumber} {t.floor ? `· ${t.floor}` : ""}
                              </div>
                            </TableCell>

                            {/* Notice Served Date */}
                            <TableCell className="py-2.5 px-3 text-xs text-[var(--gray-600)] tabular-nums whitespace-nowrap">
                              {noticeDate}
                            </TableCell>

                            {/* Scheduled Move Out */}
                            <TableCell className="py-2.5 px-3 text-xs tabular-nums whitespace-nowrap">
                              {t.computedVacateOn ? (
                                <span className="font-semibold text-[var(--gray-900)]">
                                  {vacateDate}
                                </span>
                              ) : (
                                <span className="text-[var(--gray-400)] italic">Not set</span>
                              )}
                            </TableCell>

                            {/* Timeline / Status */}
                            <TableCell className="py-2.5 px-3 whitespace-nowrap">
                              {!t.computedIsOnNotice ? (
                                <StatusBadge label="Active stay" tone="neutral" size="sm" />
                              ) : daysLeft !== null ? (
                                daysLeft < 0 ? (
                                  <StatusBadge
                                    label={`Overdue (${Math.abs(daysLeft)}d passed)`}
                                    tone="error"
                                    size="sm"
                                  />
                                ) : daysLeft === 0 ? (
                                  <StatusBadge label="Vacating today" tone="error" size="sm" />
                                ) : daysLeft <= 3 ? (
                                  <StatusBadge
                                    label={`${daysLeft} days left`}
                                    tone="error"
                                    size="sm"
                                  />
                                ) : daysLeft <= 7 ? (
                                  <StatusBadge
                                    label={`${daysLeft} days left`}
                                    tone="warning"
                                    size="sm"
                                  />
                                ) : (
                                  <StatusBadge
                                    label={`${daysLeft} days left`}
                                    tone="info"
                                    size="sm"
                                  />
                                )
                              ) : (
                                <StatusBadge label="On notice" tone="warning" size="sm" />
                              )}
                            </TableCell>

                            {/* Rent & Deposit */}
                            <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap tabular-nums">
                              <div className="font-medium text-[var(--gray-900)]">
                                {formatINR(Number(t.monthlyRent || 0))}/mo
                              </div>
                              <div className="text-[11px] text-[var(--gray-500)]">
                                Deposit: {formatINR(Number(t.securityDeposit || 0))}
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {t.computedIsOnNotice ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2.5 text-[#B42318] border-[#F6C7C2] hover:bg-[#FEF1F0]"
                                      onClick={() => handleOpenMoveOutModal(t)}
                                    >
                                      Move out
                                    </Button>
                                    <ActionMenu
                                      items={[
                                        {
                                          label: "Extend date",
                                          icon: <Edit2 className="h-4 w-4" />,
                                          onClick: () => handleOpenExtendModal(t),
                                        },
                                        {
                                          label: "Cancel notice",
                                          icon: <XCircle className="h-4 w-4 text-[#B42318]" />,
                                          onClick: () => handleOpenCancelAlert(t),
                                        },
                                        {
                                          label: "View profile",
                                          icon: <ExternalLink className="h-4 w-4" />,
                                          onClick: () => navigate(`/tenants/${t.id}`),
                                        },
                                      ]}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2.5 border-[var(--gray-300)]"
                                      onClick={() => {
                                        setInitiateForm((prev) => ({
                                          ...prev,
                                          tenantId: t.id,
                                        }));
                                        setInitiateModalOpen(true);
                                      }}
                                    >
                                      Record notice
                                    </Button>
                                    <ActionMenu
                                      items={[
                                        {
                                          label: "View profile",
                                          icon: <ExternalLink className="h-4 w-4" />,
                                          onClick: () => navigate(`/tenants/${t.id}`),
                                        },
                                      ]}
                                    />
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        {/* DIALOG 1: RECORD MOVE-OUT NOTICE */}
        <Dialog open={initiateModalOpen} onOpenChange={setInitiateModalOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--brand-600)]" /> Record Move-Out Notice
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Schedule checkout for a tenant serving notice. This will update room availability timelines.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Select Tenant <span className="text-[#B42318]">*</span>
                </Label>
                <Select
                  value={initiateForm.tenantId}
                  onValueChange={(val) => setInitiateForm({ ...initiateForm, tenantId: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose resident..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {tenants.map((t) => {
                      const room = t.roomNumber || t.roomNo || t.room?.roomNumber || "";
                      return (
                        <SelectItem key={t.id} value={t.id} className="text-sm">
                          {t.name} (Room {room || "—"}) · {t.phone}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">
                    Notice Given Date
                  </Label>
                  <Input
                    type="date"
                    value={initiateForm.noticeGivenAt}
                    onChange={(e) => setInitiateForm({ ...initiateForm, noticeGivenAt: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">
                    Expected Vacate Date
                  </Label>
                  <Input
                    type="date"
                    value={initiateForm.expectedMoveOutDate}
                    onChange={(e) => setInitiateForm({ ...initiateForm, expectedMoveOutDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Reason / Move-out Notes
                </Label>
                <Input
                  placeholder="e.g. Job transfer, relocation, personal reasons"
                  value={initiateForm.reason}
                  onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInitiateModalOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                disabled={setNoticeMut.isPending}
                onClick={handleInitiateNotice}
              >
                {setNoticeMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                Confirm Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: EXTEND / UPDATE MOVE-OUT DATE */}
        <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--brand-600)]" /> Extend Scheduled Move-Out
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Update the expected checkout date for{" "}
                <span className="font-semibold text-[var(--gray-900)]">{selectedTenant?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  New Scheduled Vacate Date
                </Label>
                <Input
                  type="date"
                  value={extendForm.expectedMoveOutDate}
                  onChange={(e) => setExtendForm({ ...extendForm, expectedMoveOutDate: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Reason for Extension
                </Label>
                <Input
                  placeholder="e.g. Extended stay approved for 15 days"
                  value={extendForm.reason}
                  onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtendModalOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                disabled={setNoticeMut.isPending}
                onClick={handleUpdateNoticeDate}
              >
                {setNoticeMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                Save New Date
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ALERT DIALOG: CANCEL NOTICE PERIOD */}
        <AlertDialog open={cancelAlertOpen} onOpenChange={setCancelAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Move-Out Notice?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel the move-out notice for{" "}
                <span className="font-semibold text-foreground">{selectedTenant?.name}</span>?
                Their status will be restored to regular active residency, and room availability will be marked occupied.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Notice</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#B42318] hover:bg-[#912018] text-white"
                onClick={handleConfirmCancelNotice}
              >
                Confirm Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* MODAL: COMPLETE MOVE-OUT */}
        <Dialog open={moveOutModalOpen} onOpenChange={setMoveOutModalOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[#B42318] flex items-center gap-2">
                <UserMinus className="h-5 w-5" /> Complete Move-Out & Free Bed
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Finalize departure for <strong className="text-[var(--gray-900)]">{selectedTenant?.name}</strong>. This will free the allocated bed and halt recurring rent generation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">Actual Move-Out Date *</Label>
                <Input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">Departure Reason</Label>
                <Input
                  value={moveOutReason}
                  onChange={(e) => setMoveOutReason(e.target.value)}
                  placeholder="e.g. Completed 30-day notice, relocated"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">Remarks (optional)</Label>
                <Input
                  value={moveOutRemarks}
                  onChange={(e) => setMoveOutRemarks(e.target.value)}
                  placeholder="e.g. Keys returned, security deposit settled"
                  className="h-9 text-sm"
                />
              </div>

              <div className="p-3 bg-[var(--gray-50)] rounded-md border border-[var(--gray-200)] text-xs text-[var(--gray-600)] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[var(--warning)] mt-0.5" />
                <span>
                  Moving out frees the bed for new check-ins and stops automatic rent invoicing.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoveOutModalOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#B42318] hover:bg-[#912018] text-white"
                onClick={handleConfirmMoveOut}
                disabled={moveOutMut.isPending}
              >
                {moveOutMut.isPending ? "Processing..." : "Confirm Move-Out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGuard>
  );
}
