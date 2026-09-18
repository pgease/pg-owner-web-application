import {
  ActivityLogsTimelineFeed,
  formatActivityLogToTimelineItem,
  DEFAULT_ACTIVITY_LOGS,
  type ActivityTimelineItem,
} from "@/components/activity-logs/ActivityLogsTimelineFeed";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Shield,
  User,
  Smartphone,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  IndianRupee,
  UserPlus,
  Home,
  MessageSquare,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { getActivityLogs, type ActivityLogItem } from "@/api/propertyOwner";
import { cn } from "@/lib/utils";

// Translate technical routes or endpoints into natural, friendly language
function getFriendlyActionDescription(log: ActivityLogItem): {
  title: string;
  categoryLabel: string;
  icon: any;
  colorClass: string;
} {
  const method = (log.httpMethod || "GET").toUpperCase();
  const route = (log.routePattern || "").toLowerCase();
  const summary = (log.summary || "").toLowerCase();
  const category = (log.category || "").toLowerCase();

  if (category === "payment" || route.includes("rent") || route.includes("payment")) {
    return {
      title: method === "POST" ? "Recorded rent payment" : "Updated rent billing record",
      categoryLabel: "Rent & Payments",
      icon: IndianRupee,
      colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    };
  }

  if (category === "tenant_management" || route.includes("tenant")) {
    if (method === "POST" || route.includes("add")) {
      return {
        title: "Added new tenant to PG",
        categoryLabel: "Tenant Onboarding",
        icon: UserPlus,
        colorClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
      };
    }
    if (route.includes("notice") || summary.includes("notice")) {
      return {
        title: "Updated notice period / checkout",
        categoryLabel: "Notice & Vacating",
        icon: Clock,
        colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
      };
    }
    return {
      title: "Updated tenant profile details",
      categoryLabel: "Tenant Management",
      icon: User,
      colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
    };
  }

  if (category === "kyc" || route.includes("kyc") || route.includes("aadhaar")) {
    return {
      title: "Verified tenant KYC documents",
      categoryLabel: "KYC Verification",
      icon: FileCheck,
      colorClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    };
  }

  if (category === "support" || route.includes("complaint")) {
    return {
      title: "Updated tenant complaint ticket",
      categoryLabel: "Complaints & Help",
      icon: MessageSquare,
      colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
    };
  }

  if (route.includes("room") || route.includes("block") || route.includes("floor") || category === "property_settings") {
    return {
      title: "Modified property structure or rooms",
      categoryLabel: "Property & Rooms",
      icon: Home,
      colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
    };
  }

  // Fallback friendly description
  const cleanSummary = log.summary && !log.summary.startsWith("/") ? log.summary : "System operational update";
  return {
    title: cleanSummary,
    categoryLabel: "General Activity",
    icon: History,
    colorClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  };
}

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hrs ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

export default function ActivityLogsPage() {
  const { properties, selectedPgId } = useApp();

  const [propertyId, setPropertyId] = useState<string>(selectedPgId || "all");
  const [category, setCategory] = useState<string>("all");
  const [actorType, setActorType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["activityLogs", { page, propertyId, category, actorType }],
    queryFn: () =>
      getActivityLogs({
        page,
        limit: 15,
        propertyId: propertyId === "all" ? undefined : propertyId,
        category: category === "all" ? undefined : category,
        actorType: actorType === "all" ? undefined : actorType,
      }),
  });

  const logs = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Filter logs locally by search term
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const meta = JSON.stringify(log.metadata || {}).toLowerCase();
      const actorName = String(log.actorSnapshot?.name || "").toLowerCase();
      const summary = (log.summary || "").toLowerCase();
      return actorName.includes(term) || summary.includes(term) || meta.includes(term);
    });
  }, [logs, searchTerm]);

    // Format timeline items for the Activity Logs Details Dialog matching reference photo
  const modalTimelineItems: ActivityTimelineItem[] = useMemo(() => {
    if (!selectedLog) return DEFAULT_ACTIVITY_LOGS;

    const currentItem = formatActivityLogToTimelineItem(selectedLog);
    const relatedLogs = logs
      .filter(
        (l) =>
          l.id !== selectedLog.id &&
          ((selectedLog.propertyId && l.propertyId === selectedLog.propertyId) ||
            (selectedLog.actorId && l.actorId === selectedLog.actorId))
      )
      .slice(0, 3)
      .map((l) => formatActivityLogToTimelineItem(l));

    const combined = [currentItem, ...relatedLogs];
    const existingIds = new Set(combined.map((c) => c.id));
    const demosNeeded = DEFAULT_ACTIVITY_LOGS.filter(
      (d) => !existingIds.has(d.id)
    );

    return [...combined, ...demosNeeded];
  }, [selectedLog, logs]);

