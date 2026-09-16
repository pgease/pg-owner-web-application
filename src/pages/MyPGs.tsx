import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Save,
  Loader2,
  Sparkles,
  Layers,
  Ban,
  Utensils,
  CreditCard,
  Wifi,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { useUpdatePropertyMutation } from "@/hooks/usePropertyOwnerQueries";
import { DEFAULT_PROPERTY_TYPE_ID } from "@/api/propertyOwner";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";

const MyPGs = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties, refreshProperties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;
  const updatePropertyMutation = useUpdatePropertyMutation();

  const [pgName, setPgName] = useState("");
  const [pgAddress, setPgAddress] = useState("");
  const [pgPin, setPgPin] = useState("");
  const [pgBedRange, setPgBedRange] = useState("");

  useEffect(() => {
    if (!selectedPg) return;
    setPgName(selectedPg.name || "");
    setPgAddress(selectedPg.address || "");
    setPgPin(String(selectedPg.locationPin ?? ""));
    setPgBedRange(selectedPg.bedRange ?? "50-100");
  }, [selectedPg]);

  const savePropertyDetails = async () => {
    if (!selectedPgId || !selectedPg) {
      toast({ title: "Please select a PG first", variant: "destructive" });
      return;
    }
    if (!pgName.trim()) {
      toast({ title: "PG Name is required", variant: "destructive" });
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        propertyId: selectedPgId,
        payload: {
          name: pgName.trim(),
          address: pgAddress.trim(),
          locationPin: pgPin.trim(),
          bedRange: pgBedRange.trim() || "50-100",
          latitude: Number(selectedPg.latitude) || 0,
          longitude: Number(selectedPg.longitude) || 0,
          propertyTypeId: selectedPg.propertyTypeId || DEFAULT_PROPERTY_TYPE_ID,
          photos: selectedPg.photos || [],
        },
      });
      await refreshProperties();
      toast({
        title: "Property Details Saved",
        description: "Your PG profile has been updated successfully.",
      });
    } catch (e: unknown) {
      toast({
        title: "Failed to update property",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const quickNavCards = [
    {
      title: "Structure & Rooms",
      desc: "Manage blocks, floors, room numbers & bed allocations",
      url: "/my-pgs/structure",
      icon: Layers,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Amenities",
      desc: "Configure WiFi, AC, Geyser, Power backup & resident perks",
      url: "/my-pgs/amenities",
      icon: Sparkles,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "House Rules & Restrictions",
      desc: "Set entry curfew, guest policies, smoking & sound rules",
      url: "/my-pgs/restrictions",
      icon: Ban,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
    },
    {
      title: "Food & Dining Schedule",
      desc: "Daily meal timings, weekly menus and food timings",
      url: "/food",
      icon: Utensils,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "Bank Account & UPI",
      desc: "Setup direct bank payouts and instant QR code collections",
      url: "/my-pgs/bank",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              PG Details & Configuration
            </h1>
            {selectedPg && (
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-xs font-bold">
                Active Property
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage primary information and access property modules for {selectedPg?.name ?? "your PG"}
          </p>
        </div>

        {!selectedPgId ? (
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardContent className="p-8 text-center text-muted-foreground">
              Select a PG from the header to view and edit settings.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Primary Property Details Edit Card */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground">Property Information</CardTitle>
                <CardDescription className="text-xs">
                  Basic property profile shown to tenants on the app and invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">PG / Property Name</Label>
                    <Input
                      value={pgName}
                      onChange={(e) => setPgName(e.target.value)}
                      placeholder="e.g. Shivam PG"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Postal PIN Code</Label>
                    <Input
                      value={pgPin}
                      onChange={(e) => setPgPin(e.target.value)}
                      placeholder="e.g. 201001"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Full Address / Location</Label>
                    <Input
                      value={pgAddress}
                      onChange={(e) => setPgAddress(e.target.value)}
                      placeholder="e.g. Shipra Sun City, Ghaziabad, Uttar Pradesh"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Total Bed Capacity Range</Label>
                    <Input
                      value={pgBedRange}
                      onChange={(e) => setPgBedRange(e.target.value)}
                      placeholder="e.g. 20-50, 50-100"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <CanAccess permission="room_edit">
                    <Button
                      type="button"
                      onClick={savePropertyDetails}
                      disabled={updatePropertyMutation.isPending}
                      className="rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      {updatePropertyMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {updatePropertyMutation.isPending ? "Saving..." : "Save Property Details"}
                    </Button>
                  </CanAccess>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access to Dedicated Modules */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">Property Modules & Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {quickNavCards.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Card
                      key={mod.title}
                      className="rounded-2xl border-border/80 shadow-xs bg-card hover:shadow-md hover:border-border transition-all cursor-pointer group"
                      onClick={() => navigate(mod.url)}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105 ${mod.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{mod.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{mod.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </CanAccessPage>
  );
};

export default MyPGs;
