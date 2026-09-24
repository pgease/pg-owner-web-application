import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { PERMISSION_GROUPS, type Tier, type PermissionAction, type PermissionDef } from "@/constants/permissionGroups";
import { ROLE_PRESETS, ROLE_LABELS, type PresetCell } from "@/constants/rolePresets";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { usePermissions } from "@/context/PermissionContext";
import { useApp } from "@/context/AppContext";
import { useStaffList } from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

const TIER_META: Record<Tier, { label: string; badgeClass: string; desc: string }> = {
  free: {
    label: "FREE",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    desc: "Available to all PG owners without active subscription",
  },
  lite: {
    label: "LITE (₹29/bed)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    desc: "Unlocked in Lite & Pro plans (core property operations)",
  },
  pro: {
    label: "PRO (₹49/bed)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    desc: "Exclusive to Pro plan (automation, group chat & deletion privileges)",
  },
};

const ACTION_META: Record<PermissionAction, { label: string; icon: any; badgeClass: string }> = {
  view: {
    label: "VIEW ONLY",
    icon: Eye,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
  },
  edit: {
    label: "EDIT / ACTION",
    icon: Edit3,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  delete: {
    label: "DELETE / PURGE",
    icon: Trash2,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  admin: {
    label: "ADMIN CONTROL",
    icon: Shield,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  },
};

export default function PermissionsMatrixPage() {
  const { currentPlan, isTrial, trialDaysRemaining, isExpired } = useSubscriptionAccess();
  const { isOwner } = usePermissions();
  const { selectedPgId } = useApp();
  const staffQuery = useStaffList(selectedPgId ?? undefined);

  const [activeTab, setActiveTab] = useState<"roles_matrix" | "plan_tiers" | "tester">("roles_matrix");
  const [search, setSearch] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<"all" | "view" | "edit">("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"all" | Tier>("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  // Tester simulation state
  const [simRole, setSimRole] = useState<string>("cleaner");
  const [simPermissionKey, setSimPermissionKey] = useState<string>("tenant_edit_basic");

  // Flattened all permissions
  const allPermissions = useMemo(() => {
    return PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((p) => ({
        ...p,
        groupId: group.id,
        groupLabel: group.label,
        category: group.category,
      }))
    );
  }, []);

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      if (selectedActionFilter === "view" && p.action !== "view") return false;
      if (selectedActionFilter === "edit" && p.action === "view") return false;
      if (selectedTierFilter !== "all" && p.tier !== selectedTierFilter) return false;
      if (selectedGroupFilter !== "all" && p.groupId !== selectedGroupFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.backendFeatureKey.toLowerCase().includes(q) ||
          p.groupLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allPermissions, selectedActionFilter, selectedTierFilter, selectedGroupFilter, search]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = allPermissions.length;
    const viewOnly = allPermissions.filter((p) => p.action === "view").length;
    const editActions = allPermissions.filter((p) => p.action !== "view").length;
    const proTiers = allPermissions.filter((p) => p.tier === "pro").length;
    const liteTiers = allPermissions.filter((p) => p.tier === "lite").length;
    const freeTiers = allPermissions.filter((p) => p.tier === "free").length;
    return { total, viewOnly, editActions, proTiers, liteTiers, freeTiers };
  }, [allPermissions]);

  // Role simulation resolution
  const simulationResult = useMemo(() => {
    const perm = allPermissions.find((p) => p.key === simPermissionKey);
    if (!perm) return null;

    const preset = ROLE_PRESETS[simRole] || {};
    const roleAccess = preset[perm.key];
    const isRoleAllowed = roleAccess === "always" || roleAccess === true;

    // Check Plan requirement
    let isPlanAllowed = true;
    if (isExpired) {
      isPlanAllowed = perm.tier === "free";
    } else if (currentPlan === "LITE") {
      isPlanAllowed = perm.tier === "free" || perm.tier === "lite";
    } else {
      isPlanAllowed = true; // PRO or TRIAL gives all tiers
    }

    const isGranted = isRoleAllowed && isPlanAllowed;

    return {
      permission: perm,
      roleAccess,
      isRoleAllowed,
      isPlanAllowed,
      isGranted,
    };
  }, [allPermissions, simRole, simPermissionKey, currentPlan, isExpired]);

  const renderRoleCell = (roleKey: string, permKey: string) => {
    const preset = ROLE_PRESETS[roleKey] || {};
    const cell: PresetCell | undefined = preset[permKey];

    if (cell === "always") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 rounded px-1.5 py-0.5">
          <Lock className="h-2.5 w-2.5" /> Required
        </span>
      );
    }
    if (cell === true) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 rounded px-1.5 py-0.5">
          <CheckCircle2 className="h-3 w-3" /> Enabled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 bg-muted/40 border border-border/40 rounded px-1.5 py-0.5">
        <XCircle className="h-3 w-3 text-muted-foreground/40" /> Locked
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24 animate-fade-in">
      <PageHeader
        title="Permissions & Access Matrix"
        description="Comprehensive View vs Edit capability breakdown, plan pricing tier mappings, and staff role presets."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/team">
                <Users className="h-4 w-4 mr-1.5" /> Team Roster
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/team/add-staff">
                <Shield className="h-4 w-4 mr-1.5" /> Add Staff Member
              </Link>
            </Button>
          </div>
        }
      />

      {/* Subscription & Plan Status Banner */}
      <Card className="border-border/70 bg-gradient-to-r from-primary/5 via-background to-purple-500/5 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Active Property Plan:{" "}
                  <span className="text-primary font-black uppercase">
                    {isTrial ? "PRO 45-DAY TRIAL" : currentPlan || "LITE"}
                  </span>
                </h3>
                <Badge variant="outline" className="text-[11px] font-bold bg-primary/10 text-primary border-primary/20">
                  {isTrial ? `${trialDaysRemaining} Days Left in Trial` : "Full Access Active"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permissions are governed by two levels: <strong>1) Plan Tier</strong> (Free / Lite / Pro) and <strong>2) Staff Designation</strong> (Manager, Caretaker, Cleaner, Warden).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
              <Link to="/plans">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Upgrade / Change Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Core Scenarios Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-border/60 bg-background/80 shadow-2xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">🧹</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                View Only
              </Badge>
            </div>
            <h4 className="font-bold text-sm text-foreground">Cleaner Role</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Can <strong>view rooms and tenant roster</strong> (to clean rooms), but <strong>CANNOT edit</strong> tenant details. <strong>Rent & payments completely hidden</strong>.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80 shadow-2xs hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">🛡️</span>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold">
                Operations Only
              </Badge>
            </div>
            <h4 className="font-bold text-sm text-foreground">Caretaker Role</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manages complaints, rooms, check-in, and attendance. <strong>Owner hides payment transactions and rent received/due ledger</strong> from caretaker.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80 shadow-2xs hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">👔</span>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase font-bold">
                View + Edit
              </Badge>
            </div>
            <h4 className="font-bold text-sm text-foreground">Manager Role</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full administrative authority. Can <strong>view and edit</strong> tenants, rooms, rent ledger, expenses, and issue reports. Delete restricted to Owner.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80 shadow-2xs hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">🚨</span>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] uppercase font-bold">
                Security Only
              </Badge>
            </div>
            <h4 className="font-bold text-sm text-foreground">Warden Role</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gate pass approval, night out curfew tracking, daily attendance, visitor logs, and complaints. Zero access to finance or accounting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="roles_matrix" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Staff Roles Matrix
            </TabsTrigger>
            <TabsTrigger value="plan_tiers" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> Plan Tiers & Backend Catalog
            </TabsTrigger>
            <TabsTrigger value="tester" className="gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Interactive Access Simulator
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">{stats.total} total keys</span>
            <span>•</span>
            <span className="text-sky-600 font-semibold">{stats.viewOnly} View</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{stats.editActions} Edit/Action</span>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/60 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by permission title, description, or backend key (e.g. room_view, rent_management)..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View vs Edit filter */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/50">
              <button
                type="button"
                onClick={() => setSelectedActionFilter("all")}
                className={cn(
                  "px-2 py-1 text-[11px] rounded font-medium transition-colors",
                  selectedActionFilter === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setSelectedActionFilter("view")}
                className={cn(
                  "px-2 py-1 text-[11px] rounded font-medium transition-colors flex items-center gap-1",
                  selectedActionFilter === "view" ? "bg-sky-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-3 w-3" /> View Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedActionFilter("edit")}
                className={cn(
                  "px-2 py-1 text-[11px] rounded font-medium transition-colors flex items-center gap-1",
                  selectedActionFilter === "edit" ? "bg-amber-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Edit3 className="h-3 w-3" /> Edit / Action
              </button>
            </div>

            {/* Plan Tier filter */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/50">
              {(["all", "free", "lite", "pro"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTierFilter(tier)}
                  className={cn(
                    "px-2 py-1 text-[11px] rounded font-medium uppercase transition-colors",
                    selectedTierFilter === tier
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Module Filter */}
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
            >
              <option value="all">All Modules ({PERMISSION_GROUPS.length})</option>
              {PERMISSION_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Staff Roles Matrix */}
        <TabsContent value="roles_matrix" className="space-y-4">
          <Card className="border-border/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <Table variant="compact">
                <TableHeader className="bg-muted/40 text-xs">
                  <TableRow>
                    <TableHead className="w-[300px]">Permission & Backend Key</TableHead>
                    <TableHead className="w-[120px]">Capability</TableHead>
                    <TableHead className="w-[100px]">Plan Tier</TableHead>
                    <TableHead className="text-center font-bold text-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20">
                      Manager
                    </TableHead>
                    <TableHead className="text-center font-bold text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">
                      Caretaker
                    </TableHead>
                    <TableHead className="text-center font-bold text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">
                      Cleaner
                    </TableHead>
                    <TableHead className="text-center font-bold text-purple-700 bg-purple-50/40 dark:bg-purple-950/20">
                      Warden
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border/40">
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No permissions found matching your filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((p) => {
                      const actionMeta = ACTION_META[p.action] || ACTION_META.view;
                      const ActionIcon = actionMeta.icon;
                      const tierMeta = TIER_META[p.tier];

                      return (
                        <TableRow key={p.key} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="align-top py-3">
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                {p.name}
                              </div>
                              <p className="text-xs text-muted-foreground leading-normal">{p.desc}</p>
                              <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-muted-foreground/75">
                                <span>key: <code className="text-foreground font-semibold">{p.key}</code></span>
                                <span>•</span>
                                <span>module: <code>{p.groupLabel}</code></span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="align-top py-3">
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0 h-4.5 gap-1", actionMeta.badgeClass)}
                            >
                              <ActionIcon className="h-2.5 w-2.5" />
                              {actionMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="align-top py-3">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border",
                                tierMeta.badgeClass
                              )}
                            >
                              {p.tier}
                            </span>
                          </TableCell>

                          <TableCell className="text-center align-top py-3 bg-indigo-50/15 dark:bg-indigo-950/10">
                            {renderRoleCell("manager", p.key)}
                          </TableCell>

                          <TableCell className="text-center align-top py-3 bg-amber-50/15 dark:bg-amber-950/10">
                            {renderRoleCell("caretaker", p.key)}
                          </TableCell>

                          <TableCell className="text-center align-top py-3 bg-emerald-50/15 dark:bg-emerald-950/10">
                            {renderRoleCell("cleaner", p.key)}
                          </TableCell>

                          <TableCell className="text-center align-top py-3 bg-purple-50/15 dark:bg-purple-950/10">
                            {renderRoleCell("warden", p.key)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Plan Tiers & Backend Catalog */}
        <TabsContent value="plan_tiers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">FREE TIER</Badge>
                  <span className="text-xs font-bold text-emerald-700">₹0 / month</span>
                </div>
                <CardTitle className="text-base font-bold">Standard Operations</CardTitle>
                <CardDescription className="text-xs">
                  Basic read/write for single owner or small properties.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <p>✓ Room viewing & basic floor plan</p>
                <p>✓ Tenant contact roster</p>
                <p>✓ Manual complaint logging</p>
                <p>✓ Mobile app access for staff</p>
                <p className="text-foreground font-semibold pt-1">
                  {stats.freeTiers} features always unlocked
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">LITE PLAN</Badge>
                  <span className="text-xs font-bold text-amber-700">₹29 / bed / mo</span>
                </div>
                <CardTitle className="text-base font-bold">Commercial Management</CardTitle>
                <CardDescription className="text-xs">
                  Financial ledger, WhatsApp reminders, and staff delegation.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <p>✓ Rent & dues ledger (hideable per staff)</p>
                <p>✓ WhatsApp payment reminders</p>
                <p>✓ Expense tracking ledger</p>
                <p>✓ Staff roles & granular permissions</p>
                <p className="text-foreground font-semibold pt-1">
                  {stats.liteTiers} additional core features
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200/60 bg-purple-50/20 dark:bg-purple-950/10 shadow-2xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">PRO PLAN</Badge>
                  <span className="text-xs font-bold text-purple-700">₹49 / bed / mo</span>
                </div>
                <CardTitle className="text-base font-bold">Pro Automation & Chat</CardTitle>
                <CardDescription className="text-xs">
                  Private PG group chat, automated gateway, and record deletion.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <p>✓ Private PG Group Chat (verified)</p>
                <p>✓ Automated Payment Gateway collection</p>
                <p>✓ Dedicated PG Website & discovery</p>
                <p>✓ Record deletion & purge privileges</p>
                <p className="text-foreground font-semibold pt-1">
                  {stats.proTiers} enterprise features
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Full Backend Catalog Table */}
          <Card className="border-border/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <Table variant="compact">
                <TableHeader className="bg-muted/40 text-xs">
                  <TableRow>
                    <TableHead className="w-[280px]">Frontend Permission Key</TableHead>
                    <TableHead className="w-[220px]">Backend Feature Key</TableHead>
                    <TableHead className="w-[120px]">Backend Action</TableHead>
                    <TableHead className="w-[140px]">Required Plan</TableHead>
                    <TableHead className="w-[120px]">Property Status</TableHead>
                    <TableHead>Functional Scope</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border/40">
                  {filteredPermissions.map((p) => {
                    let isUnlocked = true;
                    if (isExpired) {
                      isUnlocked = p.tier === "free";
                    } else if (currentPlan === "LITE") {
                      isUnlocked = p.tier === "free" || p.tier === "lite";
                    } else {
                      isUnlocked = true; // PRO or Trial
                    }

                    return (
                      <TableRow key={p.key} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono font-bold text-foreground py-2.5">
                          {p.key}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground py-2.5">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-foreground">
                            {p.backendFeatureKey}
                          </code>
                        </TableCell>
                        <TableCell className="font-mono uppercase text-muted-foreground py-2.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {p.backendAction}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-bold uppercase", TIER_META[p.tier].badgeClass)}
                          >
                            {TIER_META[p.tier].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5">
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Unlock className="h-3 w-3" /> Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                              <Lock className="h-3 w-3" /> Gated
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-2.5 max-w-xs truncate">
                          {p.desc}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Interactive Access Simulator */}
        <TabsContent value="tester" className="space-y-4">
          <Card className="border-border/60 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Live Staff Role & Permission Tester
              </CardTitle>
              <CardDescription className="text-xs">
                Simulate how specific permissions resolve for different staff members under your active subscription plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Select Staff Role Preset</label>
                  <select
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="cleaner">🧹 Cleaner (View Rooms/Tenants Only, Financials Hidden)</option>
                    <option value="caretaker">🛡️ Caretaker (Maintenance & Rooms, Financials Hidden by Default)</option>
                    <option value="manager">👔 Manager (Full Operations View & Edit)</option>
                    <option value="warden">🚨 Warden (Security & Gate Only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Select Capability to Test</label>
                  <select
                    value={simPermissionKey}
                    onChange={(e) => setSimPermissionKey(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {allPermissions.map((p) => (
                      <option key={p.key} value={p.key}>
                        [{p.action.toUpperCase()}] {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {simulationResult && (
                <div className={cn(
                  "p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                  simulationResult.isGranted
                    ? "bg-emerald-50/30 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-rose-50/30 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800"
                )}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      {simulationResult.isGranted ? (
                        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                          ✓
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                          ✕
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {simulationResult.isGranted ? "Access Granted" : "Access Blocked / Restricted"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Testing <strong>{simulationResult.permission.name}</strong> for role <strong>{ROLE_LABELS[simRole]?.title || simRole}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Role Designation Privilege:</span>
                        {simulationResult.isRoleAllowed ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                            Allowed by Role
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                            Denied by Role Policy
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Subscription Plan Entitlement:</span>
                        {simulationResult.isPlanAllowed ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                            Plan Entitlement Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                            Requires Pro Plan Upgrade
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                    <Button size="sm" variant="outline" asChild className="text-xs h-8">
                      <Link to="/team">
                        Manage Staff Team <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
