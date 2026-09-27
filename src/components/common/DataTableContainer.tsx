import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableContainerProps {
  children: ReactNode;
  /** Optional toolbar rendered above the table (search, filters, bulk actions). */
  toolbar?: ReactNode;
  /** Optional footer rendered below the table (pagination, totals). */
  footer?: ReactNode;
  className?: string;
}

/**
 * Standard wrapper for data tables: bordered card, horizontal scroll on small screens,
 * consistent toolbar/footer slots.
 */
export function DataTableContainer({ children, toolbar, footer, className }: DataTableContainerProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", className)}>
      {toolbar ? <div className="border-b p-3 sm:p-4">{toolbar}</div> : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t p-3 sm:p-4">{footer}</div> : null}
    </div>
  );
}
