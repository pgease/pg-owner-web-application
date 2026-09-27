import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  /** Friendly explanation. Never pass raw backend error text here. */
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Couldn't load this section",
  description = "Please check your internet connection and try again. If the problem continues, contact support.",
  onRetry,
  retrying,
  compact,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-full bg-destructive/10 text-destructive",
          compact ? "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5" : "h-14 w-14 [&_svg]:h-6 [&_svg]:w-6",
        )}
      >
        <AlertTriangle />
      </div>
      <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</h3>
      <p className={cn("mt-1.5 max-w-sm text-muted-foreground", compact ? "text-xs" : "text-sm")}>{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5 gap-2" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
