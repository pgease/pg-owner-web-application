import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Send,
  Building2,
  DoorOpen,
  BedDouble,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";
import { useApp } from "@/context/AppContext";
import { useBlocks, useFloors, useRoomsList } from "@/hooks/usePropertyOwnerQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";

const Tenants = () => {
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  const list = Array.isArray(properties) ? properties : [];
  const blocksQuery = useBlocks(selectedPgId);
  const blocks = blocksQuery.data ?? [];
  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(selectedPgId, effectiveBlockId || undefined);
  const floors = floorsQuery.data ?? [];
  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";
  const roomsQuery = useRoomsList(selectedPgId, effectiveBlockId || undefined, effectiveFloorId || undefined);
  const rooms = roomsQuery.data ?? [];

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => String(r.roomNumber).toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  const occupiedBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.occupiedBeds) || 0), 0);
  const availableBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.availableBeds) || 0), 0);
  const totalBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.numberOfBeds) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tenant list"
        description="Manage all your tenants across PGs"
        actions={
          <>
          <Button size="sm" variant="outline" className="gap-2" disabled>
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2" disabled>
            <Send className="h-4 w-4" /> Send Invite
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add Tenant
          </Button>
          </>
        }
      />

      {/* Rent types — no API in collection */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Occupancy overview</p>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-5">
            <span>Total beds: {totalBeds}</span>
            <span>Occupied: {occupiedBeds}</span>
            <span>Available: {availableBeds}</span>
          </div>
        </CardContent>
      </Card>

      <FilterBar>
        <div className="relative flex-1 max-w-sm">
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
          <SelectTrigger className="w-[210px]">
            <SelectValue placeholder="Select PG" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>Select PG</SelectItem>
            {list.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={effectiveBlockId || "none"} onValueChange={(v) => { setSelectedBlockId(v); setSelectedFloorId(""); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Block" /></SelectTrigger>
          <SelectContent>
            {blocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            {blocks.length === 0 && <SelectItem value="none" disabled>No blocks</SelectItem>}
          </SelectContent>
        </Select>
        <Select value={effectiveFloorId || "none"} onValueChange={setSelectedFloorId}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Floor" /></SelectTrigger>
          <SelectContent>
            {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            {floors.length === 0 && <SelectItem value="none" disabled>No floors</SelectItem>}
          </SelectContent>
        </Select>
      </FilterBar>

      {(blocksQuery.isLoading || floorsQuery.isLoading || roomsQuery.isLoading) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (blocksQuery.isError || floorsQuery.isError || roomsQuery.isError) ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Failed to load tenant/room data</p>
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
            <p className="font-medium">No room inventory found</p>
            <p className="text-sm mt-1">
              Add blocks/floors/rooms in Structure and use Add Tenant to assign occupants.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRooms.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">Room {r.roomNumber}</p>
                      <Badge variant="outline">{r.numberOfBeds} beds</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> Block: {blocks.find((b) => b.id === effectiveBlockId)?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3.5 w-3.5" /> Room no: {r.roomNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" /> Available beds: {r.availableBeds ?? "—"}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap items-center gap-4">
                      <span className="font-medium">Occupied: {r.occupiedBeds ?? 0}/{r.numberOfBeds}</span>
                      <span className="text-sm text-muted-foreground">
                        Assign tenants using &quot;Add Tenant&quot;
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddTenantDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Tenants;
