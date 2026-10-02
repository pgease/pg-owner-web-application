import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Layers,
  DoorOpen,
  BedDouble,
  Plus,
  Loader2,
  Trash2,
  Users,
  Grid3X3,
  Table as TableIcon,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "@/components/ui/use-toast";
import {
  useBlocks,
  useCreateBlock,
  useCreateFloor,
  useCreateRoom,
  useFloors,
  useRoomsList,
  usePropertyTenants,
  useDeleteBlockMutation,
  useDeleteFloorMutation,
  useDeleteRoomMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { createProperty } from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";
import { cn } from "@/lib/utils";

export default function Structure() {
  const { selectedPgId, properties, refreshProperties, setSelectedPgId } = useApp();
  const currentPropertyId = selectedPgId;
  const propertyList = properties;
  const setCurrentPropertyId = setSelectedPgId;
  const navigate = useNavigate();

  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // State for Navigation Hierarchy
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  // Modals state
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  // Forms
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    totalFloors: 0,
    totalRooms: 0,
    totalBeds: 0,
  });

  const [blockName, setBlockName] = useState("");
  const [floorName, setFloorName] = useState("");
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    numberOfBeds: 2,
  });

  // Queries
  const blocksQuery = useBlocks(currentPropertyId);
  const rawBlocks = blocksQuery.data ?? [];

  // Query all rooms across property without requiring strict block/floor IDs
  const allRoomsQuery = useRoomsList(currentPropertyId, undefined, undefined, { requireBlockAndFloor: false });
  const allRooms = allRoomsQuery.data ?? [];

  // P0 Bug 4: If blocks table is empty but rooms exist, synthesize blocks from room data
  const blocks = useMemo(() => {
    if (rawBlocks.length > 0) return rawBlocks;
    if (allRooms.length === 0) return [];

    // Synthesize unique blocks from rooms
    const blockNames = new Set<string>();
    allRooms.forEach((r: any) => {
      const b = r.block || r.blockName || (r.blockId ? `Block ${r.blockId}` : "Main Wing");
      blockNames.add(b);
    });

    return Array.from(blockNames).map((name, idx) => ({
      id: `synth-block-${idx}`,
      name,
      propertyId: currentPropertyId || "",
    }));
  }, [rawBlocks, allRooms, currentPropertyId]);

  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(currentPropertyId, effectiveBlockId && !effectiveBlockId.startsWith("synth-") ? effectiveBlockId : undefined);
  const rawFloors = floorsQuery.data ?? [];

  // Synthesize floors if needed
  const floors = useMemo(() => {
    if (rawFloors.length > 0) return rawFloors;
    if (allRooms.length === 0) return [];

    const floorNames = new Set<string>();
    allRooms.forEach((r: any) => {
      const f = r.floor || r.floorName || (r.floorNumber != null ? `Floor ${r.floorNumber}` : "Ground Floor");
      floorNames.add(f);
    });

    return Array.from(floorNames).map((name, idx) => ({
      id: `synth-floor-${idx}`,
      name,
      blockId: effectiveBlockId,
      propertyId: currentPropertyId || "",
      displayOrder: idx + 1,
    }));
  }, [rawFloors, allRooms, effectiveBlockId, currentPropertyId]);

  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";

  // Rooms Query: filter from allRooms if synthetic, else query by block and floor
  const rooms = useMemo(() => {
    if (effectiveBlockId.startsWith("synth-") || effectiveFloorId.startsWith("synth-")) {
      return allRooms;
    }
    const filtered = allRooms.filter((r: any) => {
      if (effectiveBlockId && r.blockId && r.blockId !== effectiveBlockId) return false;
      if (effectiveFloorId && r.floorId && r.floorId !== effectiveFloorId) return false;
      return true;
    });
    return filtered.length > 0 ? filtered : allRooms;
  }, [allRooms, effectiveBlockId, effectiveFloorId]);

  const { data: tenantsData = [] } = usePropertyTenants(currentPropertyId);

  // Mutations
  const createBlockMut = useCreateBlock(currentPropertyId);
  const createFloorMut = useCreateFloor(currentPropertyId, effectiveBlockId && !effectiveBlockId.startsWith("synth-") ? effectiveBlockId : undefined);
  const createRoomMut = useCreateRoom(currentPropertyId);

  const deleteBlockMut = useDeleteBlockMutation(currentPropertyId);
  const deleteFloorMut = useDeleteFloorMutation(currentPropertyId);
  const deleteRoomMut = useDeleteRoomMutation(currentPropertyId);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "block" | "floor" | "room";
    id: string;
    name: string;
  }>({ open: false, type: "block", id: "", name: "" });

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === "block") {
        await deleteBlockMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Block deleted", description: `${deleteConfirm.name} removed.` });
        if (selectedBlockId === deleteConfirm.id) setSelectedBlockId("");
      } else if (deleteConfirm.type === "floor") {
        await deleteFloorMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Floor deleted", description: `${deleteConfirm.name} removed.` });
        if (selectedFloorId === deleteConfirm.id) setSelectedFloorId("");
      } else if (deleteConfirm.type === "room") {
        await deleteRoomMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Room deleted", description: `${deleteConfirm.name} removed.` });
      }
    } catch (e: any) {
      toast({
        title: "Could not delete",
        description: e?.message || "Ensure no active tenants occupy this room before deleting.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm({ open: false, type: "block", id: "", name: "" });
    }
  };

  const activeProperty = propertyList.find((p) => p.id === currentPropertyId);

  // Handlers
  const handleCreateProperty = async () => {
    if (!propertyForm.name.trim()) {
      toast({ title: "Please enter property name", variant: "destructive" });
      return;
    }
    try {
      const res = await createProperty({
        name: propertyForm.name.trim(),
        address: `${propertyForm.address.trim()}, ${propertyForm.city.trim()}, ${propertyForm.state.trim()}`,
        latitude: 28.63876539,
        longitude: 77.37794469,
        locationPin: propertyForm.pincode.trim() || "201014",
        bedRange: `${Number(propertyForm.totalBeds || 10)}-${Number(propertyForm.totalBeds || 10) + 20}`,
        propertyTypeId: "770b22ea-688a-481a-9ee3-006e6891600f",
      });
      toast({ title: "Property created", description: `${propertyForm.name} added successfully.` });
      setAddPropertyOpen(false);
      await refreshProperties();
      if (res?.id) setCurrentPropertyId(res.id);
    } catch (e: any) {
      toast({ title: "Failed to create property", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateBlock = async () => {
    if (!blockName.trim()) {
      toast({ title: "Please enter block name", variant: "destructive" });
      return;
    }
    try {
      await createBlockMut.mutateAsync({ name: blockName.trim() });
      toast({ title: "Block added", description: `${blockName} created successfully.` });
      setBlockName("");
      setAddBlockOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create block", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateFloor = async () => {
    if (!floorName.trim() || !effectiveBlockId) {
      toast({ title: "Please enter floor name", variant: "destructive" });
      return;
    }
    try {
      await createFloorMut.mutateAsync({
        name: floorName.trim(),
        displayOrder: floors.length + 1,
      });
      toast({ title: "Floor added", description: `${floorName} added to block.` });
      setFloorName("");
      setAddFloorOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create floor", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateRoom = async () => {
    if (!roomForm.roomNumber.trim()) {
      toast({ title: "Enter room number", variant: "destructive" });
      return;
    }
    try {
      await createRoomMut.mutateAsync({
        floorId: effectiveFloorId && !effectiveFloorId.startsWith("synth-") ? effectiveFloorId : undefined,
        roomNumber: roomForm.roomNumber.trim(),
        numberOfBeds: Number(roomForm.numberOfBeds),
      });
      toast({
        title: "Room created",
        description: `Room ${roomForm.roomNumber} with ${roomForm.numberOfBeds} beds created.`,
      });
      setRoomForm({ roomNumber: "", numberOfBeds: 2 });
      setAddRoomOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create room", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <CanAccessPage permission="multi_pg">
      <div className="space-y-6 pb-12 max-w-7xl">
        {/* Page Header */}
        <PageHeader
          title="Rooms & Beds"
          description="Manage property blocks, floors, rooms, and bed occupancy with direct tenant check-in."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setAddPropertyOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add property
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAddRoomOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add room
              </Button>
            </div>
          }
        />

        {/* Property & View Switcher Bar */}
        <div className="register-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-[var(--brand-50)] border border-[var(--brand-100)] text-[var(--brand-700)] flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold text-[var(--gray-900)]">
                  {activeProperty?.name || "Select Property"}
                </h2>
                <span className="text-[11px] font-medium text-[var(--gray-500)] bg-[var(--gray-100)] px-2 py-0.5 rounded-sm">
                  {allRooms.length} rooms
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                {activeProperty?.address || "Configure room blocks and bed capacity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Bed Grid vs Table */}
            <div className="flex rounded-md border border-[var(--gray-300)] p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors",
                  viewMode === "grid"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)]"
                )}
              >
                <Grid3X3 className="h-3.5 w-3.5" /> Bed Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors",
                  viewMode === "table"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)]"
                )}
              >
                <TableIcon className="h-3.5 w-3.5" /> Table View
              </button>
            </div>

            <Select value={currentPropertyId || ""} onValueChange={(val) => setCurrentPropertyId(val)}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Switch PG" />
              </SelectTrigger>
              <SelectContent>
                {propertyList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* STEP 1: BLOCKS SELECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider">
              1. Blocks & Wings
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 text-xs h-7"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Block
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {blocks.map((b) => {
              const isSelected = b.id === effectiveBlockId;
              return (
                <div key={b.id} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBlockId(b.id);
                      setSelectedFloorId("");
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-sm border text-xs font-medium transition-colors flex items-center gap-2",
                      isSelected
                        ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)] font-semibold"
                        : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:border-[var(--gray-300)]"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{b.name}</span>
                  </button>
                  {!b.id.startsWith("synth-") && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 rounded-full bg-red-100 text-red-600 items-center justify-center text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ open: true, type: "block", id: b.id, name: b.name });
                      }}
                      title={`Delete ${b.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            {blocks.length === 0 && (
              <div
                onClick={() => setAddBlockOpen(true)}
                className="w-full border border-dashed border-[var(--gray-300)] rounded-sm p-4 text-center cursor-pointer hover:border-[var(--brand-600)] text-xs text-[var(--gray-500)]"
              >
                + Add your first block (e.g. Block A, Main Wing)
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: FLOORS SELECTION */}
        {effectiveBlockId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider">
                2. Floors
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 text-xs h-7"
                onClick={() => setAddFloorOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Floor
              </Button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {floors.map((f) => {
                const isSelected = f.id === effectiveFloorId;
                return (
                  <div key={f.id} className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedFloorId(f.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-sm border text-xs font-medium transition-colors flex items-center gap-1.5",
                        isSelected
                          ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)] font-semibold"
                          : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:border-[var(--gray-300)]"
                      )}
                    >
                      <Layers className="h-3 w-3" />
                      <span>{f.name}</span>
                    </button>
                    {!f.id.startsWith("synth-") && (
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 rounded-full bg-red-100 text-red-600 items-center justify-center text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, type: "floor", id: f.id, name: f.name });
                        }}
                        title={`Delete ${f.name}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              {floors.length === 0 && (
                <div
                  onClick={() => setAddFloorOpen(true)}
                  className="w-full border border-dashed border-[var(--gray-300)] rounded-sm p-3 text-center cursor-pointer hover:border-[var(--brand-600)] text-xs text-[var(--gray-500)]"
                >
                  + Add first floor (e.g. Ground Floor, 1st Floor)
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ROOMS & BED MATRIX */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider block">
                3. Rooms & Bed Matrix
              </span>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                Click any vacant bed tile to start new tenant onboarding with pre-selected room & bed.
              </p>
            </div>

            {/* Visual Bed Grid Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--gray-600)] bg-[var(--gray-50)] px-3 py-1.5 rounded-sm border border-[var(--gray-200)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-white border border-[var(--gray-400)]" /> Vacant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> On notice
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--gray-300)]" /> Blocked
              </span>
            </div>
          </div>

          {allRoomsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="register-card p-8">
              <EmptyState
                icon={<DoorOpen />}
                title="No rooms created yet"
                description="Add rooms to this floor to track bed occupancy and allocate new tenants."
                action={
                  <Button size="sm" onClick={() => setAddRoomOpen(true)}>
                    Add first room
                  </Button>
                }
              />
            </div>
          ) : viewMode === "grid" ? (
            /* Bed Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rooms.map((r: any) => {
                const bedCount = Number(r.capacity || r.numberOfBeds || r.beds?.length || 1);

                // Assigned tenants for this room
                const roomTenants = tenantsData.filter(
                  (t: any) =>
                    String(t.roomNumber) === String(r.roomNumber) ||
                    String(t.roomNo) === String(r.roomNumber) ||
                    t.roomId === r.id ||
                    t.room?.id === r.id
                );

                const occupiedCount = roomTenants.length;
                const isFull = occupiedCount >= bedCount;

                return (
                  <div
                    key={r.id}
                    className="register-card p-3.5 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--gray-900)]">
                          Room {r.roomNumber}
                        </span>
                        <StatusBadge
                          status={isFull ? "occupied" : "vacant"}
                          label={isFull ? "Full" : `${Math.max(0, bedCount - occupiedCount)} vacant`}
                          size="sm"
                        />
                      </div>
                      <span className="text-xs text-[var(--gray-500)]">
                        {bedCount} Bed
                      </span>
                    </div>

                    {/* Beds Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {Array.from({ length: bedCount }).map((_, idx) => {
                        const assignedTenant = roomTenants[idx];
                        const isOccupied = Boolean(assignedTenant);
                        const isOnNotice = Boolean(assignedTenant?.notice?.isOnNotice || assignedTenant?.isOnNotice);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isOccupied && assignedTenant?.id) {
                                navigate(`/tenants/${assignedTenant.id}`);
                              } else {
                                // 1-click allocation from vacant bed
                                navigate("/tenants/add", {
                                  state: {
                                    prefillRoomId: r.id,
                                    prefillRoomNumber: r.roomNumber,
                                    prefillBedNumber: idx + 1,
                                    prefillBlockId: effectiveBlockId,
                                    prefillFloorId: effectiveFloorId,
                                  },
                                });
                              }
                            }}
                            className={cn(
                              "rounded-sm p-2 text-left text-xs border transition-colors flex flex-col justify-between h-14",
                              isOccupied
                                ? isOnNotice
                                  ? "bg-amber-50 border-amber-200 text-amber-900"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
                                : "bg-white border-dashed border-[var(--gray-300)] text-[var(--gray-500)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)]"
                            )}
                            title={isOccupied ? `Occupied by ${assignedTenant.name}` : `Bed ${idx + 1} is vacant. Click to add tenant.`}
                          >
                            <div className="flex items-center justify-between font-medium">
                              <span className="flex items-center gap-1 text-[11px]">
                                <BedDouble className="h-3 w-3" /> Bed {idx + 1}
                              </span>
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  isOccupied
                                    ? isOnNotice
                                      ? "bg-amber-500"
                                      : "bg-emerald-600"
                                    : "bg-transparent border border-[var(--gray-400)]"
                                )}
                              />
                            </div>
                            <span className="truncate text-[11px] font-semibold">
                              {isOccupied ? assignedTenant.name || "Tenant" : "+ Allocate"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--gray-200)] text-xs text-[var(--gray-500)]">
                      <span>Floor {r.floorNumber ?? "—"}</span>
                      {!r.id.startsWith("synth-") && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ open: true, type: "room", id: r.id, name: `Room ${r.roomNumber}` })}
                          className="text-[var(--gray-400)] hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <DataTable
              columns={[
                {
                  id: "roomNumber",
                  header: "Room #",
                  render: (r: any) => (
                    <span className="font-semibold text-[var(--gray-900)]">Room {r.roomNumber}</span>
                  ),
                },
                {
                  id: "floor",
                  header: "Floor",
                  render: (r: any) => (
                    <span className="text-[var(--gray-600)]">{r.floor || `Floor ${r.floorNumber ?? 1}`}</span>
                  ),
                },
                {
                  id: "block",
                  header: "Block",
                  render: (r: any) => (
                    <span className="text-[var(--gray-600)]">{r.block || "Main Wing"}</span>
                  ),
                },
                {
                  id: "capacity",
                  header: "Capacity",
                  align: "right",
                  render: (r: any) => (
                    <span className="tabular-nums">{r.numberOfBeds || r.capacity || 2} beds</span>
                  ),
                },
                {
                  id: "occupied",
                  header: "Occupied",
                  align: "right",
                  render: (r: any) => {
                    const roomTenants = tenantsData.filter(
                      (t: any) => String(t.roomNumber) === String(r.roomNumber) || t.roomId === r.id
                    );
                    return <span className="tabular-nums font-medium text-emerald-700">{roomTenants.length}</span>;
                  },
                },
                {
                  id: "status",
                  header: "Status",
                  render: (r: any) => {
                    const bedCount = Number(r.capacity || r.numberOfBeds || 1);
                    const roomTenants = tenantsData.filter(
                      (t: any) => String(t.roomNumber) === String(r.roomNumber) || t.roomId === r.id
                    );
                    const isFull = roomTenants.length >= bedCount;
                    return (
                      <StatusBadge
                        status={isFull ? "occupied" : "vacant"}
                        label={isFull ? "Full" : `${Math.max(0, bedCount - roomTenants.length)} Vacant`}
                        size="sm"
                      />
                    );
                  },
                },
                {
                  id: "actions",
                  header: "",
                  align: "right",
                  render: (r: any) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() =>
                        navigate("/tenants/add", {
                          state: { prefillRoomId: r.id, prefillRoomNumber: r.roomNumber },
                        })
                      }
                    >
                      + Allocate
                    </Button>
                  ),
                },
              ]}
              data={rooms}
              keyExtractor={(r: any) => r.id}
            />
          )}
        </div>

        {/* DIALOG 1: ADD PROPERTY MODAL */}
        <Dialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--brand-600)]" /> Add New PG Property
              </DialogTitle>
              <DialogDescription>
                Create a new property profile in your PG Ease portfolio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label>Property Name *</Label>
                <Input
                  placeholder="e.g. Green Villa PG"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  placeholder="e.g. 12th Main, Sector 62"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g. Noida"
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="e.g. 201301"
                    value={propertyForm.pincode}
                    onChange={(e) => setPropertyForm({ ...propertyForm, pincode: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddPropertyOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateProperty}>
                Create Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: ADD BLOCK MODAL */}
        <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--brand-600)]" /> Add Block / Wing
              </DialogTitle>
              <DialogDescription>
                Name the building section (e.g. Block A, Girls Wing, Annex).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-xs">
              <Label>Block Name *</Label>
              <Input
                placeholder="e.g. Block A"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddBlockOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateBlock} disabled={createBlockMut.isPending}>
                Save Block
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD FLOOR MODAL */}
        <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--brand-600)]" /> Add Floor
              </DialogTitle>
              <DialogDescription>
                Add a floor level to {blocks.find((b) => b.id === effectiveBlockId)?.name || "block"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-xs">
              <Label>Floor Name *</Label>
              <Input
                placeholder="e.g. Ground Floor, 1st Floor"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddFloorOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateFloor} disabled={createFloorMut.isPending}>
                Save Floor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: ADD ROOM MODAL */}
        <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-[var(--brand-600)]" /> Add Room & Bed Capacity
              </DialogTitle>
              <DialogDescription>
                Specify the room number and how many beds it contains.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label>Room Number / Name *</Label>
                <Input
                  placeholder="e.g. 101, 202-A"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Bed Count</Label>
                <Select
                  value={String(roomForm.numberOfBeds)}
                  onValueChange={(val) => setRoomForm({ ...roomForm, numberOfBeds: parseInt(val, 10) })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {b} Bed{b > 1 ? "s" : ""} ({b} Sharing)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddRoomOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateRoom} disabled={createRoomMut.isPending}>
                Save Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION DIALOG */}
        <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#B42318] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Delete {deleteConfirm.type}
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Are you sure you want to delete <strong className="text-[var(--gray-900)]">{deleteConfirm.name}</strong>?
                This action cannot be undone.
              </p>
            </DialogHeader>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete}>
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
