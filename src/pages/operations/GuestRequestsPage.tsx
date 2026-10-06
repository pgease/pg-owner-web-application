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
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import {
  getGuestRequests,
  updateGuestRequestStatus,
  createGuestRequest,
  GuestDetailItem,
} from "@/api/propertyOwner";
import { usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";

interface GuestFormItem {
  name: string;
  phone: string;
  gender: "Male" | "Female" | "Other" | string;
  relationship: string;
}

const defaultGuestItem: GuestFormItem = {
  name: "",
  phone: "",
  gender: "Male",
  relationship: "Friend",
};

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
  const [guestList, setGuestList] = useState<GuestFormItem[]>([{ ...defaultGuestItem }]);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [purpose, setPurpose] = useState("");

  const { data: tenantsData = [] } = usePropertyTenants(selectedPgId);
  const tenantsList = Array.isArray(tenantsData) ? tenantsData : (tenantsData as any)?.tenants || [];

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["guestRequests", selectedPgId, statusFilter],
    queryFn: () => (selectedPgId ? getGuestRequests(selectedPgId, statusFilter) : null),
    enabled: Boolean(selectedPgId),
  });

  const handleAddGuestItem = () => {
    setGuestList((prev) => [
      ...prev,
      {
        name: "",
        phone: "",
        gender: "Male",
        relationship: prev[0]?.relationship || "Friend",
      },
    ]);
  };

  const handleRemoveGuestItem = (index: number) => {
    if (guestList.length <= 1) return;
    setGuestList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuestItemChange = (index: number, field: keyof GuestFormItem, val: string) => {
    setGuestList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const resetAddGuestForm = () => {
    setSelectedTenantId("");
    setGuestList([{ ...defaultGuestItem }]);
    setArrivalDate("");
    setDepartureDate("");
    setPurpose("");
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
      if (!selectedPgId) return;
      const validGuests = guestList.filter((g) => g.name.trim().length > 0);
      if (validGuests.length === 0) {
        throw new Error("Please enter at least one guest name.");
      }

      const primary = validGuests[0];

      return createGuestRequest(selectedPgId, {
        tenantId: selectedTenantId || undefined,
        guestName: primary.name.trim(),
        guestPhone: primary.phone.trim() || undefined,
        guestGender: primary.gender || undefined,
        relationship: primary.relationship || undefined,
        numberOfGuests: validGuests.length,
        guests: validGuests.map((g) => ({
          name: g.name.trim(),
          phone: g.phone.trim() || undefined,
          gender: g.gender || undefined,
          relationship: g.relationship.trim() || undefined,
        })),
        expectedArrival: arrivalDate ? new Date(arrivalDate).toISOString() : new Date().toISOString(),
        expectedDeparture: departureDate ? new Date(departureDate).toISOString() : undefined,
        purpose: purpose.trim() || undefined,
      });
    },
    onSuccess: () => {
      const count = guestList.filter((g) => g.name.trim()).length;
      toast({
        title: "Guest Log Saved",
        description: `Guest arrival entry logged for ${count} guest${count > 1 ? "s" : ""}.`,
      });
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
    const totalHeadcount = requests.reduce((sum, r) => {
      const count = Array.isArray(r.guests) && r.guests.length > 0 ? r.guests.length : Number(r.numberOfGuests) || 1;
      return sum + count;
    }, 0);
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

      const matchesGuestInList = Array.isArray(req.guests) && req.guests.some((g: any) =>
        (g.name || "").toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q) ||
        (g.gender || "").toLowerCase().includes(q) ||
        (g.relationship || "").toLowerCase().includes(q)
      );

      return (
        gName.includes(q) ||
        gPhone.includes(q) ||
        tName.includes(q) ||
        rNum.includes(q) ||
        gGender.includes(q) ||
        rel.includes(q) ||
        matchesGuestInList
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
              placeholder="Search guest name, phone, gender, room..."
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
              Grouped by month and arrival date with detailed guest roster, gender, and security status.
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
                          <TableHead className="font-bold min-w-[280px]">Guest Roster & Details</TableHead>
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

                          // All individual guests
                          const roster: GuestDetailItem[] = Array.isArray(req.guests) && req.guests.length > 0
                            ? req.guests
                            : [
                                {
                                  name: req.guestName || req.name || "Guest Visitor",
                                  phone: req.guestPhone || req.phone || "",
                                  gender: req.guestGender || "",
                                  relationship: req.relationship || "",
                                },
                              ];

                          return (
                            <TableRow key={req.id || idx} className="hover:bg-slate-50/60">
                              {/* STAY SCHEDULE */}
                              <TableCell className="font-medium text-slate-900 text-xs align-top pt-3">
                                <div>
                                  <span className="font-bold text-slate-600">Arr:</span>{" "}
                                  {arrDateStr
                                    ? new Date(arrDateStr).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </div>
                                {depDateStr && (
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    <span className="font-semibold text-slate-600">Dep:</span>{" "}
                                    {new Date(depDateStr).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                  </div>
                                )}
                              </TableCell>

                              {/* GUEST ROSTER & DETAILS */}
                              <TableCell className="align-top pt-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {renderGuestsBadge(roster.length)}
                                  </div>

                                  <div className="space-y-1">
                                    {roster.map((g, gIdx) => (
                                      <div
                                        key={gIdx}
                                        className="text-xs flex items-center gap-1.5 flex-wrap bg-white/70 py-0.5 px-1.5 rounded border border-slate-100"
                                      >
                                        <span className="font-bold text-slate-900">{g.name || "Guest"}</span>
                                        {renderGenderBadge(g.gender)}
                                        {g.phone && (
                                          <span className="text-[11px] text-slate-500">📞 {g.phone}</span>
                                        )}
                                        {g.relationship && g.relationship !== req.relationship && (
                                          <span className="text-[10px] text-slate-400 font-medium">({g.relationship})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>

                              {/* RESIDENT TENANT */}
                              <TableCell className="align-top pt-3">
                                <div className="font-semibold text-slate-900 text-xs">
                                  {req.tenantName || req.tenant?.name || "Resident"}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Room {req.roomNumber || req.room?.roomNumber || "N/A"}
                                  {req.room?.floor ? ` • ${req.room.floor}` : ""}
                                </div>
                              </TableCell>

                              {/* RELATION & PURPOSE */}
                              <TableCell className="text-xs align-top pt-3">
                                <span className="font-semibold text-slate-800">
                                  {req.relationship || req.relation || "Friend"}
                                </span>
                                <span className="block text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {req.purpose || "Visiting"}
                                </span>
                              </TableCell>

                              {/* STATUS */}
                              <TableCell className="align-top pt-3">
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
                              <TableCell className="text-right align-top pt-3">
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
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <UserCheck className="h-5 w-5" /> Add Guest Log (On Behalf of Tenant)
              </DialogTitle>
              <DialogDescription>
                Log visitor arrival and provide individual details for each guest.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              {/* RESIDENT TENANT SELECT */}
              <div className="space-y-1">
                <Label className="font-semibold text-slate-800">Select Resident Tenant *</Label>
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

              {/* INDIVIDUAL GUEST LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-600" /> Guest Details ({guestList.length} Guest{guestList.length > 1 ? "s" : ""})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddGuestItem}
                    className="text-xs h-8 border-teal-500 text-teal-700 hover:bg-teal-50 font-bold gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Guest
                  </Button>
                </div>

                {guestList.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-black inline-flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {idx === 0 ? "Primary Guest" : `Guest #${idx + 1}`}
                      </span>

                      {idx > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGuestItem(idx)}
                          className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                        <Input
                          value={g.name}
                          onChange={(e) => handleGuestItemChange(idx, "name", e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Gender *</Label>
                        <Select
                          value={g.gender}
                          onValueChange={(val) => handleGuestItemChange(idx, "gender", val)}
                        >
                          <SelectTrigger className="bg-white text-xs">
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
                        <Label className="text-xs font-semibold text-slate-700">Mobile Number</Label>
                        <Input
                          value={g.phone}
                          onChange={(e) => handleGuestItemChange(idx, "phone", e.target.value)}
                          placeholder="10-digit number"
                          className="bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Relationship to Tenant</Label>
                        <Input
                          value={g.relationship}
                          onChange={(e) => handleGuestItemChange(idx, "relationship", e.target.value)}
                          placeholder="e.g. Friend, Parent, Sibling"
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ARRIVAL & DEPARTURE DATES */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="font-semibold text-slate-800">Expected Arrival *</Label>
                  <Input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-slate-800">Expected Departure</Label>
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
                <Label className="font-semibold text-slate-800">Purpose of Visit</Label>
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
                disabled={createGuestMutation.isPending || !guestList[0]?.name.trim()}
              >
                {createGuestMutation.isPending
                  ? "Saving Log..."
                  : `Save Guest Log (${guestList.filter((g) => g.name.trim()).length || 1})`}
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
                Are you sure you want to {actionType} visitor arrival for:
              </p>

              {Array.isArray(selectedRequest?.guests) && selectedRequest.guests.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    {selectedRequest.guests.length} Guest{selectedRequest.guests.length > 1 ? "s" : ""}:
                  </div>
                  {selectedRequest.guests.map((g: any, i: number) => (
                    <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold">• {g.name}</span>
                      {renderGenderBadge(g.gender)}
                      {g.phone && <span className="text-[11px] text-slate-500">({g.phone})</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-bold text-slate-900">{selectedRequest?.guestName || "Guest"}</div>
              )}

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


