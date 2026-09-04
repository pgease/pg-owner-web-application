import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  User,
  Plus,
  Search,
  AlertCircle,
  Edit2,
  ExternalLink,
  Loader2,
  BedDouble,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  usePropertyTenants,
  useSetTenantNoticeMutation,
  useClearTenantNoticeMutation,
  queryKeys,
} from "@/hooks/usePropertyOwnerQueries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  // Filter States
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "urgent">("active");

  // Modal States
  const [initiateModalOpen, setInitiateModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);

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
        title: "Notice Period Initiated 🚪",
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
        title: "Move-Out Date Updated 📅",
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-amber-500" /> Notice Period Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track move-out notices, monitor checkout timelines, and plan upcoming bed availability for{" "}
            <span className="font-semibold text-foreground">
              {currentProperty?.name || "current PG"}
            </span>
            .
          </p>
        </div>
        <Button
          onClick={() => setInitiateModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Record Move-Out Notice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Active Notices
              <Clock className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {activeNoticeCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Tenants currently serving checkout notices
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-rose-500/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Leaving Soon (≤ 7 Days)
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {urgentCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Urgent move-outs requiring checkout inspection
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-teal-500/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Vacating This Month
              <Calendar className="h-4 w-4 text-teal-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-black text-teal-600 dark:text-teal-400">
              {leavingThisMonthCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Beds ready for new tenant onboarding
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total Property Residents
              <User className="h-4 w-4 text-indigo-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-black text-foreground">
              {tenants.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Active occupancies in {currentProperty?.name || "PG"}
          </CardContent>
        </Card>
      </div>

      {/* Main Notice List Card */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b bg-muted/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "active"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active Notices ({activeNoticeCount})
              </button>
              <button
                onClick={() => setActiveTab("urgent")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "urgent"
                    ? "bg-background text-foreground shadow-sm text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Urgent ≤ 7 Days ({urgentCount})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Residents ({tenants.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, room, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
              <p className="text-xs text-muted-foreground">Loading notice period records...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {activeTab === "active"
                    ? "No tenants currently on notice"
                    : activeTab === "urgent"
                    ? "No urgent move-outs in the next 7 days"
                    : "No matching residents found"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {activeTab === "active"
                    ? "When a tenant submits their move-out intention, record it here to track checkout dates and manage turnover."
                    : "Try broadening your search or switching to another filter."}
                </p>
              </div>
              {activeTab === "active" && (
                <Button
                  size="sm"
                  onClick={() => setInitiateModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-8 mt-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Record Move-Out Notice
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="py-3 px-4">Tenant</TableHead>
                    <TableHead className="py-3 px-4">Room & Bed</TableHead>
                    <TableHead className="py-3 px-4">Notice Served Date</TableHead>
                    <TableHead className="py-3 px-4">Scheduled Move-Out</TableHead>
                    <TableHead className="py-3 px-4">Timeline / Status</TableHead>
                    <TableHead className="py-3 px-4">Rent & Deposit</TableHead>
                    <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((t) => {
                    const roomNumber = t.roomNumber || t.roomNo || t.room?.roomNumber || "—";
                    const bedNumber = t.bedNo || t.bed?.bedNumber || "Bed 1";
                    const noticeDate = t.computedNoticeStartedAt
                      ? new Date(t.computedNoticeStartedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    const vacateDate = t.computedVacateOn
                      ? new Date(t.computedVacateOn).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    const daysLeft = t.computedDaysRemaining;

                    return (
                      <TableRow key={t.id} className="hover:bg-muted/10 transition-colors">
                        {/* Tenant Column */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-500/20">
                              {(t.name || "T")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div
                                className="text-xs font-bold text-foreground hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
                                onClick={() => navigate(`/tenants/${t.id}`)}
                              >
                                {t.name}
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {t.phone || t.mobileNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Room & Bed */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-xs font-semibold text-foreground">
                                Room {roomNumber}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                {bedNumber} {t.floor ? `• ${t.floor}` : ""}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Notice Served Date */}
                        <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="font-medium text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                            {noticeDate}
                          </div>
                        </TableCell>

                        {/* Scheduled Move Out */}
                        <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap">
                          {t.computedVacateOn ? (
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              {vacateDate}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Not Set</span>
                          )}
                        </TableCell>

                        {/* Timeline / Status */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          {!t.computedIsOnNotice ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Active Residency
                            </Badge>
                          ) : daysLeft !== null ? (
                            daysLeft < 0 ? (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Overdue ({Math.abs(daysLeft)}d passed)
                              </Badge>
                            ) : daysLeft === 0 ? (
                              <Badge className="bg-rose-600 text-white text-[10px] gap-1 animate-pulse">
                                <AlertCircle className="h-3 w-3" />
                                Vacating Today!
                              </Badge>
                            ) : daysLeft <= 3 ? (
                              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 text-[10px] gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {daysLeft} Days Left
                              </Badge>
                            ) : daysLeft <= 7 ? (
                              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 text-[10px] gap-1">
                                <Clock className="h-3 w-3" />
                                {daysLeft} Days Left
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-teal-700 dark:text-teal-400 border-teal-300 text-[10px] gap-1">
                                <Calendar className="h-3 w-3" />
                                {daysLeft} Days Left
                              </Badge>
                            )
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                              On Notice
                            </Badge>
                          )}
                        </TableCell>

                        {/* Rent & Deposit */}
                        <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="font-semibold text-foreground">
                            ₹{Number(t.monthlyRent || 0).toLocaleString("en-IN")}/mo
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Deposit: ₹{Number(t.securityDeposit || 0).toLocaleString("en-IN")}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.computedIsOnNotice ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1"
                                  onClick={() => handleOpenExtendModal(t)}
                                >
                                  <Edit2 className="h-3 w-3" /> Extend Date
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
                                  onClick={() => handleOpenCancelAlert(t)}
                                >
                                  <XCircle className="h-3 w-3" /> Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                                onClick={() => {
                                  setInitiateForm((prev) => ({
                                    ...prev,
                                    tenantId: t.id,
                                  }));
                                  setInitiateModalOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3" /> Set Notice
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => navigate(`/tenants/${t.id}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG 1: RECORD MOVE-OUT NOTICE */}
      <Dialog open={initiateModalOpen} onOpenChange={setInitiateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Record Move-Out Notice
            </DialogTitle>
            <DialogDescription>
              Schedule checkout for a tenant serving notice. This will update room availability timelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Select Tenant</Label>
              <Select
                value={initiateForm.tenantId}
                onValueChange={(val) => setInitiateForm({ ...initiateForm, tenantId: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose resident..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {tenants.map((t) => {
                    const room = t.roomNumber || t.roomNo || t.room?.roomNumber || "";
                    return (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} (Room {room || "—"}) • {t.phone}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Notice Given Date</Label>
                <Input
                  type="date"
                  value={initiateForm.noticeGivenAt}
                  onChange={(e) => setInitiateForm({ ...initiateForm, noticeGivenAt: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Expected Vacate Date</Label>
                <Input
                  type="date"
                  value={initiateForm.expectedMoveOutDate}
                  onChange={(e) => setInitiateForm({ ...initiateForm, expectedMoveOutDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Reason / Move-out Notes</Label>
              <Input
                placeholder="e.g. Job transfer, relocation, personal reasons"
                value={initiateForm.reason}
                onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" /> Extend Scheduled Move-Out
            </DialogTitle>
            <DialogDescription>
              Update the expected checkout date for{" "}
              <span className="font-semibold text-foreground">{selectedTenant?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>New Scheduled Vacate Date</Label>
              <Input
                type="date"
                value={extendForm.expectedMoveOutDate}
                onChange={(e) => setExtendForm({ ...extendForm, expectedMoveOutDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Reason for Extension</Label>
              <Input
                placeholder="e.g. Extended stay approved for 15 days"
                value={extendForm.reason}
                onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
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
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmCancelNotice}
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
