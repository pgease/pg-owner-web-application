import React, { useMemo, useState } from "react";
import { Plus, Search, MessageSquare, Phone, MoreVertical, Calendar, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { CanAccessPage } from "@/components/PermissionGuard";

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string; // "Justdial" | "Website" | "Direct Walk-in" | "Friend Reference"
  status: "NEW" | "CONTACTED" | "VISITED" | "BOOKED" | "LOST";
  followUpDate?: string;
  notes?: string;
  pgPreference?: string;
}

const INITIAL_LEADS: LeadItem[] = [
  { id: "1", name: "Rahul Sharma", phone: "+91 9876543210", source: "Website", status: "NEW", followUpDate: "2026-07-24", notes: "Prefers Single sharing AC room." },
  { id: "2", name: "Ananya Iyer", phone: "+91 9123456789", source: "Friend Reference", status: "CONTACTED", followUpDate: "2026-07-25", notes: "Wants to visit this Sunday." },
  { id: "3", name: "Kabir Singh", phone: "+91 8888888888", source: "Justdial", status: "VISITED", followUpDate: "2026-07-23", notes: "Negotiating rent security deposit." },
  { id: "4", name: "Simran Kaur", phone: "+91 7777777777", source: "Direct Walk-in", status: "BOOKED", notes: "Token money deposited, checking in next month." },
  { id: "5", name: "Amit Patel", phone: "+91 9999999999", source: "Website", status: "LOST", notes: "Found another PG closer to office." }
];

const COLUMNS = [
  { key: "NEW", label: "New Inquiry", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { key: "CONTACTED", label: "Contacted", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { key: "VISITED", label: "Visit Completed", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { key: "BOOKED", label: "Booked", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { key: "LOST", label: "Lost", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
];

export default function LeadsPage() {
  const { selectedPgId } = useApp();
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [open, setOpen] = useState(false);

  // New Lead Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Website");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
      const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [leads, search, sourceFilter]);

  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const active = filteredLeads.filter((l) => l.status !== "BOOKED" && l.status !== "LOST").length;
    const booked = filteredLeads.filter((l) => l.status === "BOOKED").length;
    const conversionRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, active, booked, conversionRate };
  }, [filteredLeads]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Validation Error", description: "Name and contact number are required.", variant: "destructive" });
      return;
    }
    const newLead: LeadItem = {
      id: Math.random().toString(),
      name: name.trim(),
      phone: phone.trim(),
      source,
      status: "NEW",
      followUpDate: followUpDate || undefined,
      notes: notes.trim() || undefined,
    };
    setLeads((prev) => [newLead, ...prev]);
    toast({ title: "Inquiry Added", description: `${name} has been added to the pipeline.` });
    setName("");
    setPhone("");
    setSource("Website");
    setFollowUpDate("");
    setNotes("");
    setOpen(false);
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadItem["status"]) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    toast({ title: "Status Updated", description: "Lead pipeline updated successfully." });
  };

  return (
    <CanAccessPage permission="lead_view">
      <div className="space-y-6 animate-fade-in pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <PageHeader title="Leads & Visits CRM" description="Track booking requests, schedule site visits, and convert inquiries into check-ins." />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm shrink-0">
                <Plus className="h-4 w-4" /> Add Inquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Prospective Tenant</DialogTitle>
                <DialogDescription>Create a lead card to track followups and site visits.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Kumar" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Lead Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website Request</SelectItem>
                      <SelectItem value="Justdial">Justdial Lead</SelectItem>
                      <SelectItem value="Friend Reference">Friend Referral</SelectItem>
                      <SelectItem value="Direct Walk-in">Direct Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="followup">Visit / Follow-up Date</Label>
                  <Input id="followup" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Inquiry Details</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferred sharing, check-in date..." />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Card</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* CRM KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{kpis.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Leads</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{kpis.active}</p>
                <p className="text-xs text-muted-foreground font-medium">Active Pipeline</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{kpis.booked}</p>
                <p className="text-xs text-muted-foreground font-medium">Converted (Booked)</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{kpis.conversionRate}%</p>
                <p className="text-xs text-muted-foreground font-medium">Conversion Rate</p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border rounded-lg bg-card p-4">
          <div className="relative min-w-0 flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by lead name or contact..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Source filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Justdial">Justdial</SelectItem>
                <SelectItem value="Friend Reference">Friend Referral</SelectItem>
                <SelectItem value="Direct Walk-in">Direct Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board Layout */}
        <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-5 min-w-[1000px] md:min-w-0">
          {COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.key);
            return (
              <div key={col.key} className="rounded-lg bg-muted/20 border border-border/40 p-3 min-h-[400px] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b pb-2 px-1">
                  <Badge variant="outline" className={col.color}>{col.label}</Badge>
                  <span className="text-xs text-muted-foreground font-semibold tabular-nums">{colLeads.length}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {colLeads.map((lead) => (
                    <Card key={lead.id} className="border-border hover:shadow-md transition-shadow group relative">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-sm leading-tight text-foreground">{lead.name}</p>
                          <Select
                            value={lead.status}
                            onValueChange={(v) => handleUpdateStatus(lead.id, v as LeadItem["status"])}
                          >
                            <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted shrink-0 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {COLUMNS.map((c) => (
                                <SelectItem key={c.key} value={c.key} className="text-xs">
                                  Move to {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </p>
                        {lead.followUpDate && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded w-fit font-medium">
                            <Calendar className="h-3 w-3" /> Next followup: {lead.followUpDate}
                          </div>
                        )}
                        {lead.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/40 p-1.5 rounded line-clamp-2 italic">
                            &quot;{lead.notes}&quot;
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-dashed mt-2">
                          <span className="text-[10px] text-muted-foreground">Source: {lead.source}</span>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" asChild>
                              <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colLeads.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground/60 py-8 border border-dashed rounded-md">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CanAccessPage>
  );
}
