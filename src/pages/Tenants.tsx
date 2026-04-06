import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";
import { TenantCard } from "@/components/tenants/TenantCard";
import { TenantDetailDialog } from "@/components/tenants/TenantDetailDialog";
import { useApp } from "@/context/AppContext";
import type { PropertyTenant } from "@/api/propertyOwner";
import { roomHasVacancyForAllocation } from "@/api/propertyOwner";
import { queryKeys, useBlocks, useFloors, usePropertyTenants, useRoomsList } from "@/hooks/usePropertyOwnerQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { tenantDisplayName, tenantPhone, tenantRoomNo } from "@/lib/tenantDisplay";

const Tenants = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [detailTenant, setDetailTenant] = useState<PropertyTenant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) => {
      const blob = [tenantDisplayName(row), tenantPhone(row), tenantRoomNo(row)].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [tenantsQuery.data, searchQuery]);

  const occupiedBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.occupiedBeds) || 0), 0);
  const availableBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.availableBeds) || 0), 0);
  const totalBeds = filteredRooms.reduce((sum, r) => sum + (Number(r.numberOfBeds) || 0), 0);

  const roomsLoading = blocksQuery.isLoading || floorsQuery.isLoading || roomsQuery.isLoading;
  const roomsError = blocksQuery.isError || floorsQuery.isError || roomsQuery.isError;

  const filterBarEl = (
    <FilterBar>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isVacantRoomsPage ? "Search by room number..." : "Search tenants or rooms..."}
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
          {list
            .filter((p) => p.id && String(p.id).trim() !== "")
            .map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select value={effectiveBlockId || "none"} onValueChange={(v) => { setSelectedBlockId(v); setSelectedFloorId(""); }}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Block" /></SelectTrigger>
        <SelectContent>
          {blocks
            .filter((b) => b.id && String(b.id).trim() !== "")
            .map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          {blocks.length === 0 && <SelectItem value="none" disabled>No blocks</SelectItem>}
        </SelectContent>
      </Select>
      <Select value={effectiveFloorId || "none"} onValueChange={setSelectedFloorId}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Floor" /></SelectTrigger>
        <SelectContent>
          {floors
            .filter((f) => f.id && String(f.id).trim() !== "")
            .map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          {floors.length === 0 && <SelectItem value="none" disabled>No floors</SelectItem>}
        </SelectContent>
      </Select>
    </FilterBar>
  );

  const roomsSection = (
    <>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">
            {isVacantRoomsPage ? "Vacancy overview" : "Occupancy overview"}
          </p>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-5">
            <span>Total beds: {totalBeds}</span>
            <span>Occupied: {occupiedBeds}</span>
            <span>Available: {availableBeds}</span>
            <span>Rooms shown: {filteredRooms.length}</span>
          </div>
        </CardContent>
      </Card>

      {roomsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : roomsError ? (
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
            <p className="font-medium">
              {isVacantRoomsPage ? "No vacant rooms found" : "No room inventory found"}
            </p>
            <p className="text-sm mt-1">
              {isVacantRoomsPage
                ? "Try another block/floor, or add rooms in Structure."
                : "Add blocks/floors/rooms in Structure and use Add Tenant to assign occupants."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRooms.map((r, index) => (
            <Card key={r.id && String(r.id).trim() !== "" ? r.id : `room-row-${index}-${String(r.roomNumber)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">Room {r.roomNumber}</p>
                      <Badge variant="outline">{r.numberOfBeds} beds</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> Block:{" "}
                        {r.block && String(r.block).trim() !== ""
                          ? String(r.block)
                          : blocks.find((b) => b.id === effectiveBlockId)?.name ?? "—"}
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
    </>
  );

  const tenantTableSection = (
    <div className="space-y-4">
      {!selectedPgId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Select a PG</p>
            <p className="text-sm mt-1">Use the PG dropdown in the filter bar to load tenants.</p>
          </CardContent>
        </Card>
      ) : tenantsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tenantsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Could not load tenant list</p>
            <p className="text-sm mt-1">Check that the API exposes tenants for this property.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => tenantsQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">No tenants yet</p>
            <p className="text-sm mt-1">Use Add Tenant to invite someone, or adjust search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {filteredTenants.map((row) => (
            <TenantCard
              key={row.id}
              tenant={row}
              onOpen={() => {
                setDetailTenant(row);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <CanAccessPage permission="tenant_view">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isVacantRoomsPage ? "Vacant Rooms" : "Tenant list"}
        description={
          isVacantRoomsPage
            ? "View rooms with available beds for fast tenant allocation"
            : "Manage all your tenants across PGs"
        }
        actions={
          <>
          <Button size="sm" variant="outline" className="gap-2" disabled>
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2" disabled>
            <Send className="h-4 w-4" /> Send Invite
          </Button>
          <CanAccess permission="tenant_add">
            <Button size="sm" className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add Tenant
            </Button>
          </CanAccess>
          </>
        }
      />

      {isVacantRoomsPage ? (
        <>
          {filterBarEl}
          {roomsSection}
        </>
      ) : (
        <>
          {filterBarEl}

          <Tabs defaultValue="tenants" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tenants">All tenants</TabsTrigger>
              <TabsTrigger value="rooms">Rooms & beds</TabsTrigger>
            </TabsList>
            <TabsContent value="tenants" className="space-y-4">
              {tenantTableSection}
            </TabsContent>
            <TabsContent value="rooms" className="space-y-4">
              {roomsSection}
            </TabsContent>
          </Tabs>
        </>
      )}

      <TenantDetailDialog
        tenant={detailTenant}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) setDetailTenant(null);
        }}
        propertyId={selectedPgId}
        onSaved={(updated) => {
          setDetailTenant(updated);
          if (selectedPgId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tenants(selectedPgId) });
          }
        }}
      />

      <AddTenantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          if (selectedPgId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tenants(selectedPgId) });
            queryClient.invalidateQueries({ queryKey: ["property", selectedPgId, "rooms-list"] });
          }
        }}
      />
    </div>
    </CanAccessPage>
  );
};

export default Tenants;
