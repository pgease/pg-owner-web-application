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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  useUpdatePropertyMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { DEFAULT_PROPERTY_TYPE_ID, type DiningDaySchedule } from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

const EMPTY_ARRAY: any[] = [];

const MyPGs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPgId, properties, refreshProperties } = useApp();
  const isBankPage = location.pathname === "/my-pgs/bank";
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: amenities = EMPTY_ARRAY, isLoading: amenitiesLoading, isError: amenitiesError, refetch: refetchAmenities } = useAmenities(selectedPgId);
  const { data: restrictions = EMPTY_ARRAY, isLoading: restrictionsLoading, isError: restrictionsError, refetch: refetchRestrictions } = useRestrictions(selectedPgId);
  const { data: dining = EMPTY_ARRAY, isLoading: diningLoading, isError: diningError, refetch: refetchDining } = useDiningSchedule(selectedPgId);

  const createAmenity = useCreateCustomAmenity(selectedPgId);
  const linkAmenityMutation = useLinkAmenities(selectedPgId);
  const createRestriction = useCreateCustomRestriction(selectedPgId);
  const linkRestrictionMutation = useLinkRestrictions(selectedPgId);
  const updateDiningMutation = useUpdateDiningSchedule(selectedPgId);
  const updatePropertyMutation = useUpdatePropertyMutation();

  const [pgName, setPgName] = useState("");
  const [pgAddress, setPgAddress] = useState("");
  const [pgLat, setPgLat] = useState("");
  const [pgLng, setPgLng] = useState("");
  const [pgPin, setPgPin] = useState("");
  const [pgBedRange, setPgBedRange] = useState("");
  const [pgTypeId, setPgTypeId] = useState(DEFAULT_PROPERTY_TYPE_ID);

  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [restrictionsOpen, setRestrictionsOpen] = useState(false);
  const [diningOpen, setDiningOpen] = useState(false);

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
    if (!selectedPg) return;
    setPgName(selectedPg.name);
    setPgAddress(selectedPg.address);
    setPgLat(String(selectedPg.latitude ?? ""));
    setPgLng(String(selectedPg.longitude ?? ""));
    setPgPin(String(selectedPg.locationPin ?? ""));
    setPgBedRange(selectedPg.bedRange ?? "50-100");
    setPgTypeId(selectedPg.propertyTypeId ?? DEFAULT_PROPERTY_TYPE_ID);
  }, [selectedPg]);

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

  const savePropertyDetails = async () => {
    if (!selectedPgId || !selectedPg) return;
    const lat = parseFloat(pgLat);
    const lng = parseFloat(pgLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ title: "Enter valid latitude and longitude", variant: "destructive" });
      return;
    }
    try {
      await updatePropertyMutation.mutateAsync({
        propertyId: selectedPgId,
        payload: {
          name: pgName.trim(),
          address: pgAddress.trim(),
          latitude: lat,
          longitude: lng,
          locationPin: pgPin.trim(),
          bedRange: pgBedRange.trim() || "50-100",
          propertyTypeId: pgTypeId.trim() || DEFAULT_PROPERTY_TYPE_ID,
          photos: [],
        },
      });
      await refreshProperties();
      toast({ title: "Property details saved" });
    } catch (e: unknown) {
      toast({
        title: "Failed to update property",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
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

  const formatTimeTo24h = (timeStr: string, fallback: string): string => {
    if (!timeStr) return fallback;
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      if (/^\d{2}$/.test(hh) && /^\d{2}$/.test(mm)) {
        return `${hh}:${mm}`;
      }
    }
    return fallback;
  };

  const saveDining = async () => {
    const payload: DiningDaySchedule[] = [
      {
        dayOfWeek: 1,
        breakfast: {
          menu: breakfastMenu,
          startTime: formatTimeTo24h(breakfastStart, "09:00"),
          endTime: formatTimeTo24h(breakfastEnd, "10:00"),
        },
        lunch: {
          menu: lunchMenu,
          startTime: formatTimeTo24h(lunchStart, "13:00"),
          endTime: formatTimeTo24h(lunchEnd, "14:00"),
        },
        dinner: {
          menu: dinnerMenu,
          startTime: formatTimeTo24h(dinnerStart, "20:00"),
          endTime: formatTimeTo24h(dinnerEnd, "21:00"),
        },
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
      <CanAccessPage permission="room_view">
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
      </CanAccessPage>
    );
  }

  return (
    <CanAccessPage permission="room_view">
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
            <h2 className="text-lg font-semibold mb-4">Property details</h2>
            <Card className="mb-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Edit PG details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={pgName} onChange={(e) => setPgName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Location PIN</Label>
                    <Input value={pgPin} onChange={(e) => setPgPin(e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={pgAddress} onChange={(e) => setPgAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Latitude</Label>
                    <Input value={pgLat} onChange={(e) => setPgLat(e.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <Label>Longitude</Label>
                    <Input value={pgLng} onChange={(e) => setPgLng(e.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <Label>Bed range</Label>
                    <Input value={pgBedRange} onChange={(e) => setPgBedRange(e.target.value)} placeholder="e.g. 50-100" />
                  </div>
                  <div className="space-y-1">
                    <Label>Property type ID</Label>
                    <Input value={pgTypeId} onChange={(e) => setPgTypeId(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <CanAccess permission="room_edit">
                  <Button
                    type="button"
                    onClick={savePropertyDetails}
                    disabled={updatePropertyMutation.isPending}
                  >
                    {updatePropertyMutation.isPending ? "Saving…" : "Save property details"}
                  </Button>
                </CanAccess>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-teal-600" /> Amenities
              </h2>
              <Button size="sm" variant="outline" onClick={() => setAmenitiesOpen(true)} className="rounded-xl border-slate-200">
                Configure Amenities
              </Button>
            </div>
            <Card className="mb-8 rounded-2xl shadow-sm border-slate-100">
              <CardContent className="p-5">
                {selectedAmenityIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No amenities selected. Click "Configure Amenities" to select.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                    {amenities
                      .filter((a) => selectedAmenityIds.includes(a.id))
                      .map((a) => (
                        <Badge key={a.id} variant="secondary" className="px-2.5 py-1 text-xs bg-teal-50 text-teal-800 border-teal-100 hover:bg-teal-50">
                          {a.name}
                        </Badge>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AMENITIES SIDEBAR SHEET */}
            <Sheet open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
              <SheetContent side="right" className="w-[400px] max-w-full overflow-y-auto space-y-6">
                <SheetHeader>
                  <SheetTitle>Configure Amenities</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
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
                    <div className="grid gap-3 border rounded-xl p-4 bg-muted/10">
                      {amenities.map((a) => (
                        <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <Checkbox checked={selectedAmenityIds.includes(a.id)} onCheckedChange={() => toggleAmenity(a.id)} />
                          <span className="font-medium text-foreground">{a.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs text-muted-foreground">Create Custom Amenity</Label>
                    <div className="flex gap-2">
                      <Input placeholder="e.g. Power Backup" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} />
                      <Button variant="outline" onClick={async () => {
                        await addAmenity();
                        setNewAmenity("");
                      }} disabled={createAmenity.isPending}>
                        {createAmenity.isPending ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={async () => {
                    await saveAmenities();
                    setAmenitiesOpen(false);
                  }} disabled={linkAmenityMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl">
                    {linkAmenityMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" /> Restrictions
              </h2>
              <Button size="sm" variant="outline" onClick={() => setRestrictionsOpen(true)} className="rounded-xl border-slate-200">
                Configure Restrictions
              </Button>
            </div>
            <Card className="mb-8 rounded-2xl shadow-sm border-slate-100">
              <CardContent className="p-5">
                {selectedRestrictionIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No restrictions selected. Click "Configure Restrictions" to select.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                    {restrictions
                      .filter((r) => selectedRestrictionIds.includes(r.id))
                      .map((r) => (
                        <Badge key={r.id} variant="destructive" className="px-2.5 py-1 text-xs bg-red-50 text-red-800 border-red-100 hover:bg-red-50">
                          {r.name}
                        </Badge>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RESTRICTIONS SIDEBAR SHEET */}
            <Sheet open={restrictionsOpen} onOpenChange={setRestrictionsOpen}>
              <SheetContent side="right" className="w-[400px] max-w-full overflow-y-auto space-y-6">
                <SheetHeader>
                  <SheetTitle>Configure Restrictions</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
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
                    <div className="grid gap-3 border rounded-xl p-4 bg-muted/10">
                      {restrictions.map((r) => (
                        <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <Checkbox checked={selectedRestrictionIds.includes(r.id)} onCheckedChange={() => toggleRestriction(r.id)} />
                          <span className="font-medium text-foreground">{r.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs text-muted-foreground">Create Custom Restriction</Label>
                    <div className="flex gap-2">
                      <Input placeholder="e.g. No Guests allowed after 10PM" value={newRestriction} onChange={(e) => setNewRestriction(e.target.value)} />
                      <Button variant="outline" onClick={async () => {
                        await addRestriction();
                        setNewRestriction("");
                      }} disabled={createRestriction.isPending}>
                        {createRestriction.isPending ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={async () => {
                    await saveRestrictions();
                    setRestrictionsOpen(false);
                  }} disabled={linkRestrictionMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl">
                    {linkRestrictionMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" /> Dining Schedule
              </h2>
              <Button size="sm" variant="outline" onClick={() => setDiningOpen(true)} className="rounded-xl border-slate-200">
                Configure Dining
              </Button>
            </div>
            <Card className="mb-8 rounded-2xl shadow-sm border-slate-100">
              <CardContent className="p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Breakfast</span>
                    <strong className="text-sm font-bold text-foreground block">{breakfastMenu || "Not configured"}</strong>
                    <span className="text-xs text-muted-foreground block mt-1">{breakfastStart ? `${breakfastStart} - ${breakfastEnd}` : "Time not set"}</span>
                  </div>
                  <div className="p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Lunch</span>
                    <strong className="text-sm font-bold text-foreground block">{lunchMenu || "Not configured"}</strong>
                    <span className="text-xs text-muted-foreground block mt-1">{lunchStart ? `${lunchStart} - ${lunchEnd}` : "Time not set"}</span>
                  </div>
                  <div className="p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Dinner</span>
                    <strong className="text-sm font-bold text-foreground block">{dinnerMenu || "Not configured"}</strong>
                    <span className="text-xs text-muted-foreground block mt-1">{dinnerStart ? `${dinnerStart} - ${dinnerEnd}` : "Time not set"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DINING SCHEDULE SIDEBAR SHEET */}
            <Sheet open={diningOpen} onOpenChange={setDiningOpen}>
              <SheetContent side="right" className="w-[450px] max-w-full overflow-y-auto space-y-6">
                <SheetHeader>
                  <SheetTitle>Configure Dining Schedule</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
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
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Breakfast Menu</Label>
                          <Input value={breakfastMenu} onChange={(e) => setBreakfastMenu(e.target.value)} placeholder="Poha, tea" />
                        </div>
                        <div className="space-y-2">
                          <Label>Breakfast Time</Label>
                          <div className="flex gap-2">
                            <Input type="time" value={breakfastStart} onChange={(e) => setBreakfastStart(e.target.value)} />
                            <Input type="time" value={breakfastEnd} onChange={(e) => setBreakfastEnd(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label>Lunch Menu</Label>
                          <Input value={lunchMenu} onChange={(e) => setLunchMenu(e.target.value)} placeholder="Rice, dal" />
                        </div>
                        <div className="space-y-2">
                          <Label>Lunch Time</Label>
                          <div className="flex gap-2">
                            <Input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} />
                            <Input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label>Dinner Menu</Label>
                          <Input value={dinnerMenu} onChange={(e) => setDinnerMenu(e.target.value)} placeholder="Roti, sabzi" />
                        </div>
                        <div className="space-y-2">
                          <Label>Dinner Time</Label>
                          <div className="flex gap-2">
                            <Input type="time" value={dinnerStart} onChange={(e) => setDinnerStart(e.target.value)} />
                            <Input type="time" value={dinnerEnd} onChange={(e) => setDinnerEnd(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={async () => {
                    await saveDining();
                    setDiningOpen(false);
                  }} disabled={updateDiningMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl">
                    {updateDiningMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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
    </CanAccessPage>
  );
};

export default MyPGs;
