import { IndianRupee, CheckCircle2, Clock, AlertCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const payments = [
  { tenant: "Amit Sharma", pg: "Sunshine PG", room: "201-A", amount: 8500, status: "paid", date: "Feb 5" },
  { tenant: "Priya Reddy", pg: "Green Valley PG", room: "105-B", amount: 9000, status: "paid", date: "Feb 3" },
  { tenant: "Karthik Menon", pg: "Sunshine PG", room: "302-C", amount: 7500, status: "overdue", date: "Feb 5" },
  { tenant: "Sneha Gupta", pg: "Metro Stay", room: "401-A", amount: 10000, status: "pending", date: "Feb 1" },
  { tenant: "Ravi Kumar", pg: "Sunshine PG", room: "101-A", amount: 8000, status: "paid", date: "Feb 5" },
  { tenant: "Deepa Nair", pg: "Green Valley PG", room: "202-A", amount: 9500, status: "pending", date: "Feb 1" },
  { tenant: "Suresh Babu", pg: "City PG", room: "301-B", amount: 7000, status: "overdue", date: "Feb 5" },
];

const statusMap: Record<string, { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" }> = {
  paid: { label: "Paid", icon: CheckCircle2, variant: "default" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  overdue: { label: "Overdue", icon: AlertCircle, variant: "destructive" },
};

const RentPayments = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rent & Payments</h1>
        <p className="text-sm text-muted-foreground">Track rent collection across all PGs</p>
      </div>
      <Button size="sm" className="gap-2"><Send className="h-4 w-4" /> Send Reminders</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Collected", value: "₹5,23,500", sub: "5 tenants", icon: CheckCircle2, color: "text-success" },
        { label: "Pending", value: "₹1,95,000", sub: "2 tenants", icon: Clock, color: "text-warning" },
        { label: "Overdue", value: "₹14,500", sub: "2 tenants", icon: AlertCircle, color: "text-destructive" },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label} · {s.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tenant</TableHead>
              <TableHead>PG / Room</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const st = statusMap[p.status];
              return (
                <TableRow key={p.tenant}>
                  <TableCell className="font-medium">{p.tenant}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.pg} · {p.room}</TableCell>
                  <TableCell className="text-right font-medium">₹{p.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm">{p.date}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default RentPayments;
