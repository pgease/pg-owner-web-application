import { IndianRupee, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";

const summaryCards = [
  { label: "Collected", value: "0", icon: CheckCircle2, color: "text-success" },
  { label: "Pending", value: "0", icon: Clock, color: "text-warning" },
  { label: "Overdue", value: "0", icon: AlertCircle, color: "text-destructive" },
];

const RentPayments = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title="Rent & Payments"
      description="Track rent collection across all PGs"
    />

    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <Badge variant="outline" className="text-[10px] ml-1">
                Coming soon
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <IndianRupee className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Rent tracking coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Automated rent collection, payment tracking, and reminders will be
          available in an upcoming update.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default RentPayments;
