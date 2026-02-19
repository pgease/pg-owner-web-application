import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Building2,
  BedDouble,
  IndianRupee,
  Activity,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";
import { useApp } from "@/context/AppContext";

const manageItems = [
  { title: "Staff Management", desc: "Manage your team", icon: Users, path: "/staff" },
  { title: "Complaints", desc: "Manage tenants issues", icon: AlertTriangle, path: "/complaints" },
  { title: "Announcement", desc: "Broadcast updates to all tenants", icon: Megaphone, path: "/support" },
];

const getOverviewStats = (pgCount: number) => [
  { label: "Total PGs", value: String(pgCount), sub: "Properties", icon: Building2, trend: "neutral" as const },
  { label: "Total Tenants", value: "—", sub: "Across all PGs", icon: Users, trend: "up" as const },
  { label: "Vacant Beds", value: "—", sub: "Available", icon: BedDouble, trend: "neutral" as const },
  { label: "Rent Due", value: "—", sub: "Pending", icon: IndianRupee, trend: "down" as const },
];

const kpiStats = [
  { label: "Occupancy Rate", value: "87%", sub: "Target 90%", icon: BarChart3 },
  { label: "Collection Rate", value: "94%", sub: "This month", icon: TrendingUp },
  { label: "Avg. Rent", value: "₹9,200", sub: "Per bed", icon: IndianRupee },
  { label: "Notice Period", value: "5", sub: "Ending this month", icon: Activity },
];

const recentActivity = [
  { text: "Priya Reddy paid rent ₹18,000", time: "2 hours ago" },
  { text: "New tenant Sneha Gupta joined Metro Stay", time: "5 hours ago" },
  { text: "Complaint #12 resolved", time: "1 day ago" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties } = useApp();
  const [addTenantOpen, setAddTenantOpen] = useState(false);

  const isKpiPage = location.pathname === "/kpis";
  const pgCount = Array.isArray(properties) ? properties.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isKpiPage ? "KPIs" : "Dashboard Overview"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isKpiPage
              ? "Key performance indicators for your properties"
              : "Welcome back. Here's your PG overview."}
          </p>
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

      {/* Stats grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {isKpiPage ? "Key metrics" : "At a glance"}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(isKpiPage ? kpiStats : getOverviewStats(pgCount)).map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="overflow-hidden border-border/80 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {"trend" in stat && stat.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {"trend" in stat && stat.trend === "down" && (
                      <TrendingDown className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Finance overview - show on Overview, optional on KPI */}
      {!isKpiPage && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Finance overview
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/15 p-2.5">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total inflow</p>
                      <p className="text-2xl font-bold">₹50,000</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2.5">
                      <TrendingDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total outflow</p>
                      <p className="text-2xl font-bold">₹45,000</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/15 p-2.5">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net profit</p>
                      <p className="text-2xl font-bold">₹5,000</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recent activity
            </h2>
            <Card className="border-border/80">
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{item.text}</span>
                      <span className="text-muted-foreground text-xs">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <div className="border-t border-border/80" />

      {/* Manage */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Manage
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {manageItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all border-border/80"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-background border border-border/80 p-2.5 shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
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
