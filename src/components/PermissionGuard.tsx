import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";

export function CanAccess({ permission, children }: { permission: string; children: ReactNode }) {
  const { can, isOwner } = usePermissions();
  if (isOwner || can(permission)) return <>{children}</>;
  return null;
}

export function CanAccessPage({ permission, children }: { permission: string; children: ReactNode }) {
  const { can, isOwner } = usePermissions();
  if (isOwner || can(permission)) return <>{children}</>;
  return <NoAccessPage />;
}

export function NoAccessPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">You don&apos;t have permission to access this page</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Contact your PG owner to request access.
      </p>
      <Button variant="outline" className="mt-8 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
    </div>
  );
}

interface LockedSidebarItemProps {
  label: string;
  icon?: React.ElementType;
  className?: string;
}

export function LockedSidebarItem({ label, icon: Icon, className }: LockedSidebarItemProps) {
  return (
    <div
      className={cn(
        "flex w-full cursor-not-allowed items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-[13px] font-medium text-muted-foreground/80 opacity-75",
        className
      )}
      title="You don&apos;t have access"
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0 opacity-60" /> : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-amber-700/90 dark:text-amber-500/90" aria-hidden>
        <Lock className="h-3.5 w-3.5" />
        <span className="uppercase tracking-wide">Locked</span>
      </span>
    </div>
  );
}
