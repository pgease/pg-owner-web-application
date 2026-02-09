import { BarChart3, Download, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reports = [
  { title: "Tenant List", description: "Complete list of all tenants across PGs", format: "Excel" },
  { title: "Rent Collection Report", description: "Monthly rent collection summary", format: "PDF / Excel" },
  { title: "Vacancy Report", description: "Current vacancy status across all PGs", format: "Excel" },
  { title: "Notice Period Report", description: "Tenants in notice period with exit dates", format: "PDF" },
  { title: "Revenue Summary", description: "Monthly and quarterly revenue breakdown", format: "PDF" },
  { title: "Complaint Analytics", description: "Complaint trends and resolution times", format: "PDF" },
];

const Reports = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and download reports</p>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((r) => (
        <Card key={r.title} className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-base mt-2">{r.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{r.description}</p>
            <p className="text-xs text-primary font-medium mt-2">{r.format}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Reports;
