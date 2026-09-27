import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Primary + secondary actions, right-aligned on desktop. */
  actions?: ReactNode;
  /** Optional breadcrumb trail rendered above the title. */
  breadcrumbs?: Crumb[];
  /** Renders a back arrow next to the title that links to this route. */
  backTo?: string;
  backLabel?: string;
  /** Small element rendered next to the title, e.g. a count badge or status. */
  titleAddon?: ReactNode;
  className?: string;
}

/**
 * Standard page header. Every routed page should start with this so titles, spacing
 * and action placement are identical across the app.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  backTo,
  backLabel = "Back",
  titleAddon,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-foreground hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "text-foreground")} aria-current={isLast ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}
                {!isLast ? <ChevronRight aria-hidden className="h-3 w-3" /> : null}
              </span>
            );
          })}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {backTo ? (
            <Button variant="ghost" size="icon" className="-ml-2 mt-0.5 h-8 w-8 shrink-0" asChild>
              <Link to={backTo} aria-label={backLabel}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-page-title truncate">{title}</h1>
              {titleAddon}
            </div>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
