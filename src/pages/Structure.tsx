import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Layers,
  DoorOpen,
  BedDouble,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Users,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Info,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "@/components/ui/use-toast";
import {
  useBlocks,
  useCreateBlock,
  useCreateFloor,
  useCreateRoom,
  useFloors,
  useRoomsList,
  usePropertyTenants,
} from "@/hooks/usePropertyOwnerQueries";
import { createProperty } from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

export default function Structure() {
  const { selectedPgId, properties, refreshProperties, setSelectedPgId } = useApp();
  const currentPropertyId = selectedPgId;
  const propertyList = properties;
  const setCurrentPropertyId = setSelectedPgId;
  const navigate = useNavigate();

  const [locating, setLocating] = useState(false);

  const NOMINATIM_UA = "PGEase-OwnerWeb/1.0 (support@pgease.in)";

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" } });
      if (!res.ok) return null;
      const data = await res.json();
      const displayName = data.display_name ?? "";
      const postcode = data.address?.postcode?.match(/\d{6}/)?.[0] ?? null;
      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "";
      const state = data.address?.state ?? "";
      return { displayName, postcode, city, state };
    } catch {
      return null;
    }
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported by your browser", variant: "destructive" });
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const rev = await reverseGeocode(lat, lon);
      if (rev) {
        setPropertyForm((prev) => ({
          ...prev,
          address: rev.displayName,
          pincode: rev.postcode || "",
          city: rev.city || "",
          state: rev.state || "",
        }));
        toast({ title: "Location applied successfully" });
      }
    } catch (e) {
      toast({ title: "Could not get current location", variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

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
  const blocks = blocksQuery.data ?? [];

  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(currentPropertyId, effectiveBlockId || undefined);
  const floors = floorsQuery.data ?? [];

  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";
  const roomsQuery = useRoomsList(currentPropertyId, effectiveBlockId || undefined, effectiveFloorId || undefined);
  const rooms = roomsQuery.data ?? [];

  const { data: tenantsData = [] } = usePropertyTenants(currentPropertyId);

  // Mutations
  const createBlockMut = useCreateBlock(currentPropertyId);
  const createFloorMut = useCreateFloor(currentPropertyId, effectiveBlockId || undefined);
  const createRoomMut = useCreateRoom(currentPropertyId);

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
      toast({ title: "Property Created! 🏢", description: `${propertyForm.name} added successfully.` });
      setAddPropertyOpen(false);
      await refreshProperties();
      if (res?.id) {
        setCurrentPropertyId(res.id);
      }
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
      toast({ title: "Block Added! 🧱", description: `${blockName} created successfully.` });
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
      toast({ title: "Floor Added! 🪜", description: `${floorName} added to block.` });
      setFloorName("");
      setAddFloorOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create floor", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateRoom = async () => {
    if (!roomForm.roomNumber.trim() || !effectiveFloorId) {
      toast({ title: "Enter room number", variant: "destructive" });
      return;
    }
    try {
      await createRoomMut.mutateAsync({
        floorId: effectiveFloorId,
        roomNumber: roomForm.roomNumber.trim(),
        numberOfBeds: Number(roomForm.numberOfBeds),
      });
      toast({
        title: "Room & Beds Added! 🚪",
        description: `Room ${roomForm.roomNumber} with ${roomForm.numberOfBeds} beds generated.`,
      });
      setRoomForm({ roomNumber: "", numberOfBeds: 2, });
      setAddRoomOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create room", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <CanAccessPage permission="multi_pg">
      <div className="space-y-6 animate-fade-in pb-16">
        {/* Page Header with Add Property Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Property Structure & Floor Matrix"
            description="Manage Blocks, Floors, Rooms, and Bed configurations with visual occupancy status."
          />
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm"
            onClick={() => setAddPropertyOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add New PG Property
          </Button>
        </div>

        {/* PROPERTY HERO CARD */}
        <Card className="border-teal-200 dark:border-teal-900 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{activeProperty?.name || "Select Property"}</h2>
                    <Badge variant="outline" className="text-teal-700 border-teal-300 dark:text-teal-300">
                      Active PG
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeProperty?.address || "Configure your room structure below"} • {(activeProperty as any)?.city || "India"}
                  </p>
                </div>
              </div>

              {/* Property Selector */}
              <div className="flex items-center gap-2">
                <Select value={currentPropertyId || ""} onValueChange={(val) => setCurrentPropertyId(val)}>
                  <SelectTrigger className="w-[220px] bg-background">
                    <SelectValue placeholder="Switch PG Property" />
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
          </CardContent>
        </Card>

        {/* STEP 1: BLOCKS SELECTION / CREATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">
                1
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Blocks & Wings</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Block
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {blocks.map((b) => {
              const isSelected = b.id === effectiveBlockId;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBlockId(b.id);
                    setSelectedFloorId("");
                  }}
                  className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 shadow-sm font-bold text-teal-700 dark:text-teal-300"
                      : "border-border hover:border-teal-300 bg-card text-muted-foreground"
                  }`}
                >
                  <Layers className="h-5 w-5 mx-auto mb-1 opacity-70" />
                  <div className="text-sm truncate">{b.name}</div>
                </div>
              );
            })}
            {blocks.length === 0 && (
              <div
                onClick={() => setAddBlockOpen(true)}
                className="col-span-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 bg-muted/20"
              >
                <Layers className="h-6 w-6 mx-auto mb-1 text-teal-600" />
                <p className="text-xs font-semibold text-foreground">No Blocks Created Yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Click here to add Block A, Main Wing, etc.</p>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: FLOORS SELECTION / CREATION */}
        {effectiveBlockId && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">
                  2
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Floors in Block</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
                onClick={() => setAddFloorOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Floor
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {floors.map((f) => {
                const isSelected = f.id === effectiveFloorId;
                return (
                  <Button
                    key={f.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-9 gap-1.5 ${
                      isSelected ? "bg-teal-600 hover:bg-teal-700 text-white font-semibold" : ""
                    }`}
                    onClick={() => setSelectedFloorId(f.id)}
                  >
                    <Layers className="h-3.5 w-3.5" /> {f.name}
                  </Button>
                );
              })}
              {floors.length === 0 && (
                <div
                  onClick={() => setAddFloorOpen(true)}
                  className="w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 bg-muted/20 text-xs text-muted-foreground"
                >
                  + Add first floor (e.g. Ground Floor, 1st Floor) to this block
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ROOMS & BED MATRIX */}
        {effectiveFloorId && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">
                  3
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Rooms & Beds Allocation
                </h3>
              </div>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8 shadow-sm"
                onClick={() => setAddRoomOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Room & Beds
              </Button>
            </div>

            {roomsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : rooms.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <DoorOpen className="h-10 w-10 text-teal-600 mb-2 opacity-60" />
                  <p className="text-sm font-semibold">No Rooms on this Floor</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5 mb-3">
                    Add room numbers (e.g. 101, 102) and specify bed count (Single, Double, Triple sharing).
                  </p>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
                    onClick={() => setAddRoomOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rooms.map((r: any) => {
                  const bedCount = r.capacity || r.numberOfBeds || r.beds?.length || 1;

                  // Find assigned tenants for this room
                  const roomTenants = tenantsData.filter(
                    (t: any) => t.roomNumber === r.roomNumber || t.roomNo === r.roomNumber
                  );

                  return (
                    <Card
                      key={r.id}
                      className="border hover:border-teal-300 dark:hover:border-teal-700 transition-all shadow-sm"
                    >
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-5 w-5 text-teal-600" />
                          <CardTitle className="text-base font-bold">Room {r.roomNumber}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {bedCount} Sharing
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-3">

                        {/* Bed Slots Grid */}
                        <div className="space-y-1.5 border-t pt-2.5">
                          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Bed Occupancy
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Array.from({ length: bedCount }).map((_, idx) => {
                              const assignedTenant = roomTenants[idx];
                              const isOccupied = Boolean(assignedTenant);

                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (isOccupied && assignedTenant?.id) {
                                      navigate(`/tenants/${assignedTenant.id}`);
                                    }
                                  }}
                                  className={`rounded-lg p-2 text-xs flex flex-col justify-between border transition-all ${
                                    isOccupied
                                      ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 cursor-pointer"
                                      : "bg-muted/40 border-dashed border-border text-muted-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="flex items-center gap-1">
                                      <BedDouble className="h-3.5 w-3.5" /> Bed {idx + 1}
                                    </span>
                                    {isOccupied ? (
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                                    )}
                                  </div>
                                  <div className="text-[11px] truncate mt-1">
                                    {isOccupied ? (
                                      assignedTenant.name || (assignedTenant as any).tenantName
                                    ) : (
                                      <span className="opacity-60 italic">Vacant</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DIALOG 1: ADD PROPERTY MODAL */}
        <Dialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" /> Add New PG Property
              </DialogTitle>
              <DialogDescription>
                Create a new property profile in your PG Ease portfolio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Property Name</Label>
                <Input
                  placeholder="e.g. Sunshine PG / Green Villa"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Full Address</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    disabled={locating}
                    onClick={handleUseLocation}
                  >
                    {locating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    Use my current location
                  </Button>
                </div>
                <Input
                  placeholder="e.g. 12th Main, Indiranagar"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g. Noida"
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input
                    placeholder="e.g. Uttar Pradesh"
                    value={propertyForm.state}
                    onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="e.g. 201014"
                    value={propertyForm.pincode}
                    onChange={(e) => setPropertyForm({ ...propertyForm, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Contact Number</Label>
                  <Input
                    placeholder="10-digit number"
                    maxLength={10}
                    value={propertyForm.contactNumber}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPropertyForm({ ...propertyForm, contactNumber: cleanVal });
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddPropertyOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleCreateProperty}>
                Create Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: ADD BLOCK MODAL */}
        <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" /> Add Building Block / Wing
              </DialogTitle>
              <DialogDescription>
                Group floors and rooms by block (e.g. Block A, Boys Wing, Tower 1).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Block Name</Label>
                <Input
                  placeholder="e.g. Block A / Main Wing"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddBlockOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={createBlockMut.isPending}
                onClick={handleCreateBlock}
              >
                {createBlockMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Block"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD FLOOR MODAL */}
        <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" /> Add Floor to Block
              </DialogTitle>
              <DialogDescription>
                Add a new floor tier to your selected building block.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Floor Name</Label>
                <Input
                  placeholder="e.g. Ground Floor / 1st Floor / 2nd Floor"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddFloorOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={createFloorMut.isPending}
                onClick={handleCreateFloor}
              >
                {createFloorMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Floor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: ADD ROOM & BEDS MODAL */}
        <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-teal-600" /> Add Room & Bed Configuration
              </DialogTitle>
              <DialogDescription>
                Assign room number and total beds available for occupancy.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Room Number / Code</Label>
                <Input
                  placeholder="e.g. 101, 102, G-01"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Number of Beds (Sharing Type)</Label>
                <Select
                  value={String(roomForm.numberOfBeds)}
                  onValueChange={(val) => setRoomForm({ ...roomForm, numberOfBeds: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sharing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Bed (Single Private)</SelectItem>
                    <SelectItem value="2">2 Beds (Double Sharing)</SelectItem>
                    <SelectItem value="3">3 Beds (Triple Sharing)</SelectItem>
                    <SelectItem value="4">4 Beds (Four Sharing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRoomOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={createRoomMut.isPending}
                onClick={handleCreateRoom}
              >
                {createRoomMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Room & Beds"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
