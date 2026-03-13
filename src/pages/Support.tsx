import { LifeBuoy, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";

const Support = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title="Support"
      description="Need help? We're here for you."
    />

    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <LifeBuoy className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Support center coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Create tickets, track issues, and get help — available in an upcoming
          update.
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>
            For immediate help, email{" "}
            <a
              href="mailto:support@pgease.in"
              className="text-primary font-medium hover:underline"
            >
              support@pgease.in
            </a>
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Support;
