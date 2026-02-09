import {
  Building2,
  Users,
  BedDouble,
  IndianRupee,
  MessageSquareWarning,
  Clock,
  UserPlus,
  FileSpreadsheet,
  Send,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const stats = [
  { label: "Total PGs", value: "4", icon: Building2, change: "+1 this month", trend: "up" as const },
  { label: "Total Tenants", value: "187", icon: Users, change: "+12 this month", trend: "up" as const },
  { label: "Vacant Beds", value: "23", icon: BedDouble, change: "across 4 PGs", trend: "neutral" as const },
  { label: "Rent Due", value: "₹4,82,000", icon: IndianRupee, change: "68 tenants", trend: "down" as const },
  { label: "Complaints", value: "8", icon: MessageSquareWarning, change: "3 critical", trend: "down" as const },
  { label: "Notice Period", value: "5", icon: Clock, change: "ending this month", trend: "neutral" as const },
];

const monthlyData = [
  { month: "Aug", collected: 680000, pending: 45000 },
  { month: "Sep", collected: 720000, pending: 38000 },
  { month: "Oct", collected: 695000, pending: 52000 },
  { month: "Nov", collected: 740000, pending: 28000 },
  { month: "Dec", collected: 710000, pending: 60000 },
  { month: "Jan", collected: 755000, pending: 35000 },
  { month: "Feb", collected: 482000, pending: 482000 },
];

const recentTenants = [
  { name: "Amit Sharma", pg: "Sunshine PG", room: "201-A", date: "Feb 5, 2026", rent: "₹8,500" },
  { name: "Priya Reddy", pg: "Green Valley PG", room: "105-B", date: "Feb 3, 2026", rent: "₹9,000" },
  { name: "Karthik M.", pg: "Sunshine PG", room: "302-C", date: "Jan 28, 2026", rent: "₹7,500" },
  { name: "Sneha Gupta", pg: "Metro Stay", room: "401-A", date: "Jan 25, 2026", rent: "₹10,000" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, Rajesh. Here's your PG overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> Send Invite
          </Button>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Add Tenant
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(180, 100%, 25%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(180, 100%, 25%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(200, 10%, 45%)" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(200, 10%, 45%)"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(200, 15%, 90%)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="hsl(180, 100%, 25%)"
                  strokeWidth={2}
                  fill="url(#colorCollected)"
                  name="Collected"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  fill="hsl(38, 92%, 50%)"
                  fillOpacity={0.1}
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent tenants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTenants.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.pg} · {t.room}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{t.rent}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
