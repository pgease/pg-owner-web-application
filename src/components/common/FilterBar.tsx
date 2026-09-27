import { type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  /** Number of non-default filters currently applied. Shows a "Clear filters" button when > 0. */
  activeCount?: number;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({ children, activeCount = 0, onReset, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
      {onReset && activeCount > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1.5 self-start text-muted-foreground lg:self-auto">
          <X className="h-3.5 w-3.5" />
          Clear filters
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{activeCount}</span>
        </Button>
      ) : null}
    </div>
  );
}
