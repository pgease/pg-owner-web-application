import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Megaphone,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";

const manageItems = [
  { title: "Staff Management", desc: "Manage your team", icon: Users, path: "/staff" },
  { title: "Complaints", desc: "Manage tenants issues", icon: AlertTriangle, path: "/complaints" },
  { title: "Announcement", desc: "Broadcast updates to all tenants", icon: Megaphone, path: "/support" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [addTenantOpen, setAddTenantOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's your PG overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Import</span> Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span> Invite
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setAddTenantOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Tenant
          </Button>
        </div>
      </div>

      {/* Finance overview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Finance overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total inflow</p>
                  <p className="text-2xl font-bold">50,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted-foreground/20 p-2">
                  <TrendingDown className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Outflow</p>
                  <p className="text-2xl font-bold">50,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted-foreground/20 p-2">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">5,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="border-t border-dashed" />

      {/* Manage */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Manage</h2>
        <div className="space-y-2">
          {manageItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-background p-2.5 shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <AddTenantDialog open={addTenantOpen} onOpenChange={setAddTenantOpen} />
    </div>
  );
};

export default Dashboard;
