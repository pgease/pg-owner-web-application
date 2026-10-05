import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Plus,
  Calendar,
  User,
  Users,
  Building,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { getGuestRequests, updateGuestRequestStatus, createGuestRequest } from "@/api/propertyOwner";
import { usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";

export default function GuestRequestsPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [remarks, setRemarks] = useState("");

  // Add Guest Log modal on behalf of tenant
  const [addGuestModalOpen, setAddGuestModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestGender, setGuestGender] = useState<string>("Male");
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [relationship, setRelationship] = useState("Friend");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [additionalGuestNames, setAdditionalGuestNames] = useState("");

  const { data: tenantsData = [] } = usePropertyTenants(selectedPgId);
  const tenantsList = Array.isArray(tenantsData) ? tenantsData : (tenantsData as any)?.tenants || [];

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["guestRequests", selectedPgId, statusFilter],
    queryFn: () => (selectedPgId ? getGuestRequests(selectedPgId, statusFilter) : null),
    enabled: Boolean(selectedPgId),
  });

  const resetAddGuestForm = () => {
    setSelectedTenantId("");
    setGuestName("");
    setGuestPhone("");
    setGuestGender("Male");
    setNumberOfGuests(1);
    setRelationship("Friend");
    setArrivalDate("");
    setDepartureDate("");
    setPurpose("");
    setAdditionalGuestNames("");
  };

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !selectedRequest) return;
      const reqId = selectedRequest.id || selectedRequest._id;
      return updateGuestRequestStatus(selectedPgId, reqId, actionType, remarks);
    },
    onSuccess: () => {
      toast({
        title: actionType === "approved" ? "Request Approved" : "Request Rejected",
        description: `Guest arrival request updated to ${actionType}.`,
      });
      setSelectedRequest(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["guestRequests", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update request", description: e?.message, variant: "destructive" });
    },
  });

  const createGuestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !guestName.trim()) return;

      const fullPurpose = [
        purpose.trim(),
        additionalGuestNames.trim() ? `Accompanying guests: ${additionalGuestNames.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      return createGuestRequest(selectedPgId, {
        tenantId: selectedTenantId || undefined,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestGender: guestGender || undefined,
        numberOfGuests: Number(numberOfGuests) || 1,
        relationship: relationship || undefined,
        expectedArrival: arrivalDate ? new Date(arrivalDate).toISOString() : new Date().toISOString(),
        expectedDeparture: departureDate ? new Date(departureDate).toISOString() : undefined,
        purpose: fullPurpose || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Guest Log Saved", description: `Guest arrival entry logged for ${guestName}.` });
      setAddGuestModalOpen(false);
      resetAddGuestForm();
      queryClient.invalidateQueries({ queryKey: ["guestRequests", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save guest log", description: e?.message, variant: "destructive" });
    },
  });

  const requests: any[] = Array.isArray(requestsData)
    ? requestsData
    : (requestsData as any)?.data || (requestsData as any)?.requests || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => (r.status || "").toLowerCase() === "pending").length;
    const approved = requests.filter((r) => (r.status || "").toLowerCase() === "approved").length;
    const totalHeadcount = requests.reduce((sum, r) => sum + (Number(r.numberOfGuests) || 1), 0);
    return { total, pending, approved, totalHeadcount };
  }, [requests]);

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((req: any) => {
      const gName = (req.guestName || req.name || "").toLowerCase();
      const gPhone = (req.guestPhone || req.phone || "").toLowerCase();
      const tName = (req.tenantName || req.tenant?.name || "").toLowerCase();
      const rNum = String(req.roomNumber || req.room?.roomNumber || "").toLowerCase();
      const gGender = (req.guestGender || "").toLowerCase();
      const rel = (req.relationship || "").toLowerCase();
      return (
        gName.includes(q) ||
        gPhone.includes(q) ||
        tName.includes(q) ||
        rNum.includes(q) ||
        gGender.includes(q) ||
        rel.includes(q)
      );
    });
  }, [requests, searchQuery]);

  // Group requests by Month and Date
  const groupedRequests = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredRequests.forEach((req: any) => {
      const dateObj = req.arrivalDate || req.expectedArrival || req.createdAt ? new Date(req.arrivalDate || req.expectedArrival || req.createdAt) : new Date();
      const monthYearKey = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map[monthYearKey]) map[monthYearKey] = [];
      map[monthYearKey].push(req);
    });
    return map;
  }, [filteredRequests]);

  const renderGenderBadge = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g === "male") {
      return (
        <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50/80 border-blue-200">
          ♂ Male
        </Badge>
      );
    }
    if (g === "female") {
      return (
        <Badge variant="outline" className="text-[10px] font-semibold text-rose-700 bg-rose-50/80 border-rose-200">
          ♀ Female
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-semibold text-purple-700 bg-purple-50/80 border-purple-200 capitalize">
        {gender}
      </Badge>
    );
  };

  const renderGuestsBadge = (count?: number) => {
    const num = Number(count) || 1;
    if (num > 1) {
      return (
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-bold gap-1 shadow-none">
          <Users className="h-3 w-3 inline" /> {num} Guests
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[10px] gap-0.5">
        <User className="h-3 w-3 inline" /> 1 Guest
      </Badge>
    );
  };

  return (
    <CanAccessPage permission="guest_log">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-teal-600" /> Guest Requests & Visitor Log
            </h1>
            <p className="text-sm text-muted-foreground">
              Track, log, and approve visitor arrival requests for {selectedPg?.name || "your property"}.
            </p>
          </div>

          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5 shadow-sm"
            onClick={() => setAddGuestModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Guest Log (On Behalf of Tenant)
          </Button>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3.5 border-border shadow-xs">
            <div className="text-xs text-muted-foreground font-medium">Total Entries</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{metrics.total}</div>
          </Card>
          <Card className="p-3.5 border-border shadow-xs">
            <div className="text-xs text-amber-700 font-medium">Pending Approvals</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</div>
          </Card>
          <Card className="p-3.5 border-border shadow-xs">
            <div className="text-xs text-emerald-700 font-medium">Approved Visitors</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.approved}</div>
          </Card>
          <Card className="p-3.5 border-border shadow-xs">
            <div className="text-xs text-indigo-700 font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Total Headcount
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{metrics.totalHeadcount}</div>
          </Card>
        </div>

        {/* CONTROLS: STATUS FILTER & SEARCH */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={`capitalize font-bold text-xs ${
                  statusFilter === st ? "bg-teal-600 text-white hover:bg-teal-700" : ""
                }`}
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search guest, tenant, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* GROUPED TABLE VIEW BY MONTH & DATE */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Visitor Log Table ({filteredRequests.length})</CardTitle>
            <CardDescription>
              Grouped by month and arrival date with gender, headcount, and security status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading visitor logs...</div>
            ) : Object.keys(groupedRequests).length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No guest requests matching your search query." : "No guest arrival logs found."}
                </p>
              </div>
            ) : (
              Object.entries(groupedRequests).map(([monthYear, items]) => (
                <div key={monthYear} className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-1.5">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{monthYear}</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700">
                      {items.length} Entries
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold">Stay Schedule</TableHead>
                          <TableHead className="font-bold">Guest Details & Headcount</TableHead>
                          <TableHead className="font-bold">Resident Tenant</TableHead>
                          <TableHead className="font-bold">Relation & Purpose</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((req: any, idx: number) => {
                          const isPending = (req.status || "pending").toLowerCase() === "pending";
                          const isApproved = (req.status || "").toLowerCase() === "approved";
                          const arrDateStr = req.expectedArrival || req.arrivalDate || req.createdAt;
                          const depDateStr = req.expectedDeparture || req.departureDate;

                          return (
                            <TableRow key={req.id || idx} className="hover:bg-slate-50/60">
                              {/* STAY SCHEDULE */}
                              <TableCell className="font-medium text-slate-900 text-xs">
                                <div>
                                  <span className="font-bold">Arr:</span>{" "}
                                  {arrDateStr
                                    ? new Date(arrDateStr).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </div>
                                {depDateStr && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    <span className="font-semibold text-slate-700">Dep:</span>{" "}
                                    {new Date(depDateStr).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                  </div>
                                )}
                              </TableCell>

                              {/* GUEST DETAILS & HEADCOUNT */}
                              <TableCell>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span>{req.guestName || req.name || "Guest Visitor"}</span>
                                  {renderGuestsBadge(req.numberOfGuests)}
                                  {renderGenderBadge(req.guestGender)}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {req.guestPhone || req.phone || "No phone provided"}
                                </div>
                              </TableCell>

                              {/* RESIDENT TENANT */}
                              <TableCell>
                                <div className="font-semibold text-slate-900 text-xs">
                                  {req.tenantName || req.tenant?.name || "Resident"}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Room {req.roomNumber || req.room?.roomNumber || "N/A"}
                                  {req.room?.floor ? ` • ${req.room.floor}` : ""}
                                </div>
                              </TableCell>

                              {/* RELATION & PURPOSE */}
                              <TableCell className="text-xs">
                                <span className="font-semibold text-slate-800">
                                  {req.relationship || req.relation || "Friend"}
                                </span>
                                <span className="block text-[11px] text-slate-500 truncate max-w-xs">
                                  {req.purpose || "Visiting"}
                                </span>
                              </TableCell>

                              {/* STATUS */}
                              <TableCell>
                                <Badge
                                  className={
                                    isPending
                                      ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                                      : isApproved
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                                      : "bg-red-100 text-red-900 border-red-300 font-bold"
                                  }
                                >
                                  {req.status || "Pending"}
                                </Badge>
                              </TableCell>

                              {/* ACTIONS */}
                              <TableCell className="text-right">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-[11px] px-2"
                                      onClick={() => {
                                        setSelectedRequest(req);
                                        setActionType("rejected");
                                      }}
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[11px] px-2 font-bold"
                                      onClick={() => {
                                        setSelectedRequest(req);
                                        setActionType("approved");
                                      }}
                                    >
                                      Approve
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">Logged</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ADD GUEST LOG MODAL (ON BEHALF OF TENANT) */}
        <Dialog
          open={addGuestModalOpen}
          onOpenChange={(open) => {
            setAddGuestModalOpen(open);
            if (!open) resetAddGuestForm();
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <UserCheck className="h-5 w-5" /> Add Guest Log (On Behalf of Tenant)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              {/* RESIDENT TENANT SELECT */}
              <div className="space-y-1">
                <Label>Select Resident Tenant *</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.fullName} (Room {t.roomNumber || t.room?.roomNumber || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRIMARY GUEST NAME */}
              <div className="space-y-1">
                <Label>Primary Guest Name *</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              {/* GENDER & NUMBER OF GUESTS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Guest Gender *</Label>
                  <Select value={guestGender} onValueChange={setGuestGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Total Guests (Count) *</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                </div>
              </div>

              {/* CONDITIONAL ACCOMPANYING GUESTS */}
              {numberOfGuests > 1 && (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-teal-600" /> Additional Guest Names (Optional)
                  </Label>
                  <Input
                    value={additionalGuestNames}
                    onChange={(e) => setAdditionalGuestNames(e.target.value)}
                    placeholder="e.g. Amit Kumar, Priya Sharma"
                    className="text-xs bg-white"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Names of the other {numberOfGuests - 1} accompanying guest(s) staying with this visitor.
                  </p>
                </div>
              )}

              {/* GUEST CONTACT & RELATIONSHIP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Guest Mobile</Label>
                  <Input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="10-digit number"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Relationship</Label>
                  <Input
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Parent, Friend, Sibling"
                  />
                </div>
              </div>

              {/* ARRIVAL & DEPARTURE DATES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Expected Arrival *</Label>
                  <Input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Expected Departure</Label>
                  <Input
                    type="date"
                    min={arrivalDate || undefined}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>
              </div>

              {/* PURPOSE */}
              <div className="space-y-1">
                <Label>Purpose of Visit</Label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter reason for visit or special instructions..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddGuestModalOpen(false);
                  resetAddGuestForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                onClick={() => createGuestMutation.mutate()}
                disabled={createGuestMutation.isPending || !guestName.trim()}
              >
                {createGuestMutation.isPending ? "Saving Log..." : "Save Guest Log"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* APPROVE / REJECT MODAL */}
        <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-foreground">
                {actionType === "approved" ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5" /> Approve Guest Request
                  </span>
                ) : (
                  <span className="text-red-700 flex items-center gap-1.5">
                    <XCircle className="h-5 w-5" /> Reject Guest Request
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <p className="text-slate-700">
                Are you sure you want to {actionType} guest arrival for{" "}
                <strong className="font-bold text-slate-900">{selectedRequest?.guestName || "Guest"}</strong>?
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Remarks / Instructions for Guard Desk</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Approved. Deposit original ID copy at security desk upon check-in."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button
                className={
                  actionType === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    : "bg-red-600 hover:bg-red-700 text-white font-bold"
                }
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Updating..." : `Confirm ${actionType.toUpperCase()}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}

