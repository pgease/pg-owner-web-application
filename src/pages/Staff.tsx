import { UserCog, Plus, Shield, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const staff = [
  { name: "Ramesh Kumar", role: "Warden", pg: "Sunshine PG", phone: "9876500001", status: "active" },
  { name: "Lakshmi Devi", role: "Cook", pg: "Green Valley PG", phone: "9876500002", status: "active" },
  { name: "Vijay Singh", role: "Security", pg: "Metro Stay", phone: "9876500003", status: "active" },
  { name: "Meena Sharma", role: "Housekeeping", pg: "City PG", phone: "9876500004", status: "on_leave" },
];

const Staff = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">Manage your PG staff and roles</p>
      </div>
      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Staff</Button>
    </div>

    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <Shield className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-medium">Staff roles & advanced permissions are available on the Pro plan</p>
        <p className="text-xs text-muted-foreground">Upgrade to assign complaints, track activity, and manage staff permissions.</p>
      </div>
      <Button size="sm" variant="outline" className="ml-auto shrink-0">Upgrade</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {staff.map((s) => (
        <Card key={s.name} className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {s.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.role} · {s.pg}</p>
            </div>
            <Badge variant={s.status === "active" ? "default" : "secondary"}>
              {s.status === "active" ? "Active" : "On Leave"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Staff;
