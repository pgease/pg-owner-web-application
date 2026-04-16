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
import { useBlocks, useFloors, usePropertyTenants, useRoomsList } from "@/hooks/usePropertyOwnerQueries";
import { FilterBar } from "@/components/common/FilterBar";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import {
  tenantDisplayName,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
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
    let next = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      next = next.filter((row) => {
        const blob = [tenantDisplayName(row), tenantPhone(row), tenantRoomNo(row)].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }
    if (kycFilter === "verified") {
      next = next.filter((t) => tenantVerificationLabel(t) === "verified");
    } else if (kycFilter === "pending") {
      next = next.filter((t) => tenantVerificationLabel(t) !== "verified");
    }
    return next;
  }, [tenantsQuery.data, searchQuery, kycFilter]);

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
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              <span className="tabular-nums">{filteredTenants.length}</span> result{filteredTenants.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">KYC credits are managed in Plans when enabled.</span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-sky-50/90 hover:bg-sky-50/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/40">
                <TableHead className="font-semibold text-sky-950 dark:text-sky-50">Name</TableHead>
                <TableHead className="font-semibold text-sky-950 dark:text-sky-50">Room</TableHead>
                <TableHead className="font-semibold text-sky-950 dark:text-sky-50">Rent</TableHead>
                <TableHead className="hidden font-semibold text-sky-950 md:table-cell dark:text-sky-50">Next due</TableHead>
                <TableHead className="font-semibold text-sky-950 dark:text-sky-50">Dues</TableHead>
                <TableHead className="font-semibold text-sky-950 dark:text-sky-50">Status</TableHead>
                <TableHead className="text-right font-semibold text-sky-950 dark:text-sky-50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((row) => {
                const wa = row.phone ? waLink(row.phone) : null;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tenants/${row.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="text-xs font-medium">{tenantInitials(row)}</AvatarFallback>
                        </Avatar>
                        <Link
                          to={`/tenants/${row.id}`}
                          className="font-semibold text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tenantDisplayName(row)}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tenantRoomNo(row)}</TableCell>
                    <TableCell className="font-medium">{tenantRentAmount(row)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{tenantRentDueLabel(row)}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">—</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {statusLabel(row)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                          <Link to="/rent-payments" title="Rent & dues">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {tenantPhone(row) !== "—" ? (
                          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${phoneDigits(row.phone ?? "")}`} title="Call">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                        {wa ? (
                          <Button variant="outline" size="icon" className="h-8 w-8 text-emerald-600" asChild>
                            <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
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
                : "Search, filter, and open a tenant profile"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
              <div className="relative min-w-0 flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search your tenants…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={kycFilter} onValueChange={(v) => setKycFilter(v as typeof kycFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="KYC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tenants/vacant-rooms">Vacant rooms</Link>
              </Button>
            </FilterBar>

            {tenantTableSection}
          </>
        )}
      </div>
    </CanAccessPage>
  );
};

export default Tenants;
