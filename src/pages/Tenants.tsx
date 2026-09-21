import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Building2,
  DoorOpen,
  BedDouble,
  Loader2,
  Users,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  ExternalLink,
  Phone,
  MessageCircle,
  ArrowRightLeft,
  Layers,
  UserMinus,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { FilterBar } from "@/components/common/FilterBar";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";
import {
  tenantDisplayName,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantBlock,
  tenantFloor,
  tenantBedNo,
  tenantStayStatus,
  tenantStatusDisplay,
  tenantCode,
} from "@/lib/tenantDisplay";
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

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "rose" | "amber" | "violet" | "slate";
}) {
  const tones = {
    blue: "text-sky-600 dark:text-sky-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    slate: "text-slate-600 dark:text-slate-400",
  };
  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <Icon className={cn("h-8 w-8 shrink-0 opacity-90", tones[tone])} />
      </CardContent>
    </Card>
  );
}

const Tenants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "verified" | "pending">("all");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"block" | "floor" | "none">("none");

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

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "notice" | "moved_out">("all");

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
        title: "Tenant Relocated Successfully! 🚚",
        description: `${tenantDisplayName(selectedTenantForMove)} moved to room successfully.`,
      });
      setMoveModalOpen(false);
      setSelectedTenantForMove(null);
    } catch (e: any) {
      toast({ title: "Could not move tenant", description: e?.message, variant: "destructive" });
    }
  };

  const handleOpenVacateModal = (tenant: PropertyTenant) => {
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
        title: "Tenant Move-Out Completed 🚪",
        description: `${tenantDisplayName(selectedTenantForVacate)} has moved out. The bed is now free and recurring rent invoicing is halted.`,
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
        title: "Notice Period Initiated 📅",
        description: `${tenantDisplayName(selectedTenantForNotice)} is now on notice (scheduled to vacate ${noticeMoveOutDate}).`,
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
        title: "Notice Cancelled Successfully",
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
  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";
  const roomsQuery = useRoomsList(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined, {
    requireBlockAndFloor: false,
  });
  const rooms = roomsQuery.data ?? [];

  // All rooms in current PG for the filter dropdown
  const allPropertyRoomsQuery = useRoomsList(selectedPgId, undefined, undefined, { requireBlockAndFloor: false });
  const allPropertyRooms = allPropertyRoomsQuery.data ?? [];

  const isVacantRoomsPage = location.pathname === "/tenants/vacant-rooms";
  const tenantsQuery = usePropertyTenants(isVacantRoomsPage ? null : selectedPgId);

  const searchFilteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => String(r.roomNumber).toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  const filteredRooms = useMemo(() => {
    if (!isVacantRoomsPage) return searchFilteredRooms;
    return searchFilteredRooms.filter(roomHasVacancyForAllocation);
  }, [isVacantRoomsPage, searchFilteredRooms]);

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

  const groupedByBlockTenants = useMemo(() => {
    const map = new Map<
      string,
      {
        blockName: string;
        displayOrder: number;
        floors: Map<string, { floorName: string; displayOrder: number; tenants: PropertyTenant[] }>;
      }
    >();

    for (const t of filteredTenants) {
      const roomId = t.room?.id || (t as any).roomId || t.roomTenant?.roomId;
      const roomObj = allPropertyRooms.find((r) => r.id === roomId);

      const bKey = t.block?.id || roomObj?.blockId || (roomId ? "main-block" : "unassigned");
      const bName = t.block?.name || roomObj?.block || blocks.find((b) => b.id === (roomObj?.blockId || t.block?.id))?.name || (roomId ? "Main Building" : "Unassigned");
      const bOrder = t.block?.displayOrder ?? 999;

      if (!map.has(bKey)) {
        map.set(bKey, { blockName: bName, displayOrder: bOrder, floors: new Map() });
      }
      const bObj = map.get(bKey)!;

      const fKey = t.floor?.id || roomObj?.floorId || (roomId ? "main-floor" : "unassigned");
      const fName = t.floor?.name || roomObj?.floor || floors.find((f) => f.id === (roomObj?.floorId || t.floor?.id))?.name || (roomId ? "Ground Floor" : "Unassigned");
      const fOrder = t.floor?.displayOrder ?? 999;

      if (!bObj.floors.has(fKey)) {
        bObj.floors.set(fKey, { floorName: fName, displayOrder: fOrder, tenants: [] });
      }
      bObj.floors.get(fKey)!.tenants.push(t);
    }

    return Array.from(map.entries())
      .map(([blockId, b]) => ({
        blockId,
        blockName: b.blockName,
        displayOrder: b.displayOrder,
        totalTenants: Array.from(b.floors.values()).reduce((sum, f) => sum + f.tenants.length, 0),
        floors: Array.from(b.floors.entries())
          .map(([floorId, f]) => ({
            floorId,
            floorName: f.floorName,
            displayOrder: f.displayOrder,
            tenants: f.tenants,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder || a.floorName.localeCompare(b.floorName)),
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.blockName.localeCompare(b.blockName));
  }, [filteredTenants, allPropertyRooms, blocks, floors]);

  const groupedByFloorTenants = useMemo(() => {
    const map = new Map<
      string,
      { floorName: string; blockName: string; displayOrder: number; tenants: PropertyTenant[] }
    >();

    for (const t of filteredTenants) {
      const roomId = t.room?.id || (t as any).roomId || t.roomTenant?.roomId;
      const roomObj = allPropertyRooms.find((r) => r.id === roomId);

      const fKey = t.floor?.id || roomObj?.floorId || (roomId ? "main-floor" : "unassigned");
      const fName = t.floor?.name || roomObj?.floor || floors.find((f) => f.id === (roomObj?.floorId || t.floor?.id))?.name || (roomId ? "Ground Floor" : "Unassigned");
      const bName = t.block?.name || roomObj?.block || blocks.find((b) => b.id === (roomObj?.blockId || t.block?.id))?.name || (roomId ? "Main Building" : "Unassigned");
      const fOrder = t.floor?.displayOrder ?? 999;

      if (!map.has(fKey)) {
        map.set(fKey, { floorName: fName, blockName: bName, displayOrder: fOrder, tenants: [] });
      }
      map.get(fKey)!.tenants.push(t);
    }

    return Array.from(map.entries())
      .map(([floorId, f]) => ({
        floorId,
        floorName: f.floorName,
        blockName: f.blockName,
        displayOrder: f.displayOrder,
        totalTenants: f.tenants.length,
        tenants: f.tenants,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.floorName.localeCompare(b.floorName));
  }, [filteredTenants, allPropertyRooms, blocks, floors]);

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

  const occupiedBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.occupiedBeds) || 0), 0);
  const availableBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.availableBeds) || 0), 0);
  const totalBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.numberOfBeds) || 0), 0);

  const roomsLoading = blocksQuery.isLoading || floorsQuery.isLoading || roomsQuery.isLoading;
  const roomsError = blocksQuery.isError || floorsQuery.isError || roomsQuery.isError;

  const filterBarVacant = (
    <FilterBar>
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by room number..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Select
        value={selectedPgId || "none"}
        onValueChange={(v) => {
          if (v !== "none") setSelectedPgId(v);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select PG" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled>
            Select PG
          </SelectItem>
          {list
            .filter((p) => p.id && String(p.id).trim() !== "")
            .map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select
        value={effectiveBlockId || "none"}
        onValueChange={(v) => {
          setSelectedBlockId(v);
          setSelectedFloorId("");
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Block" />
        </SelectTrigger>
        <SelectContent>
          {blocks
            .filter((b) => b.id && String(b.id).trim() !== "")
            .map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          {blocks.length === 0 && <SelectItem value="none" disabled>No blocks</SelectItem>}
        </SelectContent>
      </Select>
      <Select value={effectiveFloorId || "none"} onValueChange={setSelectedFloorId}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Floor" />
        </SelectTrigger>
        <SelectContent>
          {floors
            .filter((f) => f.id && String(f.id).trim() !== "")
            .map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          {floors.length === 0 && <SelectItem value="none" disabled>No floors</SelectItem>}
        </SelectContent>
      </Select>
    </FilterBar>
  );

  const roomsSection = (
    <>
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">{isVacantRoomsPage ? "Vacancy overview" : "Occupancy overview"}</p>
          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span>Total beds: {totalBeds}</span>
            <span>Occupied: {occupiedBeds}</span>
            <span>Available: {availableBeds}</span>
            <span>Rooms shown: {filteredRooms.length}</span>
          </div>
        </CardContent>
      </Card>

      {roomsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : roomsError ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Failed to load room data</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                blocksQuery.refetch();
                floorsQuery.refetch();
                roomsQuery.refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">{isVacantRoomsPage ? "No vacant rooms found" : "No room inventory found"}</p>
            <p className="mt-1 text-sm">
              {isVacantRoomsPage
                ? "Try another block/floor, or add rooms in Structure."
                : "Add blocks, floors, and rooms under My PGs → Structure."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((r, index) => (
            <Card
              key={r.id && String(r.id).trim() !== "" ? r.id : `room-row-${index}-${String(r.roomNumber)}`}
              className="border-border/80 shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">Room {r.roomNumber}</p>
                      <Badge variant="secondary">{r.numberOfBeds} beds</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        Block:{" "}
                        {r.block && String(r.block).trim() !== ""
                          ? String(r.block)
                          : blocks.find((b) => b.id === effectiveBlockId)?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3.5 w-3.5" />
                        Room: {r.roomNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        Available: {r.availableBeds ?? "—"}
                      </span>
                    </div>
                    <p className="mt-3 border-t border-dashed pt-3 text-sm">
                      <span className="font-medium">Occupied:</span> {r.occupiedBeds ?? 0}/{r.numberOfBeds}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/tenants/add">Add tenant</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const statusLabel = (t: PropertyTenant) => {
    if (t.notice?.isOnNotice) return "On notice";
    if (tenantVerificationLabel(t) === "verified") return "Verified";
    return "KYC pending";
  };

  const renderTenantCard = (row: PropertyTenant) => {
    const wa = row.phone ? waLink(row.phone) : null;
    const isVerified = tenantVerificationLabel(row) === "verified";
    const initial = tenantInitials(row);

    const roomId = row.room?.id || (row as any).roomId || row.roomTenant?.roomId;
    const roomObj = allPropertyRooms.find((r) => r.id === roomId);
    const roomNo = roomObj?.roomNumber || roomObj?.name || tenantRoomNo(row);
    const floorName = roomObj?.floor || floors.find((f) => f.id === (roomObj?.floorId || row.floor?.id))?.name || tenantFloor(row);
    const blockName = roomObj?.block || blocks.find((b) => b.id === (roomObj?.blockId || row.block?.id))?.name || tenantBlock(row);
    const bedNo = tenantBedNo(row);
    const tenantPhoto = (row as any).photoUrl || (row as any).imageUrl || (row as any).profilePhotoUrl;
    const statusInfo = tenantStatusDisplay(row);
    const code = tenantCode(row);

    return (
      <Card
        key={row.id}
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow duration-200 border-border/60 overflow-hidden bg-card",
          statusInfo.status === "UNDER_NOTICE" && "border-amber-300 dark:border-amber-800/60 bg-amber-500/[0.02]",
          statusInfo.status === "MOVED_OUT" && "opacity-75 bg-muted/20",
        )}
        onClick={() => navigate(`/tenants/${row.id}`)}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Details block */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Avatar className="h-12 w-12 border shrink-0">
              {tenantPhoto ? (
                <AvatarImage src={tenantPhoto} alt={tenantDisplayName(row)} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-sm font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-base text-foreground truncate">
                  {tenantDisplayName(row)}
                </h3>
                {code && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {code}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={cn("text-[10px] py-0 px-2 font-medium flex items-center gap-1", statusInfo.badgeClass)}
                >
                  {statusInfo.status === "UNDER_NOTICE" && <Clock className="h-2.5 w-2.5" />}
                  {statusInfo.label}
                </Badge>
                {isVerified ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] py-0 px-2 font-medium">
                    Aadhaar verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] py-0 px-2 font-medium">
                    Pending KYC
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-2 mt-1">
                <span className="font-semibold text-foreground">Block: {blockName}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Floor: {floorName}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Room: {roomNo}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Bed: {bedNo}</span>
              </div>
            </div>
          </div>

          {/* Middle Info block (Rent & Dues) */}
          <div className="flex items-center gap-4 text-xs shrink-0 flex-wrap md:flex-nowrap md:mx-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rent</span>
              <span className="font-bold text-sm text-foreground">{tenantRentAmount(row)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Due Status</span>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded mt-0.5">
                Rent due: {tenantRentDueLabel(row)}
              </span>
            </div>
          </div>

          {/* Right Quick actions block */}
          <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap" onClick={(e) => e.stopPropagation()}>
            {statusInfo.status === "MOVED_OUT" ? (
              <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60">
                Stay Completed
              </span>
            ) : statusInfo.status === "UNDER_NOTICE" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg border-rose-300 text-rose-600 hover:bg-rose-50 font-bold shadow-2xs"
                  onClick={() => handleOpenVacateModal(row)}
                >
                  <UserMinus className="h-3.5 w-3.5" /> Complete Move-Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-50 font-medium"
                  onClick={() => handleOpenCancelNoticeModal(row)}
                >
                  Cancel Notice
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg border-teal-600/30 text-teal-700 hover:bg-teal-50 font-bold"
                  onClick={() => handleOpenMoveModal(row)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Move
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                  onClick={() => handleOpenNoticeModal(row)}
                >
                  <Clock className="h-3.5 w-3.5" /> Notice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
                  onClick={() => handleOpenVacateModal(row)}
                >
                  <UserMinus className="h-3.5 w-3.5" /> Move Out
                </Button>
              </>
            )}
            {tenantPhone(row) !== "—" && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-teal-600/30 text-teal-600 hover:bg-teal-50" asChild>
                <a href={`tel:${phoneDigits(row.phone ?? "")}`}>
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              </Button>
            )}
            {wa && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-emerald-600/30 text-emerald-600 hover:bg-emerald-50" asChild>
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const tenantTableSection = (
    <div className="space-y-4">
      {!selectedPgId ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Select a property</p>
            <p className="mt-1 text-sm">Use the PG switcher in the top bar to load your tenant list.</p>
          </CardContent>
        </Card>
      ) : tenantsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tenantsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Could not load tenants</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => tenantsQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <p className="font-medium text-foreground">No tenants match</p>
            <p className="mt-1 text-sm">Adjust search or filters, or add a tenant.</p>
            <CanAccess permission="tenant_add">
              <Button asChild className="mt-4">
                <Link to="/tenants/add">Add tenant</Link>
              </Button>
            </CanAccess>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm font-semibold text-foreground">
              <span className="tabular-nums">{filteredTenants.length}</span> tenant{filteredTenants.length === 1 ? "" : "s"} found
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>View:</span>
              <span className="font-medium text-foreground uppercase">{groupBy === "block" ? "Grouped by Block" : groupBy === "floor" ? "Grouped by Floor" : "Flat List"}</span>
            </div>
          </div>

          {groupBy === "block" ? (
            <div className="space-y-6">
              {groupedByBlockTenants.map((block) => (
                <div key={block.blockId} className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
                  <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-teal-600" />
                      <h2 className="font-bold text-base text-foreground">{block.blockName}</h2>
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {block.totalTenants} {block.totalTenants === 1 ? "Tenant" : "Tenants"}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-5">
                    {block.floors.map((floor) => (
                      <div key={floor.floorId} className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                          <Layers className="h-3.5 w-3.5 text-emerald-600" />
                          {floor.floorName} ({floor.tenants.length})
                        </div>
                        <div className="flex flex-col gap-3">
                          {floor.tenants.map((row) => renderTenantCard(row))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groupBy === "floor" ? (
            <div className="space-y-6">
              {groupedByFloorTenants.map((floor) => (
                <div key={floor.floorId} className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
                  <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-emerald-600" />
                      <h2 className="font-bold text-base text-foreground">{floor.floorName}</h2>
                      {floor.blockName && <span className="text-xs text-muted-foreground font-normal">({floor.blockName})</span>}
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {floor.totalTenants} {floor.totalTenants === 1 ? "Tenant" : "Tenants"}
                    </Badge>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {floor.tenants.map((row) => renderTenantCard(row))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTenants.map((row) => renderTenantCard(row))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <CanAccessPage permission="tenant_view">
      <div className="space-y-6 animate-fade-in pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isVacantRoomsPage ? "Vacant rooms" : "Tenants"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isVacantRoomsPage
                ? "Rooms with free beds for quick allocation"
                : "Search, filter block/floor/room wise, and open tenant profile"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-teal-300 text-teal-700 font-bold hover:bg-teal-50 shadow-xs"
              onClick={() => handleOpenMoveModal()}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Move Tenant
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/support">
                <Megaphone className="h-4 w-4" />
                Announcements
              </Link>
            </Button>
            <CanAccess permission="tenant_add">
              <Button size="sm" className="gap-2 shadow-sm" asChild>
                <Link to="/tenants/add">
                  <Plus className="h-4 w-4" />
                  Add tenant
                </Link>
              </Button>
            </CanAccess>
          </div>
        </div>

        {isVacantRoomsPage ? (
          <>
            {filterBarVacant}
            {roomsSection}
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Total tenants" value={kpi.total} icon={Users} tone="blue" />
              <KpiCard label="KYC verified" value={kpi.verified} icon={ShieldCheck} tone="emerald" />
              <KpiCard label="On notice" value={kpi.onNotice} icon={AlertTriangle} tone="amber" />
              <KpiCard label="New (7 days)" value={kpi.recent} icon={UserPlus} tone="violet" />
            </div>

            {/* Lifecycle Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "h-8 rounded-full text-xs font-semibold gap-1.5 transition-all",
                  statusFilter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                All Tenants ({statusCounts.all})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "h-8 rounded-full text-xs font-semibold gap-1.5 transition-all",
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                )}
              >
                Active ({statusCounts.active})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "notice" ? "default" : "outline"}
                onClick={() => setStatusFilter("notice")}
                className={cn(
                  "h-8 rounded-full text-xs font-semibold gap-1.5 transition-all",
                  statusFilter === "notice"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "text-amber-700 border-amber-200 hover:bg-amber-50"
                )}
              >
                <Clock className="h-3 w-3" /> Under Notice ({statusCounts.notice})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "moved_out" ? "default" : "outline"}
                onClick={() => setStatusFilter("moved_out")}
                className={cn(
                  "h-8 rounded-full text-xs font-semibold gap-1.5 transition-all",
                  statusFilter === "moved_out"
                    ? "bg-slate-700 text-white hover:bg-slate-800"
                    : "text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Moved Out ({statusCounts.movedOut})
              </Button>
            </div>

            <FilterBar>
              <div className="relative min-w-0 flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, room…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Block Filter */}
              <Select
                value={selectedBlockId || "all"}
                onValueChange={(v) => {
                  setSelectedBlockId(v === "all" ? "" : v);
                  setSelectedFloorId("");
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="KYC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {/* Group By Mode Toggle */}
              <div className="flex bg-muted p-0.5 rounded-lg border">
                <Button
                  type="button"
                  variant={groupBy === "block" ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-2.5 text-xs font-semibold ${
                    groupBy === "block" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground"
                  }`}
                  onClick={() => setGroupBy("block")}
                >
                  By Block
                </Button>
                <Button
                  type="button"
                  variant={groupBy === "floor" ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-2.5 text-xs font-semibold ${
                    groupBy === "floor" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground"
                  }`}
                  onClick={() => setGroupBy("floor")}
                >
                  By Floor
                </Button>
                <Button
                  type="button"
                  variant={groupBy === "none" ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-2.5 text-xs font-semibold ${
                    groupBy === "none" ? "bg-teal-600 text-white shadow-xs" : "text-muted-foreground"
                  }`}
                  onClick={() => setGroupBy("none")}
                >
                  Flat
                </Button>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link to="/tenants/vacant-rooms">Vacant rooms</Link>
              </Button>
            </FilterBar>

            {tenantTableSection}
          </>
        )}

        {/* MOVE TENANT DIALOG MODAL */}
        <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <ArrowRightLeft className="h-5 w-5" /> Move / Relocate Tenant
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
                <Label htmlFor="transferDeposit" className="text-xs font-semibold text-slate-700 cursor-pointer">
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
              <Button variant="outline" onClick={() => setMoveModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
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
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-rose-600">
                <UserMinus className="h-5 w-5" /> Vacate & Check Out Tenant
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Release bed allocation and complete stay for{" "}
                <strong className="text-foreground">
                  {selectedTenantForVacate ? tenantDisplayName(selectedTenantForVacate) : "tenant"}
                </strong>. All financial transaction history and ledgers will remain safely preserved.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Move Out / Vacate Date</Label>
                <Input
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Checkout Reason / Exit Notes (Optional)</Label>
                <Textarea
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  placeholder="e.g. Job transfer, completed college exams, personal reasons"
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Vacating will immediately update the bed status to Available for new bookings, while archiving this tenant profile without deleting historical rent receipts.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setVacateModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
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
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-amber-700">
                <Clock className="h-5 w-5 text-amber-600" /> Initiate Notice Period
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Mark <strong className="text-foreground">{selectedTenantForNotice ? tenantDisplayName(selectedTenantForNotice) : "tenant"}</strong> as vacating. The tenant status will change to <span className="font-semibold text-amber-700">UNDER NOTICE</span>.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Scheduled Move-Out Date *</Label>
                <Input
                  type="date"
                  value={noticeMoveOutDate}
                  onChange={(e) => setNoticeMoveOutDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Notice Reason / Notes</Label>
                <Input
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  placeholder="e.g. Relocating to another city, end of contract"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  The bed will remain allocated to the tenant until the move-out date is reached or Move-Out is finalized. Rent continues to accrue according to invoicing rules. You can cancel this notice at any time.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setNoticeModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
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
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-amber-600" /> Cancel Notice Period
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to cancel the move-out notice for <strong className="text-foreground">{selectedTenantForCancelNotice ? tenantDisplayName(selectedTenantForCancelNotice) : "tenant"}</strong>?
              </p>
            </DialogHeader>

            <div className="py-2 text-xs text-muted-foreground">
              This will return the tenant to normal <span className="font-semibold text-emerald-700">ACTIVE</span> stay status and remove the scheduled vacating deadline.
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setCancelNoticeAlertOpen(false)} className="rounded-xl text-xs">
                Keep Notice
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                onClick={handleConfirmCancelNotice}
                disabled={cancelNoticeMutation.isPending}
              >
                {cancelNoticeMutation.isPending ? "Cancelling..." : "Confirm Cancel Notice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
};

export default Tenants;
