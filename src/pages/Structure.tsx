import { Building2, Layers, DoorOpen, BedDouble, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

const Structure = () => {
  const { selectedPgId, properties } = useApp();
  const currentPg = properties.find((p) => p.id === selectedPgId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocks, Floors & Rooms</h1>
        <p className="text-sm text-muted-foreground">
          Add or adjust blocks, floors, rooms and beds for {currentPg?.name ?? "your PG"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Define blocks (e.g. A, B, C) in your PG.</p>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Block</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" /> Floors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Add floors in each block.</p>
            <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Floor</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DoorOpen className="h-4 w-4" /> Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Add rooms on each floor.</p>
            <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Room</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="h-4 w-4" /> Beds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Assign bed numbers in each room.</p>
            <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Bed</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Structure;
