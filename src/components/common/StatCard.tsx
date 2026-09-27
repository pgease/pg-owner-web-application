import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "success" | "warning" | "danger" | "info" | "brand";

const ICON_TONE: Record<StatTone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-amber-700 dark:text-amber-300",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  brand: "bg-primary/10 text-primary",
};

const VALUE_TONE: Record<StatTone, string> = {
  default: "text-foreground",
  success: "text-foreground",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-destructive",
  info: "text-foreground",
  brand: "text-foreground",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small secondary line under the value (e.g. "12 tenants", "vs last month"). */
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  /** Skeleton while data loads. */
  loading?: boolean;
  /** Makes the whole card a clickable target. */
  onClick?: () => void;
  className?: string;
}

/**
 * Compact operational metric card. Neutral surface, semantic accent only on the icon
 * (and on the value for warning/danger so problems stand out without flooding colour).
 */
export function StatCard({ label, value, hint, icon, tone = "default", loading, onClick, className }: StatCardProps) {
  const interactive = typeof onClick === "function";
  const Comp: "button" | "div" = interactive ? "button" : "div";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-sm",
        interactive &&
          "transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-label truncate">{label}</p>
        {icon ? (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4", ICON_TONE[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className={cn("text-stat truncate", VALUE_TONE[tone])}>{value}</p>
        )}
        {hint ? (
          loading ? <Skeleton className="mt-1.5 h-3.5 w-20" /> : <p className="text-caption mt-1 truncate">{hint}</p>
        ) : null}
      </div>
      {interactive ? (
        <ArrowUpRight
          aria-hidden
          className="absolute right-3 bottom-3 h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground"
        />
      ) : null}
    </Comp>
  );
}
