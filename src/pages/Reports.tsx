import { BarChart3, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";

const reportTypes = [
  { title: "Tenant List", description: "Complete list of all tenants across PGs", format: "Excel" },
  { title: "Rent Collection Report", description: "Monthly rent collection summary", format: "PDF / Excel" },
  { title: "Vacancy Report", description: "Current vacancy status across all PGs", format: "Excel" },
  { title: "Notice Period Report", description: "Tenants in notice period with exit dates", format: "PDF" },
  { title: "Revenue Summary", description: "Monthly and quarterly revenue breakdown", format: "PDF" },
  { title: "Complaint Analytics", description: "Complaint trends and resolution times", format: "PDF" },
];

const Reports = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title="Reports"
      description="Generate and download reports"
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reportTypes.map((r) => (
        <Card key={r.title}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <CardTitle className="text-base mt-2">{r.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{r.description}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-primary font-medium">{r.format}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <p className="text-sm text-muted-foreground text-center">
      Report generation and export will be available in an upcoming update.
    </p>
  </div>
);

export default Reports;
