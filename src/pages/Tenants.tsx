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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/context/AppContext";
import type { PropertyTenant } from "@/api/propertyOwner";
import { roomHasVacancyForAllocation } from "@/api/propertyOwner";
import { useBlocks, useFloors, usePropertyTenants, useRoomsList, useMoveTenantMutation } from "@/hooks/usePropertyOwnerQueries";
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
  const [groupBy, setGroupBy] = useState<"block" | "floor" | "none">("block");

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

  const moveMutation = useMoveTenantMutation(selectedPgId);

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
    return next;
  }, [tenantsQuery.data, searchQuery, kycFilter, selectedBlockId, selectedFloorId, selectedRoomId]);

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
      const bKey = t.block?.id || "unassigned";
      const bName = t.block?.name || "Main Building";
      const bOrder = t.block?.displayOrder ?? 999;

      if (!map.has(bKey)) {
        map.set(bKey, { blockName: bName, displayOrder: bOrder, floors: new Map() });
      }
      const bObj = map.get(bKey)!;

      const fKey = t.floor?.id || "unassigned";
      const fName = t.floor?.name || "General Floor";
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
  }, [filteredTenants]);

  const groupedByFloorTenants = useMemo(() => {
    const map = new Map<
      string,
      { floorName: string; blockName: string; displayOrder: number; tenants: PropertyTenant[] }
    >();

    for (const t of filteredTenants) {
      const fKey = t.floor?.id || "unassigned";
      const fName = t.floor?.name || "General Floor";
      const bName = t.block?.name || "Main Building";
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
  }, [filteredTenants]);

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
    return (
      <Card
        key={row.id}
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-border/60 overflow-hidden bg-card"
        onClick={() => navigate(`/tenants/${row.id}`)}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Details block */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Avatar className="h-12 w-12 border shrink-0">
              <AvatarFallback className="text-sm font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground truncate">
                  {tenantDisplayName(row)}
                </h3>
                {isVerified ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] py-0 px-2 font-medium">
                    Aadhar verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] py-0 px-2 font-medium">
                    Pending verification
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-2 mt-1">
                <span className="font-semibold text-foreground">Block: {tenantBlock(row)}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Floor: {tenantFloor(row)}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Room: {tenantRoomNo(row)}</span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground">Bed: {tenantBedNo(row)}</span>
              </div>
            </div>
          </div>

          {/* Middle Info block (Rent & Dues) */}
          <div className="flex items-center gap-4 text-xs shrink-0 flex-wrap md:flex-nowrap md:mx-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rent</span>
              <span className="font-bold text-sm text-foreground">{tenantRentAmount(row)}/mo</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Due Status</span>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded mt-0.5">
                Rent due: {tenantRentDueLabel(row)}
              </span>
            </div>
          </div>

          {/* Right Quick actions block */}
          <div className="flex items-center gap-2 shrink-0 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg border-teal-600/30 text-teal-700 hover:bg-teal-50 font-bold"
              onClick={() => handleOpenMoveModal(row)}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Move
            </Button>
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
      </div>
    </CanAccessPage>
  );
};

export default Tenants;
