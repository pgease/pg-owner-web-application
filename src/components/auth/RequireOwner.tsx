import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { authStorage } from "@/api/http";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequireOwnerProps {
  children: ReactNode;
}

export const RequireOwner = ({ children }: RequireOwnerProps) => {
  const isOwner = authStorage.isOwner();

  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Owner-Only Access
        </h2>
        <p className="max-w-md text-sm text-muted-foreground mb-6">
          This section contains sensitive administrative controls (plans, billing, team permissions, or bank details) and is restricted to the primary property owner.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireOwner;
