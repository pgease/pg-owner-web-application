import { useState } from "react";
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
  AlertCircle
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
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { getActivityLogs, type ActivityLogItem } from "@/api/propertyOwner";

export default function ActivityLogsPage() {
  const { properties, selectedPgId } = useApp();

  const [propertyId, setPropertyId] = useState<string>(selectedPgId || "all");
  const [category, setCategory] = useState<string>("all");
  const [actorType, setActorType] = useState<string>("all");
  const [httpMethod, setHttpMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["activityLogs", { page, propertyId, category, actorType, httpMethod }],
    queryFn: () =>
      getActivityLogs({
        page,
        limit: 15,
        propertyId: propertyId === "all" ? undefined : propertyId,
        category: category === "all" ? undefined : category,
        actorType: actorType === "all" ? undefined : actorType,
        httpMethod: httpMethod === "all" ? undefined : httpMethod,
      }),
  });

  const logs = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Filter logs locally by search term if provided
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.summary && log.summary.toLowerCase().includes(term)) ||
      (log.routePattern && log.routePattern.toLowerCase().includes(term)) ||
      (log.category && log.category.toLowerCase().includes(term)) ||
      (log.actorSnapshot?.name && String(log.actorSnapshot.name).toLowerCase().includes(term)) ||
      (log.actorSnapshot?.email && String(log.actorSnapshot.email).toLowerCase().includes(term))
    );
  });

  const getMethodBadge = (method: string) => {
    switch (method?.toUpperCase()) {
      case "POST":
        return <Badge className="bg-emerald-600 text-white font-mono text-[10px]">POST</Badge>;
      case "PUT":
        return <Badge className="bg-amber-600 text-white font-mono text-[10px]">PUT</Badge>;
      case "PATCH":
        return <Badge className="bg-blue-600 text-white font-mono text-[10px]">PATCH</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-600 text-white font-mono text-[10px]">DELETE</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-[10px]">{method || "GET"}</Badge>;
    }
  };

  const getActorBadge = (type: string, snapshot: any) => {
    switch (type) {
      case "property_owner":
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold leading-none">{snapshot?.name || "Owner"}</div>
              <div className="text-[10px] text-muted-foreground">Property Owner</div>
            </div>
          </div>
        );
      case "staff":
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold leading-none">{snapshot?.name || "Staff Member"}</div>
              <div className="text-[10px] text-muted-foreground">{snapshot?.role || "Staff"}</div>
            </div>
          </div>
        );
      case "tenant":
        return (
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Smartphone className="h-3.5 w-3.5" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold leading-none">{snapshot?.name || "Tenant"}</div>
              <div className="text-[10px] text-muted-foreground">{snapshot?.phone || "Tenant Mobile"}</div>
            </div>
          </div>
        );
      default:
        return <Badge variant="secondary" className="text-xs">{type || "System"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <PageHeader
        title="Activity Audit Logs"
        description="Immutable audit trail of actions taken across properties, tenants, rent, and settings."
      />

      {/* FILTER CONTROLS BAR */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Property Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Property</label>
              <Select value={propertyId} onValueChange={(val) => { setPropertyId(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
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
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="tenant_management">Tenant Management</SelectItem>
                  <SelectItem value="payment">Payments & Rent</SelectItem>
                  <SelectItem value="kyc">KYC & Verification</SelectItem>
                  <SelectItem value="support">Support & Complaints</SelectItem>
                  <SelectItem value="property_settings">Property Settings</SelectItem>
                  <SelectItem value="staff_management">Staff Management</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="uncategorized">General / Uncategorized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actor Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Actor</label>
              <Select value={actorType} onValueChange={(val) => { setActorType(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Actors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  <SelectItem value="property_owner">Property Owner</SelectItem>
                  <SelectItem value="staff">Staff Members</SelectItem>
                  <SelectItem value="tenant">Tenants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HTTP Method */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Action Type</label>
              <Select value={httpMethod} onValueChange={(val) => { setHttpMethod(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="POST">Create / Add (POST)</SelectItem>
                  <SelectItem value="PUT">Update (PUT)</SelectItem>
                  <SelectItem value="PATCH">Modify (PATCH)</SelectItem>
                  <SelectItem value="DELETE">Delete (DELETE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Total: <strong className="text-foreground ml-1">{total}</strong> entries
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AUDIT LOGS TABLE */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal-600" />
              <p className="text-xs text-muted-foreground">Loading audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <History className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-sm font-semibold">No activity logs found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No recorded operations match your current search and filter settings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action & Route</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActorBadge(item.actorType, item.actorSnapshot)}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-foreground truncate">
                          {item.summary || item.routePattern}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          {item.routePattern}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px] font-medium capitalize">
                          {(item.category || "General").replace(/_/g, " ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getMethodBadge(item.httpMethod)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          onClick={() => setSelectedLog(item)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                  className="h-8 text-xs gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ArrowLeft className="h-3 w-3" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
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

      {/* DETAIL DIALOG */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-teal-600" /> Audit Log Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recorded at {selectedLog && new Date(selectedLog.createdAt).toLocaleString("en-IN")}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Actor Type</span>
                  <span className="font-semibold capitalize">{selectedLog.actorType.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Action Category</span>
                  <span className="font-semibold capitalize">{selectedLog.category.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">HTTP Operation</span>
                  <div className="mt-0.5">{getMethodBadge(selectedLog.httpMethod)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Route Pattern</span>
                  <span className="font-mono text-[11px] block truncate">{selectedLog.routePattern}</span>
                </div>
              </div>

              {selectedLog.actorSnapshot && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">Actor Snapshot</span>
                  <pre className="p-3 rounded-lg bg-muted/60 text-[11px] font-mono overflow-x-auto border">
                    {JSON.stringify(selectedLog.actorSnapshot, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">Request Context & Metadata</span>
                  <pre className="p-3 rounded-lg bg-muted/60 text-[11px] font-mono overflow-x-auto border">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
