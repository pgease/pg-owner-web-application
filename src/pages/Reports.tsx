import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import {
  useAnalyticsOccupancy,
  useAnalyticsPgGrowth,
  useAnalyticsRevenue,
} from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

const Reports = () => {
  const { selectedPgId, properties, setSelectedPgId } = useApp();
  const pgGrowth = useAnalyticsPgGrowth();
  const revenue = useAnalyticsRevenue(selectedPgId);
  const occupancy = useAnalyticsOccupancy(selectedPgId);

  return (
    <CanAccessPage permission="report_people">
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & reports"
        description="Analytics endpoints from your Postman collection (revenue, occupancy, pg-growth)"
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label>Property for revenue/occupancy</Label>
          <Select value={selectedPgId ?? "none"} onValueChange={(v) => { if (v !== "none") setSelectedPgId(v); }}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select PG" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JsonBlock
          title="GET /analytics/pg-growth"
          data={pgGrowth.isLoading ? undefined : pgGrowth.isError ? { error: "Failed to load" } : pgGrowth.data}
        />
        <JsonBlock
          title="GET /analytics/revenue?propertyId=…"
          data={!selectedPgId ? { message: "Select a property" } : revenue.isLoading ? undefined : revenue.isError ? { error: "Failed to load" } : revenue.data}
        />
      </div>
      <JsonBlock
        title="GET /analytics/occupancy?propertyId=…"
        data={!selectedPgId ? { message: "Select a property" } : occupancy.isLoading ? undefined : occupancy.isError ? { error: "Failed to load" } : occupancy.data}
      />
    </div>
    </CanAccessPage>
  );
};

export default Reports;
