import React, { useEffect, useMemo, useState } from "react";
import { Plus, Phone, MessageSquare, AlertTriangle, Building2, CheckCircle2, XCircle, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { CanAccessPage } from "@/components/PermissionGuard";
import { formatDate } from "@/lib/formatters";

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: "NEW" | "CONTACTED" | "VISITED" | "BOOKED" | "LOST";
  followUpDate?: string;
  notes?: string;
  pgPreference?: string;
}

interface StoredLead extends LeadItem {
  pgId: string;
}

const STORAGE_KEY = "pgease_local_leads_v1";

function loadLeads(): StoredLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const STATUS_DETAILS: Record<LeadItem["status"], { label: string; tone: "info" | "warning" | "success" | "error" | "neutral" }> = {
  NEW: { label: "New inquiry", tone: "info" },
  CONTACTED: { label: "Contacted", tone: "warning" },
  VISITED: { label: "Visit completed", tone: "neutral" },
  BOOKED: { label: "Booked", tone: "success" },
  LOST: { label: "Lost", tone: "error" },
};

export default function LeadsPage() {
  const { selectedPgId } = useApp();
  const [allLeads, setAllLeads] = useState<StoredLead[]>(loadLeads);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLeads));
    } catch {
      /* storage unavailable */
    }
  }, [allLeads]);

  const leads = useMemo(
    () => allLeads.filter((l) => l.pgId === (selectedPgId || "general")),
    [allLeads, selectedPgId]
  );
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
      const q = search.toLowerCase();
      const matchesSearch = l.name.toLowerCase().includes(q) || l.phone.includes(q);
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
    const newLead: StoredLead = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pgId: selectedPgId || "general",
      name: name.trim(),
      phone: phone.trim(),
      source,
      status: "NEW",
      followUpDate: followUpDate || undefined,
      notes: notes.trim() || undefined,
    };

    setAllLeads((prev) => [newLead, ...prev]);
    toast({ title: "Lead added successfully" });
    setName("");
    setPhone("");
    setFollowUpDate("");
    setNotes("");
    setOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: LeadItem["status"]) => {
    setAllLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    toast({ title: `Lead status updated to ${STATUS_DETAILS[newStatus].label}` });
  };

  const handleDeleteLead = (id: string) => {
    setAllLeads((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Lead removed" });
  };

  return (
    <CanAccessPage permission="tenant_view">
      <div className="space-y-6">
        <PageHeader
          title="Leads & Visits"
          description="Track prospective tenant inquiries, property visits, and conversions."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Add lead
            </Button>
          }
        />

        {/* P0 Bug 9: Prominent Device-only Storage Warning */}
        <div className="flex items-start gap-3 rounded-md border border-[var(--warning)] bg-[#FFF7E6] p-3 text-xs text-[var(--gray-800)]">
          <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#A15C07]">
              Device-Only Storage Warning
            </span>
            <p className="text-[var(--gray-700)] leading-relaxed">
              Leads are currently stored locally in your browser cache. They will not sync across other devices or for your staff, and clearing browser history will erase these inquiries. Cloud CRM API integration is in development.
            </p>
          </div>
        </div>

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to manage inquiries."
            />
          </div>
        ) : (
          <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricDisplay
                label="Total Leads"
                value={kpis.total}
                hint="Total prospective inquiries"
                tone="neutral"
              />
              <MetricDisplay
                label="Active Pipeline"
                value={kpis.active}
                hint="Inquiries pending visit/decision"
                tone="neutral"
              />
              <MetricDisplay
                label="Booked"
                value={kpis.booked}
                hint="Converted to residents"
                tone="success"
              />
              <MetricDisplay
                label="Conversion Rate"
                value={`${kpis.conversionRate}%`}
                hint="Inquiries converted to bookings"
                tone={kpis.conversionRate >= 30 ? "success" : "neutral"}
              />
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-md border border-[var(--gray-200)] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
                <div className="flex-1 max-w-sm">
                  <SearchInput
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={setSearch}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="Website">Website Request</SelectItem>
                      <SelectItem value="Justdial">Justdial Lead</SelectItem>
                      <SelectItem value="Friend Reference">Friend Referral</SelectItem>
                      <SelectItem value="Direct Walk-in">Direct Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <EmptyState
                  title={search || sourceFilter !== "all" ? "No matching leads" : "No leads recorded yet"}
                  description={
                    search || sourceFilter !== "all"
                      ? "Try changing your search term or source filter."
                      : "Record inquiries from phone calls, walk-ins, and website visitors to schedule visits."
                  }
                  action={
                    search || sourceFilter !== "all" ? undefined : (
                      <Button
                        size="sm"
                        className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                        onClick={() => setOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add first lead
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                  <Table>
                    <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2.5 px-3">Lead</TableHead>
                        <TableHead className="py-2.5 px-3">Contact</TableHead>
                        <TableHead className="py-2.5 px-3">Source</TableHead>
                        <TableHead className="py-2.5 px-3">Follow-Up Date</TableHead>
                        <TableHead className="py-2.5 px-3">Status</TableHead>
                        <TableHead className="py-2.5 px-3">Notes</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((l) => {
                        const statusInfo = STATUS_DETAILS[l.status] || { label: l.status, tone: "neutral" };
                        return (
                          <TableRow key={l.id} className="text-xs hover:bg-[var(--gray-50)]">
                            <TableCell className="py-2.5 px-3 font-medium text-[var(--gray-900)]">
                              {l.name}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 tabular-nums text-[var(--gray-700)]">
                              {l.phone}
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)]">
                                {l.source}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3 tabular-nums text-[var(--gray-600)] whitespace-nowrap">
                              {l.followUpDate ? formatDate(l.followUpDate) : "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 whitespace-nowrap">
                              <StatusBadge label={statusInfo.label} tone={statusInfo.tone} size="sm" />
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-[var(--gray-600)] max-w-[200px] truncate">
                              {l.notes || "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                              <ActionMenu
                                items={[
                                  {
                                    label: "Call Lead",
                                    icon: <Phone className="h-4 w-4" />,
                                    onClick: () => {
                                      window.location.href = `tel:${l.phone}`;
                                    },
                                  },
                                  {
                                    label: "Send WhatsApp",
                                    icon: <MessageSquare className="h-4 w-4 text-[var(--success)]" />,
                                    onClick: () => {
                                      const clean = l.phone.replace(/\D/g, "").slice(-10);
                                      window.open(`https://wa.me/91${clean}?text=Hi%20${encodeURIComponent(l.name)}%2C%20regarding%20your%20PG%20inquiry`, "_blank");
                                    },
                                  },
                                  {
                                    label: "Mark Contacted",
                                    icon: <CheckCircle2 className="h-4 w-4" />,
                                    disabled: l.status === "CONTACTED",
                                    onClick: () => handleUpdateStatus(l.id, "CONTACTED"),
                                  },
                                  {
                                    label: "Mark Visit Completed",
                                    icon: <CheckCircle2 className="h-4 w-4" />,
                                    disabled: l.status === "VISITED",
                                    onClick: () => handleUpdateStatus(l.id, "VISITED"),
                                  },
                                  {
                                    label: "Mark Booked",
                                    icon: <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />,
                                    disabled: l.status === "BOOKED",
                                    onClick: () => handleUpdateStatus(l.id, "BOOKED"),
                                  },
                                  {
                                    label: "Mark Lost",
                                    icon: <XCircle className="h-4 w-4 text-[#B42318]" />,
                                    disabled: l.status === "LOST",
                                    onClick: () => handleUpdateStatus(l.id, "LOST"),
                                  },
                                  {
                                    label: "Delete Lead",
                                    icon: <Trash2 className="h-4 w-4 text-[#B42318]" />,
                                    onClick: () => handleDeleteLead(l.id),
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Lead Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Add Prospective Lead
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Record an inquiry to schedule follow-ups and room visits.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddLead} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-[var(--gray-700)]">
                  Full Name <span className="text-[#B42318]">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-[var(--gray-700)]">
                  Contact Number <span className="text-[#B42318]">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source" className="text-xs font-medium text-[var(--gray-700)]">
                  Lead Source
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-9 text-sm">
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

              <div className="space-y-1.5">
                <Label htmlFor="followup" className="text-xs font-medium text-[var(--gray-700)]">
                  Visit / Follow-up Date (optional)
                </Label>
                <Input
                  id="followup"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium text-[var(--gray-700)]">
                  Inquiry Notes (optional)
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred sharing, moving date..."
                  className="h-9 text-sm"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="border-[var(--gray-300)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                >
                  Save lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
