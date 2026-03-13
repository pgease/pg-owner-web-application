import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  Clock,
  Ban,
  ArrowLeft,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  useAmenities,
  useCreateCustomAmenity,
  useCreateCustomRestriction,
  useDiningSchedule,
  useLinkAmenities,
  useLinkRestrictions,
  useRestrictions,
  useUpdateDiningSchedule,
} from "@/hooks/usePropertyOwnerQueries";
import type { DiningDaySchedule } from "@/api/propertyOwner";

const MyPGs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPgId, properties } = useApp();
  const isBankPage = location.pathname === "/my-pgs/bank";
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: amenities = [], isLoading: amenitiesLoading, isError: amenitiesError, refetch: refetchAmenities } = useAmenities(selectedPgId);
  const { data: restrictions = [], isLoading: restrictionsLoading, isError: restrictionsError, refetch: refetchRestrictions } = useRestrictions(selectedPgId);
  const { data: dining = [], isLoading: diningLoading, isError: diningError, refetch: refetchDining } = useDiningSchedule(selectedPgId);

  const createAmenity = useCreateCustomAmenity(selectedPgId);
  const linkAmenityMutation = useLinkAmenities(selectedPgId);
  const createRestriction = useCreateCustomRestriction(selectedPgId);
  const linkRestrictionMutation = useLinkRestrictions(selectedPgId);
  const updateDiningMutation = useUpdateDiningSchedule(selectedPgId);

  const [newAmenity, setNewAmenity] = useState("");
  const [newRestriction, setNewRestriction] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [selectedRestrictionIds, setSelectedRestrictionIds] = useState<string[]>([]);

  const [breakfastMenu, setBreakfastMenu] = useState("");
  const [lunchMenu, setLunchMenu] = useState("");
  const [dinnerMenu, setDinnerMenu] = useState("");
  const [breakfastStart, setBreakfastStart] = useState("09:00");
  const [breakfastEnd, setBreakfastEnd] = useState("10:00");
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [dinnerStart, setDinnerStart] = useState("20:00");
  const [dinnerEnd, setDinnerEnd] = useState("21:00");

  useEffect(() => {
    setSelectedAmenityIds(amenities.map((a) => a.id));
  }, [amenities]);

  useEffect(() => {
    setSelectedRestrictionIds(restrictions.map((r) => r.id));
  }, [restrictions]);

  useEffect(() => {
    const first = Array.isArray(dining) ? dining.find((d) => d.dayOfWeek === 1) : undefined;
    if (first) {
      setBreakfastMenu(first.breakfast?.menu ?? "");
      setLunchMenu(first.lunch?.menu ?? "");
      setDinnerMenu(first.dinner?.menu ?? "");
      setBreakfastStart(first.breakfast?.startTime ?? "09:00");
      setBreakfastEnd(first.breakfast?.endTime ?? "10:00");
      setLunchStart(first.lunch?.startTime ?? "13:00");
      setLunchEnd(first.lunch?.endTime ?? "14:00");
      setDinnerStart(first.dinner?.startTime ?? "20:00");
      setDinnerEnd(first.dinner?.endTime ?? "21:00");
    }
  }, [dining]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleRestriction = (id: string) => {
    setSelectedRestrictionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveAmenities = async () => {
    try {
      await linkAmenityMutation.mutateAsync({ amenityIds: selectedAmenityIds });
      toast({ title: "Amenities updated" });
      refetchAmenities();
    } catch (e: any) {
      toast({ title: "Failed to update amenities", description: e?.message, variant: "destructive" });
    }
  };

  const saveRestrictions = async () => {
    try {
      await linkRestrictionMutation.mutateAsync({ restrictionIds: selectedRestrictionIds });
      toast({ title: "Restrictions updated" });
      refetchRestrictions();
    } catch (e: any) {
      toast({ title: "Failed to update restrictions", description: e?.message, variant: "destructive" });
    }
  };

  const addAmenity = async () => {
    if (!newAmenity.trim()) return;
    try {
      await createAmenity.mutateAsync({ name: newAmenity.trim() });
      setNewAmenity("");
      toast({ title: "Amenity created" });
      refetchAmenities();
    } catch (e: any) {
      toast({ title: "Failed to create amenity", description: e?.message, variant: "destructive" });
    }
  };

  const addRestriction = async () => {
    if (!newRestriction.trim()) return;
    try {
      await createRestriction.mutateAsync({ name: newRestriction.trim() });
      setNewRestriction("");
      toast({ title: "Restriction created" });
      refetchRestrictions();
    } catch (e: any) {
      toast({ title: "Failed to create restriction", description: e?.message, variant: "destructive" });
    }
  };

  const saveDining = async () => {
    const payload: DiningDaySchedule[] = [
      {
        dayOfWeek: 1,
        breakfast: { menu: breakfastMenu, startTime: breakfastStart, endTime: breakfastEnd },
        lunch: { menu: lunchMenu, startTime: lunchStart, endTime: lunchEnd },
        dinner: { menu: dinnerMenu, startTime: dinnerStart, endTime: dinnerEnd },
      },
    ];
    try {
      await updateDiningMutation.mutateAsync(payload);
      toast({ title: "Dining schedule updated" });
      refetchDining();
    } catch (e: any) {
      toast({ title: "Failed to update dining", description: e?.message, variant: "destructive" });
    }
  };

  if (isBankPage) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate("/my-pgs")}>
          <ArrowLeft className="h-4 w-4" /> Back to My PG
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank account</h1>
          <p className="text-sm text-muted-foreground">Add bank or UPI details for collecting PG rent</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Bank account setup coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Link your bank account or UPI to receive rent payments directly. This feature will be available in an upcoming update.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My PG</h1>
        <p className="text-sm text-muted-foreground">
          Manage amenities, restrictions and dining schedule for {selectedPg?.name ?? "your PG"}
        </p>
      </div>

      {!selectedPgId ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Select a PG from the header to manage settings.
          </CardContent>
        </Card>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" /> Amenities
            </h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                {amenitiesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : amenitiesError ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Failed to load amenities.</p>
                    <Button size="sm" variant="outline" onClick={() => refetchAmenities()}>Retry</Button>
                  </div>
                ) : amenities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No amenities linked to this PG yet.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {amenities.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selectedAmenityIds.includes(a.id)} onCheckedChange={() => toggleAmenity(a.id)} />
                        <span>{a.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Add custom amenity" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} />
                  <Button variant="outline" onClick={addAmenity} disabled={createAmenity.isPending}>
                    {createAmenity.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
                <Button onClick={saveAmenities} disabled={linkAmenityMutation.isPending}>
                  {linkAmenityMutation.isPending ? "Saving..." : "Save Amenities"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ban className="h-5 w-5" /> Restrictions
            </h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                {restrictionsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : restrictionsError ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Failed to load restrictions.</p>
                    <Button size="sm" variant="outline" onClick={() => refetchRestrictions()}>Retry</Button>
                  </div>
                ) : restrictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No restrictions linked to this PG yet.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {restrictions.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selectedRestrictionIds.includes(r.id)} onCheckedChange={() => toggleRestriction(r.id)} />
                        <span>{r.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Add custom restriction" value={newRestriction} onChange={(e) => setNewRestriction(e.target.value)} />
                  <Button variant="outline" onClick={addRestriction} disabled={createRestriction.isPending}>
                    {createRestriction.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
                <Button onClick={saveRestrictions} disabled={linkRestrictionMutation.isPending}>
                  {linkRestrictionMutation.isPending ? "Saving..." : "Save Restrictions"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" /> Dining Schedule
            </h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                {diningLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : diningError ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Failed to load dining schedule.</p>
                    <Button size="sm" variant="outline" onClick={() => refetchDining()}>Retry</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Breakfast menu</Label>
                        <Input value={breakfastMenu} onChange={(e) => setBreakfastMenu(e.target.value)} placeholder="Poha, tea" />
                      </div>
                      <div className="space-y-2">
                        <Label>Lunch menu</Label>
                        <Input value={lunchMenu} onChange={(e) => setLunchMenu(e.target.value)} placeholder="Rice, dal" />
                      </div>
                      <div className="space-y-2">
                        <Label>Dinner menu</Label>
                        <Input value={dinnerMenu} onChange={(e) => setDinnerMenu(e.target.value)} placeholder="Roti, sabzi" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Breakfast time</Label>
                        <div className="flex gap-2">
                          <Input type="time" value={breakfastStart} onChange={(e) => setBreakfastStart(e.target.value)} />
                          <Input type="time" value={breakfastEnd} onChange={(e) => setBreakfastEnd(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Lunch time</Label>
                        <div className="flex gap-2">
                          <Input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} />
                          <Input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dinner time</Label>
                        <div className="flex gap-2">
                          <Input type="time" value={dinnerStart} onChange={(e) => setDinnerStart(e.target.value)} />
                          <Input type="time" value={dinnerEnd} onChange={(e) => setDinnerEnd(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <Button onClick={saveDining} disabled={updateDiningMutation.isPending}>
                      {updateDiningMutation.isPending ? "Saving..." : "Save Dining Schedule"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Bank details for collecting PG rent
          <Badge variant="outline">Coming soon</Badge>
        </h2>
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => navigate("/my-pgs/bank")}>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Add bank account</p>
              <p className="text-sm text-muted-foreground">Link UPI or bank account to receive rent payments</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default MyPGs;
