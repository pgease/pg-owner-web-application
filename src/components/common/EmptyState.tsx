import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  /** Say what is empty, e.g. "No tenants added yet". Avoid "No data available". */
  title: string;
  /** Tell the user what they can do next. */
  description?: ReactNode;
  /** Primary CTA, e.g. <Button>Add your first tenant</Button>. */
  action?: ReactNode;
  /** Optional secondary link/button, e.g. "Learn how tenants work". */
  secondaryAction?: ReactNode;
  /** Tighter padding for use inside tables/cards. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon, title, description, action, secondaryAction, compact, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:h-6 [&_svg]:w-6",
            compact ? "h-11 w-11" : "h-14 w-14",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</h3>
      {description ? (
        <p className={cn("mt-1.5 max-w-sm text-muted-foreground", compact ? "text-xs" : "text-sm")}>{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
