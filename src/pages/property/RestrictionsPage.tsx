import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Plus,
  Check,
  Search,
  Clock,
  Volume2,
  Users,
  Cigarette,
  Wine,
  PawPrint,
  UtensilsCrossed,
  Sparkles,
  Save,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  useRestrictions,
  useCreateCustomRestriction,
  useLinkRestrictions,
} from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

// Standard Popular House Rules Catalog
const CATALOG_RESTRICTIONS = [
  {
    category: "Substance & Cleanliness",
    items: [
      { name: "Smoking Strictly Prohibited", icon: Cigarette },
      { name: "Alcohol & Drugs Strictly Forbidden", icon: Wine },
      { name: "Non-Vegetarian Food Restricted", icon: UtensilsCrossed },
      { name: "Pets Not Allowed", icon: PawPrint },
    ],
  },
  {
    category: "Entry Timings & Visitors",
    items: [
      { name: "Gate Closes at 11:00 PM Sharp", icon: Clock },
      { name: "No Opposite Gender in Rooms", icon: Users },
      { name: "No Overnight Outside Guests Without Prior Pass", icon: Users },
      { name: "Visitors Permitted Only in Common Lobby", icon: Users },
    ],
  },
  {
    category: "Community & Decorum",
    items: [
      { name: "No Loud Music / Noise After 10:00 PM", icon: Volume2 },
      { name: "Heavy Electrical Appliances (Heaters/Induction) Not Allowed", icon: AlertTriangle },
      { name: "Mandatory 30-Day Move-out Notice Period", icon: Clock },
      { name: "Police Verification / Aadhaar KYC Mandatory Before Check-in", icon: ShieldCheck },
    ],
  },
];

export const RestrictionsPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: restrictions = [], isLoading, isError, refetch } = useRestrictions(selectedPgId);
  const createRestrictionMutation = useCreateCustomRestriction(selectedPgId);
  const linkRestrictionMutation = useLinkRestrictions(selectedPgId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customRuleName, setCustomRuleName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selected restriction IDs from server data
  useEffect(() => {
    if (restrictions && restrictions.length > 0) {
      setSelectedIds(restrictions.map((r) => r.id));
    }
  }, [restrictions]);

  const toggleRestriction = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveRestrictions = async () => {
    if (!selectedPgId) {
      toast({ title: "Please select a PG first", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await linkRestrictionMutation.mutateAsync({ restrictionIds: selectedIds });
      toast({
        title: "House Rules Updated",
        description: `Successfully configured ${selectedIds.length} house rules for ${selectedPg?.name || "your PG"}.`,
      });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Failed to update house rules",
        description: e?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustom = async () => {
    const trimmed = customRuleName.trim();
    if (!trimmed) {
      toast({ title: "Please enter rule text", variant: "destructive" });
      return;
    }
    try {
      const created: any = await createRestrictionMutation.mutateAsync({ name: trimmed });
      setCustomRuleName("");
      setAddDialogOpen(false);
      toast({ title: "House Rule Created", description: `"${trimmed}" is now available to enforce.` });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({
        title: "Failed to create rule",
        description: e?.message || "Unable to save rule",
        variant: "destructive",
      });
    }
  };

  const handleQuickAddFromCatalog = async (name: string) => {
    const existing = restrictions.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      toggleRestriction(existing.id);
      return;
    }
    try {
      const created: any = await createRestrictionMutation.mutateAsync({ name });
      toast({ title: "Rule Added", description: `"${name}" added.` });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({ title: "Failed to add", description: e?.message, variant: "destructive" });
    }
  };

  const filteredRestrictions = useMemo(() => {
    if (!searchQuery.trim()) return restrictions;
    return restrictions.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [restrictions, searchQuery]);

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
                <Ban className="h-6 w-6 text-rose-600" />
                Property Restrictions & House Rules
              </h1>
              <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 text-xs font-bold">
                {selectedIds.length} Enforced
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Define rules and policies that tenants agree to during onboarding and on their digital agreement for {selectedPg?.name || "your PG"}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-border shadow-xs"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-rose-600" /> Add Custom Rule
            </Button>
            <CanAccess permission="room_edit">
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                onClick={handleSaveRestrictions}
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
              placeholder="Search house rules (e.g. Smoking, Curfew, Noise)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20 border-border/70"
            />
          </div>
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Toggle switches to activate or deactivate house policies</span>
          </div>
        </div>

        {/* Currently Enforced Rules Grid */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Enforced Rules at {selectedPg?.name || "Property"}</CardTitle>
                <CardDescription className="text-xs">
                  Active rules are attached to tenant rental agreements and displayed in the tenant mobile app.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                {restrictions.length} Configured
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load property restrictions.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                  Retry
                </Button>
              </div>
            ) : filteredRestrictions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {searchQuery ? "No rules matched your search." : "No custom rules created yet. Choose from the catalog below!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredRestrictions.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all",
                        isChecked
                          ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-xs"
                          : "bg-background border-border/70 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="space-y-0.5">
                        <span className={cn("text-xs font-bold block", isChecked ? "text-rose-950 dark:text-rose-200" : "text-foreground")}>
                          {r.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {isChecked ? "Active policy" : "Disabled"}
                        </span>
                      </div>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => toggleRestriction(r.id)}
                        className="data-[state=checked]:bg-rose-600"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog Categories */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">Standard Rule Catalog</h2>
              <p className="text-xs text-muted-foreground">Select common PG regulations below to add them to your house guidelines.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATALOG_RESTRICTIONS.map((group) => (
              <Card key={group.category} className="rounded-2xl border-border/80 shadow-xs bg-card flex flex-col">
                <CardHeader className="p-4 pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5 flex-1">
                  {group.items.map((item) => {
                    const match = restrictions.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
                    const isSelected = match ? selectedIds.includes(match.id) : false;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.name}
                        onClick={() => handleQuickAddFromCatalog(item.name)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer border",
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                            : "bg-muted/15 border-transparent hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-lg", isSelected ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <span
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border",
                            isSelected
                              ? "bg-rose-600 border-rose-600 text-white"
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

        {/* Dialog for Custom Rule */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-rose-600" /> Add Custom House Rule
              </DialogTitle>
              <DialogDescription className="text-xs">
                Write a specific restriction or condition for your PG (e.g. "Main gate closes at 10:30 PM", "Cooking inside room is not allowed").
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Rule description..."
                value={customRuleName}
                onChange={(e) => setCustomRuleName(e.target.value)}
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
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleCreateCustom}
                disabled={createRestrictionMutation.isPending}
              >
                {createRestrictionMutation.isPending ? "Adding..." : "Add House Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
};

export default RestrictionsPage;
