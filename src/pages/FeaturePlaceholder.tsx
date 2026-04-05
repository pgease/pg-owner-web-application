import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CanAccessPage } from "@/components/PermissionGuard";

export function FeaturePlaceholder({ title, permission }: { title: string; permission: string }) {
  return (
    <CanAccessPage permission={permission}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={title} description="This section will be available here soon." />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Coming soon
          </CardContent>
        </Card>
      </div>
    </CanAccessPage>
  );
}
