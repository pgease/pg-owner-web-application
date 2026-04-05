import { Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { CanAccessPage } from "@/components/PermissionGuard";

const Expenses = () => (
  <CanAccessPage permission="expense_view">
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title="Expenses"
      description="Track and manage your PG expenses"
    />

    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Receipt className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Expense tracking coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Log expenses, categorize spending, and view monthly breakdowns in an
          upcoming update.
        </p>
      </CardContent>
    </Card>
  </div>
  </CanAccessPage>
);

export default Expenses;
