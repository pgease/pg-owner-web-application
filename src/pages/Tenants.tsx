import { useState } from "react";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Send,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tenants = [
  { id: 1, name: "Amit Sharma", phone: "9876543210", email: "amit@email.com", pg: "Sunshine PG", room: "201-A", bed: "B1", rent: 8500, deposit: 15000, joinDate: "2025-08-15", dueDate: 5, status: "active" },
  { id: 2, name: "Priya Reddy", phone: "9876543211", email: "priya@email.com", pg: "Green Valley PG", room: "105-B", bed: "B2", rent: 9000, deposit: 18000, joinDate: "2025-11-01", dueDate: 1, status: "active" },
  { id: 3, name: "Karthik Menon", phone: "9876543212", email: "karthik@email.com", pg: "Sunshine PG", room: "302-C", bed: "B1", rent: 7500, deposit: 12000, joinDate: "2025-06-10", dueDate: 5, status: "notice" },
  { id: 4, name: "Sneha Gupta", phone: "9876543213", email: "sneha@email.com", pg: "Metro Stay", room: "401-A", bed: "B1", rent: 10000, deposit: 20000, joinDate: "2026-01-20", dueDate: 1, status: "active" },
  { id: 5, name: "Ravi Kumar", phone: "9876543214", email: "ravi@email.com", pg: "Sunshine PG", room: "101-A", bed: "B2", rent: 8000, deposit: 14000, joinDate: "2024-12-01", dueDate: 5, status: "active" },
  { id: 6, name: "Deepa Nair", phone: "9876543215", email: "deepa@email.com", pg: "Green Valley PG", room: "202-A", bed: "B1", rent: 9500, deposit: 17000, joinDate: "2025-09-15", dueDate: 1, status: "active" },
  { id: 7, name: "Suresh Babu", phone: "9876543216", email: "suresh@email.com", pg: "City PG", room: "301-B", bed: "B3", rent: 7000, deposit: 10000, joinDate: "2025-03-01", dueDate: 5, status: "notice" },
  { id: 8, name: "Anita Singh", phone: "9876543217", email: "anita@email.com", pg: "Metro Stay", room: "102-C", bed: "B1", rent: 11000, deposit: 22000, joinDate: "2026-02-01", dueDate: 1, status: "active" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  notice: { label: "Notice Period", variant: "destructive" },
  inactive: { label: "Inactive", variant: "secondary" },
};

const Tenants = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage all your tenants across PGs
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> Send Invite
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Tenant name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Joining Date</Label>
                    <Input id="joinDate" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PG</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select PG" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunshine">Sunshine PG</SelectItem>
                        <SelectItem value="green">Green Valley PG</SelectItem>
                        <SelectItem value="metro">Metro Stay</SelectItem>
                        <SelectItem value="city">City PG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room / Bed</Label>
                    <Input id="room" placeholder="e.g. 201-A / B1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent (₹)</Label>
                    <Input id="rent" type="number" placeholder="8500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit (₹)</Label>
                    <Input id="deposit" type="number" placeholder="15000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="number" placeholder="5" min={1} max={28} />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Additional Charges</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="ac" className="text-xs">AC (₹)</Label>
                      <Input id="ac" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cooler" className="text-xs">Cooler (₹)</Label>
                      <Input id="cooler" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="geyser" className="text-xs">Geyser (₹)</Label>
                      <Input id="geyser" type="number" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setAddDialogOpen(false)}>Add Tenant</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, PG, room..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All PGs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All PGs</SelectItem>
                <SelectItem value="sunshine">Sunshine PG</SelectItem>
                <SelectItem value="green">Green Valley PG</SelectItem>
                <SelectItem value="metro">Metro Stay</SelectItem>
                <SelectItem value="city">City PG</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="notice">Notice Period</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2 ml-auto">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[220px]">Tenant</TableHead>
                <TableHead>PG</TableHead>
                <TableHead>Room / Bed</TableHead>
                <TableHead className="text-right">Rent (₹)</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => {
                const st = statusConfig[tenant.status];
                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {tenant.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tenant.pg}</TableCell>
                    <TableCell className="text-sm">{tenant.room} / {tenant.bed}</TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      ₹{tenant.rent.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm">{tenant.dueDate}th of month</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem><Phone className="mr-2 h-4 w-4" /> Call</DropdownMenuItem>
                          <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> Send Email</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tenants;
