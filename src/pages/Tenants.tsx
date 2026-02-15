import { useState } from "react";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Send,
  Building2,
  DoorOpen,
  BedDouble,
  Phone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";

const tenants = [
  { id: "1", name: "Sathyam guptha", pg: "Sunshine PG", floor: 12, room: 23, bed: 2, rent: 15000, dueDate: "21 Jan 2026", aadharVerified: true, contactOk: true },
  { id: "2", name: "Riya Sharma", pg: "Green Valley PG", floor: 1, room: 105, bed: 1, rent: 18000, dueDate: "15 Feb 2026", aadharVerified: true, contactOk: true },
  { id: "3", name: "Vikram Singh", pg: "Sunshine PG", floor: 2, room: 205, bed: 2, rent: 12000, dueDate: "5 Mar 2026", aadharVerified: false, contactOk: true },
  { id: "4", name: "Anjali Mehta", pg: "Metro Stay", floor: 3, room: 302, bed: 1, rent: 20000, dueDate: "30 Apr 2026", aadharVerified: true, contactOk: false },
];

const rentTypes = [
  { label: "Pending", value: "₹2,516", note: "Due: Jan 2026, Fixed: ₹6,000" },
  { label: "Joining Fee", value: "Not fixed" },
  { label: "Mess", value: "Not fixed" },
  { label: "Electricity Bill", value: "Not fixed" },
  { label: "Manual Late Fine", value: "Not fixed" },
  { label: "Others", value: "Not fixed" },
];

const Tenants = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pgFilter, setPgFilter] = useState("all");

  const filtered = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pg.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPg = pgFilter === "all" || t.pg === pgFilter;
    return matchSearch && matchPg;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant list</h1>
          <p className="text-sm text-muted-foreground">Manage all your tenants across PGs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> Send Invite
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add Tenant
          </Button>
        </div>
      </div>

      {/* Rent types summary */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Tenant meter / Rent types</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {rentTypes.map((r) => (
              <span key={r.label} className="text-muted-foreground">
                {r.label} – {r.value}
                {r.note && <span className="text-muted-foreground/80"> ({r.note})</span>}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, PG, room..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={pgFilter} onValueChange={setPgFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All PGs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PGs</SelectItem>
            <SelectItem value="Sunshine PG">Sunshine PG</SelectItem>
            <SelectItem value="Green Valley PG">Green Valley PG</SelectItem>
            <SelectItem value="Metro Stay">Metro Stay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenant cards (like image 2) */}
      <div className="space-y-4">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{t.name}</p>
                    {t.aadharVerified ? (
                      <Badge variant="default" className="gap-1 text-xs bg-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Aadhar verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" /> Pending verification
                      </Badge>
                    )}
                    {t.contactOk ? (
                      <span className="text-emerald-600" title="Contact verified">
                        <Phone className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="text-destructive" title="Contact issue">
                        <Phone className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> floor: {t.floor}
                    </span>
                    <span className="flex items-center gap-1">
                      <DoorOpen className="h-3.5 w-3.5" /> Room no: {t.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" /> Bed no: {t.bed}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap items-center gap-4">
                    <span className="font-medium">Rent: ₹{t.rent.toLocaleString("en-IN")}/mo</span>
                    <span className="text-destructive text-sm">Rent due on {t.dueDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddTenantDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Tenants;
