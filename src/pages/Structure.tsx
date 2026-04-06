import { useMemo, useState } from "react";
import { Building2, Layers, DoorOpen, BedDouble, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import {
  useBlocks,
  useCreateBlock,
  useCreateFloor,
  useCreateRoom,
  useFloors,
  useRooms,
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

const Structure = () => {
  const { selectedPgId, properties } = useApp();
  const currentPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [blockName, setBlockName] = useState("");
  const [floorName, setFloorName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [beds, setBeds] = useState("1");

  const blocksQuery = useBlocks(selectedPgId);
  const blocks = blocksQuery.data ?? [];

  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(selectedPgId, effectiveBlockId || undefined);
  const floors = floorsQuery.data ?? [];

  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";
  const roomsQuery = useRooms(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined);
  const rooms = roomsQuery.data ?? [];

  const createBlockMutation = useCreateBlock(selectedPgId);
  const createFloorMutation = useCreateFloor(selectedPgId, effectiveBlockId || undefined);
  const createRoomMutation = useCreateRoom(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined);

  const totalBeds = useMemo(
    () => rooms.reduce((sum, r) => sum + (Number(r.numberOfBeds) || 0), 0),
    [rooms]
  );

  const addBlock = async () => {
    const name = blockName.trim();
    if (!name) return toast({ title: "Block name is required", variant: "destructive" });
    try {
      await createBlockMutation.mutateAsync({ name });
      setBlockName("");
      toast({ title: "Block added" });
    } catch (e: any) {
      toast({ title: "Failed to add block", description: e?.message, variant: "destructive" });
    }
  };

  const addFloor = async () => {
    const name = floorName.trim();
    if (!effectiveBlockId) return toast({ title: "Select a block first", variant: "destructive" });
    if (!name) return toast({ title: "Floor name is required", variant: "destructive" });
    try {
      await createFloorMutation.mutateAsync({ name });
      setFloorName("");
      toast({ title: "Floor added" });
      floorsQuery.refetch();
    } catch (e: any) {
      toast({ title: "Failed to add floor", description: e?.message, variant: "destructive" });
    }
  };

  const addRoom = async () => {
    const room = roomNumber.trim();
    const numberOfBeds = Number(beds);
    if (!effectiveBlockId) return toast({ title: "Select a block first", variant: "destructive" });
    if (!effectiveFloorId) return toast({ title: "Select a floor first", variant: "destructive" });
    if (!room) return toast({ title: "Room number is required", variant: "destructive" });
    if (!Number.isFinite(numberOfBeds) || numberOfBeds < 1) {
      return toast({ title: "Beds must be at least 1", variant: "destructive" });
    }
    try {
      await createRoomMutation.mutateAsync({
        floorId: effectiveFloorId,
        roomNumber: room,
        numberOfBeds,
      });
      setRoomNumber("");
      setBeds("1");
      toast({ title: "Room added" });
      roomsQuery.refetch();
    } catch (e: any) {
      toast({ title: "Failed to add room", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <CanAccessPage permission="room_view">
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocks, Floors & Rooms</h1>
        <p className="text-sm text-muted-foreground">
          Add or adjust blocks, floors, rooms and beds for {currentPg?.name ?? "your PG"}
        </p>
      </div>

      {!selectedPgId ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Select a PG from the header to manage structure.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Block</Label>
              <Select value={effectiveBlockId} onValueChange={(v) => { setSelectedBlockId(v); setSelectedFloorId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select block" /></SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={effectiveFloorId} onValueChange={setSelectedFloorId}>
                <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(blocksQuery.isLoading || floorsQuery.isLoading || roomsQuery.isLoading) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {(blocksQuery.isError || floorsQuery.isError || roomsQuery.isError) && (
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Failed to load structure data.</p>
                <Button
                  variant="outline"
                  size="sm"
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
          )}
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Total: {blocks.length}</p>
            <div className="space-y-2">
              <Input placeholder="Block name" value={blockName} onChange={(e) => setBlockName(e.target.value)} />
              <CanAccess permission="room_add">
                <Button
                  size="sm"
                  className="gap-2 w-full"
                  onClick={addBlock}
                  disabled={!selectedPgId || createBlockMutation.isPending}
                >
                  <Plus className="h-4 w-4" /> {createBlockMutation.isPending ? "Adding..." : "Add Block"}
                </Button>
              </CanAccess>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" /> Floors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Total: {floors.length}</p>
            <div className="space-y-2">
              <Input placeholder="Floor name/number" value={floorName} onChange={(e) => setFloorName(e.target.value)} />
              <CanAccess permission="room_add">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={addFloor}
                  disabled={!selectedPgId || !effectiveBlockId || createFloorMutation.isPending}
                >
                  <Plus className="h-4 w-4" /> {createFloorMutation.isPending ? "Adding..." : "Add Floor"}
                </Button>
              </CanAccess>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DoorOpen className="h-4 w-4" /> Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Total: {rooms.length}</p>
            <div className="space-y-2">
              <Input placeholder="Room number (e.g. A-101)" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
              <CanAccess permission="room_add">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={addRoom}
                  disabled={!selectedPgId || !effectiveBlockId || !effectiveFloorId || createRoomMutation.isPending}
                >
                  <Plus className="h-4 w-4" /> {createRoomMutation.isPending ? "Adding..." : "Add Room"}
                </Button>
              </CanAccess>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="h-4 w-4" /> Beds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Total beds from rooms: {totalBeds}</p>
            <Input
              type="number"
              min={1}
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              placeholder="Beds in next room"
            />
          </CardContent>
        </Card>
      </div>

      {selectedPgId && !blocksQuery.isLoading && blocks.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No blocks found. Add your first block to start room management.
          </CardContent>
        </Card>
      )}
    </div>
    </CanAccessPage>
  );
};

export default Structure;
