import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, CheckCircle2, XCircle, Clock, Search, Filter, ShieldCheck, Plus, Calendar, User } from "lucide-react";
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
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [remarks, setRemarks] = useState("");

  // Add Guest Log modal on behalf of tenant
  const [addGuestModalOpen, setAddGuestModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [arrivalDate, setArrivalDate] = useState("");
  const [purpose, setPurpose] = useState("");

  const { data: tenantsData = [] } = usePropertyTenants(selectedPgId);
  const tenantsList = Array.isArray(tenantsData) ? tenantsData : (tenantsData as any)?.tenants || [];

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["guestRequests", selectedPgId, statusFilter],
    queryFn: () => (selectedPgId ? getGuestRequests(selectedPgId, statusFilter) : null),
    enabled: Boolean(selectedPgId),
  });

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
      return createGuestRequest(selectedPgId, {
        tenantId: selectedTenantId || undefined,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        relationship: relationship || undefined,
        expectedArrival: arrivalDate ? new Date(arrivalDate).toISOString() : new Date().toISOString(),
        purpose: purpose.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Guest Log Saved", description: `Guest arrival entry logged for ${guestName}.` });
      setAddGuestModalOpen(false);
      setGuestName("");
      setGuestPhone("");
      setPurpose("");
      queryClient.invalidateQueries({ queryKey: ["guestRequests", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save guest log", description: e?.message, variant: "destructive" });
    },
  });

  const requests = Array.isArray(requestsData)
    ? requestsData
    : (requestsData as any)?.data || (requestsData as any)?.requests || [];

  // Group requests by Month and Date
  const groupedRequests = useMemo(() => {
    const map: Record<string, any[]> = {};
    requests.forEach((req: any) => {
      const dateObj = req.arrivalDate || req.expectedArrival || req.createdAt ? new Date(req.arrivalDate || req.expectedArrival || req.createdAt) : new Date();
      const monthYearKey = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map[monthYearKey]) map[monthYearKey] = [];
      map[monthYearKey].push(req);
    });
    return map;
  }, [requests]);

  const handleAddGuestOnBehalf = () => {
    toast({ title: "Guest Logged Successfully", description: `Added guest log for ${guestName}.` });
    setAddGuestModalOpen(false);
    setGuestName("");
    setGuestPhone("");
    setPurpose("");
  };

  return (
    <CanAccessPage permission="guest_log">
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-teal-600" /> Guest Log & Arrival Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Track, log, and approve visitor arrival requests for {selectedPg?.name || "your property"}.
            </p>
          </div>

          <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5" onClick={() => setAddGuestModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Guest Log (On Behalf of Tenant)
          </Button>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex gap-2 border-b pb-3">
          {["all", "pending", "approved", "rejected"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={`capitalize font-bold text-xs ${
                statusFilter === st ? "bg-teal-600 text-white" : ""
              }`}
            >
              {st}
            </Button>
          ))}
        </div>

        {/* GROUPED TABLE VIEW BY MONTH & DATE */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Visitor Log Table ({requests.length})</CardTitle>
            <CardDescription>Grouped by month and arrival date for security auditing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading visitor logs...</div>
            ) : Object.keys(groupedRequests).length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No guest arrival logs found.</p>
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
                          <TableHead className="font-bold">Arrival Date</TableHead>
                          <TableHead className="font-bold">Guest Name & Contact</TableHead>
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
                          const arrDateStr = req.arrivalDate || req.expectedArrival || req.createdAt;

                          return (
                            <TableRow key={req.id || idx} className="hover:bg-slate-50/60">
                              <TableCell className="font-medium text-slate-900 text-xs">
                                {arrDateStr ? new Date(arrDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-slate-900 text-xs">{req.guestName || req.name || "Guest Visitor"}</div>
                                <div className="text-[11px] text-slate-500">{req.guestPhone || req.phone || "N/A"}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-slate-900 text-xs">{req.tenantName || req.tenant?.name || "Resident"}</div>
                                <div className="text-[11px] text-slate-500">Room {req.roomNumber || req.room?.roomNumber || "N/A"}</div>
                              </TableCell>
                              <TableCell className="text-xs">
                                <span className="font-semibold text-slate-800">{req.relationship || req.relation || "Friend"}</span>
                                <span className="block text-[11px] text-slate-500 truncate max-w-xs">{req.purpose || "Visiting"}</span>
                              </TableCell>
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
        <Dialog open={addGuestModalOpen} onOpenChange={setAddGuestModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <UserCheck className="h-5 w-5" /> Add Guest Log (On Behalf of Tenant)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="space-y-1">
                <Label>Select Resident Tenant</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger><SelectValue placeholder="Select Tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.fullName} (Room {t.roomNumber || t.room?.roomNumber || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Guest Name</Label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Rahul Sharma" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Guest Mobile</Label>
                  <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="10-digit number" />
                </div>
                <div className="space-y-1">
                  <Label>Relationship</Label>
                  <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Parent, Friend" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Arrival Date</Label>
                <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Purpose of Visit</Label>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Enter reason for visit..." rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGuestModalOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={() => createGuestMutation.mutate()} disabled={createGuestMutation.isPending || !guestName.trim()}>
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
                  <span className="text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5" /> Approve Guest Request</span>
                ) : (
                  <span className="text-red-700 flex items-center gap-1.5"><XCircle className="h-5 w-5" /> Reject Guest Request</span>
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
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
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
