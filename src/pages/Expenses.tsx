import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, IndianRupee, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const expenses = [
  { id: 1, date: "Feb 8, 2026", category: "Electricity", description: "EB bill – Jan", amount: "₹12,400", pg: "Sunshine PG" },
  { id: 2, date: "Feb 6, 2026", category: "Maintenance", description: "Plumber – bathroom repair", amount: "₹2,500", pg: "Green Valley PG" },
  { id: 3, date: "Feb 5, 2026", category: "Groceries", description: "Kitchen supplies", amount: "₹6,800", pg: "Sunshine PG" },
  { id: 4, date: "Feb 3, 2026", category: "Salary", description: "Cook salary – Feb", amount: "₹15,000", pg: "Metro Stay" },
  { id: 5, date: "Feb 1, 2026", category: "Internet", description: "WiFi bill – Feb", amount: "₹3,200", pg: "Sunshine PG" },
];

const stats = [
  { label: "This Month", value: "₹39,900", icon: IndianRupee },
  { label: "Last Month", value: "₹52,300", icon: TrendingUp },
];

const Expenses = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage your PG expenses</p>
        </div>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Recent Expenses</CardTitle>
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>PG</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.date}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell className="text-sm">{e.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.pg}</TableCell>
                    <TableCell className="text-right font-semibold">{e.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
