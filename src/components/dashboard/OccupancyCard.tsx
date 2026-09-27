import { useNavigate } from "react-router-dom";
import { BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import type { DashboardData } from "./useDashboardData";

/** Proportional occupancy ring drawn with SVG so the visual always matches the numbers. */
function OccupancyRing({ pct }: { pct: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 112 112" className="h-28 w-28 shrink-0" role="img" aria-label={`${filled}% beds occupied`}>
      <circle cx="56" cy="56" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dasharray] duration-500"
        strokeDasharray={`${(filled / 100) * c} ${c}`}
        transform="rotate(-90 56 56)"
      />
      <text x="56" y="52" textAnchor="middle" className="fill-foreground text-[22px] font-semibold tabular-nums">
        {filled}%
      </text>
      <text x="56" y="70" textAnchor="middle" className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        occupied
      </text>
    </svg>
  );
}

export function OccupancyCard({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { beds, tenants, rooms, loading } = data;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Occupancy</CardTitle>
        {!loading.rooms && beds.totalBeds > 0 ? (
          <span className="text-xs text-muted-foreground">
            {rooms.length} room{rooms.length === 1 ? "" : "s"} · {beds.totalBeds} bed{beds.totalBeds === 1 ? "" : "s"}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        {loading.rooms ? (
          <div className="flex items-center gap-6 py-2">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : beds.totalBeds === 0 ? (
          <EmptyState
            compact
            icon={<BedDouble />}
            title="No rooms or beds set up yet"
            description="Add your rooms and beds to start tracking occupancy."
            action={
              <Button size="sm" onClick={() => navigate("/my-pgs/structure")}>
                Add rooms & beds
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-6 py-2">
              <OccupancyRing pct={beds.occupancyPct} />
              <dl className="flex-1 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> Occupied
                  </dt>
                  <dd className="font-semibold tabular-nums">{beds.occupiedBeds}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" aria-hidden /> Vacant
                  </dt>
                  <dd className="font-semibold tabular-nums">{beds.vacantBeds}</dd>
                </div>
                {!loading.tenants ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-warning" aria-hidden /> On notice
                    </dt>
                    <dd className="font-semibold tabular-nums">{tenants.onNotice}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/tenants/vacant-rooms")}>
                Vacant beds
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/my-pgs/structure")}>
                Manage rooms
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
