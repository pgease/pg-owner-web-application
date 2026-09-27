import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { DashboardData, DashboardRoom } from "./useDashboardData";
import { cn } from "@/lib/utils";

type Filter = "all" | "vacant" | "full";
const MAX_VISIBLE = 12;
const MAX_BED_ICONS = 8;

function RoomTile({ room, onClick }: { room: DashboardRoom; onClick: () => void }) {
  const icons = Math.min(room.totalBeds, MAX_BED_ICONS);
  const overflow = room.totalBeds - icons;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Room ${room.roomNumber}, ${room.occupiedBeds} of ${room.totalBeds} beds occupied`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Room {room.roomNumber}</span>
        <StatusBadge status={room.isFull ? "occupied" : "vacant"} label={room.isFull ? "Full" : `${room.availableBeds} vacant`} size="sm" />
      </div>
      <div className="flex flex-wrap items-center gap-1" aria-hidden>
        {Array.from({ length: icons }).map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded border",
              idx < room.occupiedBeds ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground/60",
            )}
          >
            <BedDouble className="h-3.5 w-3.5" />
          </span>
        ))}
        {overflow > 0 ? <span className="pl-1 text-xs text-muted-foreground">+{overflow}</span> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {room.occupiedBeds}/{room.totalBeds} beds occupied
        {room.floorNumber != null ? ` · Floor ${room.floorNumber}` : ""}
      </p>
    </button>
  );
}

export function RoomGrid({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { rooms, loading } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(
    () => ({
      all: rooms.length,
      vacant: rooms.filter((r) => r.availableBeds > 0).length,
      full: rooms.filter((r) => r.isFull).length,
    }),
    [rooms],
  );

  const filtered = useMemo(() => {
    if (filter === "vacant") return rooms.filter((r) => r.availableBeds > 0);
    if (filter === "full") return rooms.filter((r) => r.isFull);
    return rooms;
  }, [rooms, filter]);

  const visible = showAll ? filtered : filtered.slice(0, MAX_VISIBLE);
  const hidden = filtered.length - visible.length;

  const goToRooms = () => navigate("/my-pgs/structure");

  return (
    <section aria-labelledby="rooms-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="rooms-heading" className="text-section-title">
          Rooms
        </h2>
        {rooms.length > 0 ? (
          <div className="flex items-center gap-1 rounded-md border bg-card p-0.5" role="tablist" aria-label="Filter rooms">
            {(
              [
                ["all", "All"],
                ["vacant", "Has vacancy"],
                ["full", "Full"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => {
                  setFilter(key);
                  setShowAll(false);
                }}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                  filter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {label} <span className="opacity-70">{counts[key]}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading.rooms ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[112px] rounded-lg" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed">
          <EmptyState
            compact
            icon={<BedDouble />}
            title="No rooms added yet"
            description="Set up blocks, floors and rooms once — then tenants can be assigned to beds."
            action={
              <Button size="sm" onClick={goToRooms}>
                Add your first room
              </Button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed">
          <EmptyState
            compact
            icon={<BedDouble />}
            title={filter === "vacant" ? "No vacant beds right now" : "No full rooms"}
            description={filter === "vacant" ? "Every bed is occupied. Nice." : "No room is fully occupied yet."}
            action={
              <Button size="sm" variant="outline" onClick={() => setFilter("all")}>
                Show all rooms
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((room) => (
              <RoomTile key={room.id} room={room} onClick={goToRooms} />
            ))}
          </div>
          {hidden > 0 ? (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                Show {hidden} more room{hidden === 1 ? "" : "s"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
