import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Check,
  Search,
  Wifi,
  Wind,
  Droplets,
  Zap,
  Shield,
  Trash2,
  Tv,
  Utensils,
  Car,
  Dumbbell,
  Shirt,
  DoorOpen,
  Coffee,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import {
  useAmenities,
  useCreateCustomAmenity,
  useLinkAmenities,
} from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

// Standard Popular Amenities Catalog for quick 1-click selection
const CATALOG_CATEGORIES = [
  {
    category: "Comfort & Utilities",
    items: [
      { name: "Air Conditioner (AC)", icon: Wind },
      { name: "Water Geyser / Heater", icon: Droplets },
      { name: "24x7 Power Backup", icon: Zap },
      { name: "RO Purified Drinking Water", icon: Coffee },
      { name: "High Speed WiFi Internet", icon: Wifi },
      { name: "Elevator / Lift", icon: DoorOpen },
    ],
  },
  {
    category: "Hygiene & Housekeeping",
    items: [
      { name: "Daily Room Cleaning", icon: Sparkles },
      { name: "Automatic Washing Machine", icon: Shirt },
      { name: "Attached Washroom", icon: Droplets },
      { name: "Common Refrigerator", icon: Coffee },
    ],
  },
  {
    category: "Security & Facilities",
    items: [
      { name: "CCTV Surveillance 24x7", icon: Shield },
      { name: "Biometric / Digital Lock Entry", icon: Shield },
      { name: "Resident Warden / Caretaker", icon: Shield },
      { name: "Two Wheeler Parking", icon: Car },
      { name: "Four Wheeler Parking", icon: Car },
      { name: "Common TV & Lounge", icon: Tv },
      { name: "Fitness Gym / Workout Area", icon: Dumbbell },
    ],
  },
];

export const AmenitiesPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: amenities = [], isLoading, isError, refetch } = useAmenities(selectedPgId);
  const createAmenityMutation = useCreateCustomAmenity(selectedPgId);
  const linkAmenityMutation = useLinkAmenities(selectedPgId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customAmenityName, setCustomAmenityName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selected amenity IDs from server data
  useEffect(() => {
    if (amenities && amenities.length > 0) {
      setSelectedIds(amenities.map((a) => a.id));
    }
  }, [amenities]);

  const toggleAmenity = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveAmenities = async () => {
    if (!selectedPgId) {
      toast({ title: "Please select a PG first", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await linkAmenityMutation.mutateAsync({ amenityIds: selectedIds });
      toast({
        title: "Amenities Updated",
        description: `Successfully configured ${selectedIds.length} amenities for ${selectedPg?.name || "your PG"}.`,
      });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Failed to update amenities",
        description: e?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustom = async () => {
    const trimmed = customAmenityName.trim();
    if (!trimmed) {
      toast({ title: "Please enter an amenity name", variant: "destructive" });
      return;
    }
    try {
      const created: any = await createAmenityMutation.mutateAsync({ name: trimmed });
      setCustomAmenityName("");
      setAddDialogOpen(false);
      toast({ title: "Amenity Created", description: `"${trimmed}" is now available to select.` });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({
        title: "Failed to create amenity",
        description: e?.message || "Unable to save amenity",
        variant: "destructive",
      });
    }
  };

  const handleQuickAddFromCatalog = async (name: string) => {
    // Check if it already exists in server amenities
    const existing = amenities.find((a) => a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      toggleAmenity(existing.id);
      return;
    }
    // Otherwise create it on the server and select it
    try {
      const created: any = await createAmenityMutation.mutateAsync({ name });
      toast({ title: "Added to Property", description: `"${name}" added.` });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({ title: "Failed to add", description: e?.message, variant: "destructive" });
    }
  };

  // Filter server amenities by search query
  const filteredAmenities = useMemo(() => {
    if (!searchQuery.trim()) return amenities;
    return amenities.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [amenities, searchQuery]);

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-6 animate-fade-in max-w-6xl pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/my-pgs")}
                title="Back to PG Settings"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-teal-600" />
                Property Amenities
              </h1>
              <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-xs font-bold">
                {selectedIds.length} Selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Manage resident features and amenities displayed on your tenant portal & listing for {selectedPg?.name || "your PG"}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-border shadow-xs"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-teal-600" /> Add Custom
            </Button>
            <CanAccess permission="room_edit">
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                onClick={handleSaveAmenities}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Search & Active Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search amenities (e.g. WiFi, AC, Geyser)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20 border-border/70"
            />
          </div>
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>Click any card to toggle availability</span>
          </div>
        </div>

        {/* Existing / Configured Amenities Grid */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Active Amenities at {selectedPg?.name || "Property"}</CardTitle>
                <CardDescription className="text-xs">
                  Amenities currently enabled will appear on the tenant onboarding and receipts.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                {amenities.length} Configured
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load property amenities.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                  Retry
                </Button>
              </div>
            ) : filteredAmenities.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {searchQuery ? "No amenities matched your search." : "No custom amenities created yet. Choose from the catalog below!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredAmenities.map((a) => {
                  const isChecked = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer group",
                        isChecked
                          ? "bg-teal-50/70 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 shadow-xs"
                          : "bg-background border-border/70 hover:border-slate-300 opacity-60 hover:opacity-100"
                      )}
                    >
                      <span className={cn("text-xs font-bold", isChecked ? "text-teal-950 dark:text-teal-200" : "text-foreground")}>
                        {a.name}
                      </span>
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-[11px] shrink-0 border transition-all",
                          isChecked
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 group-hover:border-slate-400"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Catalog Groupings for 1-click addition */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">Catalog Amenities</h2>
              <p className="text-xs text-muted-foreground">Select popular amenities below to quickly include them in your property.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATALOG_CATEGORIES.map((group) => (
              <Card key={group.category} className="rounded-2xl border-border/80 shadow-xs bg-card flex flex-col">
                <CardHeader className="p-4 pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5 flex-1">
                  {group.items.map((item) => {
                    const match = amenities.find((a) => a.name.toLowerCase() === item.name.toLowerCase());
                    const isAdded = Boolean(match);
                    const isSelected = match ? selectedIds.includes(match.id) : false;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.name}
                        onClick={() => handleQuickAddFromCatalog(item.name)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer border",
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200"
                            : "bg-muted/15 border-transparent hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-lg", isSelected ? "bg-teal-100 text-teal-700" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <span
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border",
                            isSelected
                              ? "bg-teal-600 border-teal-600 text-white"
                              : "border-slate-300 text-slate-400"
                          )}
                        >
                          {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3 w-3" />}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dialog for Custom Amenity */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" /> Add Custom Amenity
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create a customized amenity name for your property (e.g. "Library / Study Room", "Snooker Table").
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Amenity Name (e.g. TT Table, Gaming Zone)"
                value={customAmenityName}
                onChange={(e) => setCustomAmenityName(e.target.value)}
                className="h-10 text-xs rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCustom();
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleCreateCustom}
                disabled={createAmenityMutation.isPending}
              >
                {createAmenityMutation.isPending ? "Adding..." : "Add Amenity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
};

export default AmenitiesPage;
