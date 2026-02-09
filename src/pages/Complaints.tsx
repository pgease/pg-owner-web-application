import { MessageSquareWarning, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const complaints = [
  { id: "C-001", tenant: "Amit Sharma", pg: "Sunshine PG", category: "Water", subject: "Low water pressure in Room 201", status: "open", date: "Feb 8" },
  { id: "C-002", tenant: "Priya Reddy", pg: "Green Valley PG", category: "Electricity", subject: "AC not working properly", status: "in_progress", date: "Feb 7" },
  { id: "C-003", tenant: "Karthik Menon", pg: "Sunshine PG", category: "Food", subject: "Food quality has deteriorated", status: "open", date: "Feb 6" },
  { id: "C-004", tenant: "Sneha Gupta", pg: "Metro Stay", category: "Hygiene", subject: "Washroom cleaning not regular", status: "resolved", date: "Feb 4" },
  { id: "C-005", tenant: "Ravi Kumar", pg: "Sunshine PG", category: "Electricity", subject: "Fan not working in room 101", status: "in_progress", date: "Feb 3" },
  { id: "C-006", tenant: "Deepa Nair", pg: "Green Valley PG", category: "Other", subject: "Noisy neighbors complaint", status: "resolved", date: "Feb 1" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "destructive" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "default" },
};

const Complaints = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm text-muted-foreground">Track and resolve tenant complaints</p>
      </div>
      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Log Complaint</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Open", count: 2, variant: "destructive" as const },
        { label: "In Progress", count: 2, variant: "secondary" as const },
        { label: "Resolved", count: 2, variant: "default" as const },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <MessageSquareWarning className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
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
              <TableHead>ID</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((c) => {
              const st = statusMap[c.status];
              return (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.tenant}</TableCell>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{c.subject}</TableCell>
                  <TableCell className="text-sm">{c.date}</TableCell>
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

export default Complaints;
