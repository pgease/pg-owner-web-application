import { Building2, Plus, MapPin, Wifi, Utensils, Zap, BedDouble } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const pgs = [
  { name: "Sunshine PG", location: "Koramangala, Bangalore", totalBeds: 60, occupied: 52, rooms: 20, facilities: ["WiFi", "Food", "Power Backup"], type: "Male" },
  { name: "Green Valley PG", location: "HSR Layout, Bangalore", totalBeds: 45, occupied: 38, rooms: 15, facilities: ["WiFi", "Food"], type: "Female" },
  { name: "Metro Stay", location: "Indiranagar, Bangalore", totalBeds: 80, occupied: 74, rooms: 30, facilities: ["WiFi", "Food", "Power Backup", "Gym"], type: "Co-living" },
  { name: "City PG", location: "BTM Layout, Bangalore", totalBeds: 30, occupied: 23, rooms: 10, facilities: ["WiFi"], type: "Male" },
];

const MyPGs = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My PGs</h1>
        <p className="text-sm text-muted-foreground">Manage your properties and buildings</p>
      </div>
      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add PG</Button>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {pgs.map((pg) => (
        <Card key={pg.name} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{pg.name}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {pg.location}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{pg.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Occupancy</span>
              <span className="font-medium">{pg.occupied}/{pg.totalBeds} beds</span>
            </div>
            <Progress value={(pg.occupied / pg.totalBeds) * 100} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{pg.rooms} rooms</span>
              <span className="text-primary font-medium">{pg.totalBeds - pg.occupied} vacant</span>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-1">
              {pg.facilities.map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default MyPGs;