const getActorDisplay = (type: string, snapshot: any) => {
    const name = snapshot?.name || (type === "property_owner" ? "Property Owner" : type === "staff" ? "Staff Member" : "Tenant");
    const role = snapshot?.role || (type === "property_owner" ? "Owner" : type === "staff" ? "Manager / Staff" : "PG Resident");

    return (
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            type === "property_owner"
              ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
              : type === "staff"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="text-left leading-tight">
          <p className="text-xs font-bold text-foreground">{name}</p>
          <span className="text-[10px] text-muted-foreground font-medium">{role}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <PageHeader
        title="Activity Log & Operations Timeline"
        description="Clear, real-time record of rent entries, tenant check-ins, complaints, and changes made across your properties."
      />

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Property Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Property</label>
              <Select
                value={propertyId}
                onValueChange={(val) => {
                  setPropertyId(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Activity Type</label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="payment">Rent & Payments</SelectItem>
                  <SelectItem value="tenant_management">Tenants & Check-ins</SelectItem>
                  <SelectItem value="kyc">KYC & Verifications</SelectItem>
                  <SelectItem value="support">Complaints & Requests</SelectItem>
                  <SelectItem value="property_settings">Property & Rooms</SelectItem>
                  <SelectItem value="staff_management">Staff & Permissions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actor Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Performed By</label>
              <Select
                value={actorType}
                onValueChange={(val) => {
                  setActorType(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Everyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="property_owner">PG Owner</SelectItem>
                  <SelectItem value="staff">Staff / Manager</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by person name or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Badge variant="outline" className="text-xs text-muted-foreground rounded-lg py-1 px-2.5">
                Total Events: <strong className="text-foreground ml-1">{total}</strong>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs rounded-xl"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HUMAN-FRIENDLY ACTIVITY FEED TABLE */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal-600" />
              <p className="text-xs text-muted-foreground">Loading operations history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <History className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-sm font-semibold">No activity records found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No recorded operations match your current filter settings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">When</th>
                    <th className="py-3.5 px-4">Performed By</th>
                    <th className="py-3.5 px-4">Action Summary</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.map((item) => {
                    const parsedAction = getFriendlyActionDescription(item);
                    const ActionIcon = parsedAction.icon;

                    return (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-foreground block">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getActorDisplay(item.actorType, item.actorSnapshot)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-muted/60 text-foreground shrink-0">
                              <ActionIcon className="h-3.5 w-3.5 text-teal-600" />
                            </div>
                            <span className="font-semibold text-foreground text-xs leading-snug">
                              {parsedAction.title}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] font-semibold px-2 py-0.5 border", parsedAction.colorClass)}
                          >
                            {parsedAction.categoryLabel}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold"
                            onClick={() => setSelectedLog(item)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/5">
              <div className="text-xs text-muted-foreground">
                Page <strong className="text-foreground">{page}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 rounded-xl"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ArrowLeft className="h-3 w-3" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 rounded-xl"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTIVITY LOGS DETAIL MODAL MATCHING REFERENCE PHOTO */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl w-full p-0 bg-white dark:bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/80 gap-0">
          {/* Header matching reference photo */}
          <div className="px-6 py-5 border-b border-border/70 flex items-center justify-between bg-white dark:bg-card pr-12">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Activity Logs
            </DialogTitle>
          </div>

          {/* Timeline Feed matching reference photo */}
          <div className="px-4 sm:px-6 py-2 overflow-y-auto max-h-[78vh]">
            <ActivityLogsTimelineFeed items={modalTimelineItems} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
