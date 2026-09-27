import { cn } from "@/lib/utils";

/**
 * Semantic tones shared by every status badge in the app.
 * Pages should map backend enum values to one of these — never invent new colors per page.
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success border-success/20 dark:text-emerald-300",
  warning: "bg-warning/10 text-amber-700 border-warning/25 dark:text-amber-300",
  danger: "bg-destructive/10 text-destructive border-destructive/20 dark:text-rose-300",
  info: "bg-info/10 text-info border-info/20 dark:text-blue-300",
  neutral: "bg-muted text-muted-foreground border-border",
  brand: "bg-primary/10 text-primary border-primary/20",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
  brand: "bg-primary",
};

/**
 * Backend status → tone. Keys are lower-cased, with spaces/hyphens normalised to underscores.
 * Presentation-only: this never changes the value sent to or received from the API.
 */
const STATUS_TONE_MAP: Record<string, StatusTone> = {
  // Success
  paid: "success",
  active: "success",
  verified: "success",
  approved: "success",
  resolved: "success",
  completed: "success",
  success: "success",
  signed: "success",
  occupied: "success",
  confirmed: "success",
  // Warning
  pending: "warning",
  partial: "warning",
  partially_paid: "warning",
  in_progress: "warning",
  processing: "warning",
  awaiting_verification: "warning",
  submitted: "warning",
  under_review: "warning",
  on_notice: "warning",
  notice: "warning",
  due: "warning",
  // Danger
  overdue: "danger",
  rejected: "danger",
  expired: "danger",
  failed: "danger",
  cancelled: "danger",
  canceled: "danger",
  open: "danger",
  urgent: "danger",
  high: "danger",
  blocked: "danger",
  // Info
  new: "info",
  sent: "info",
  scheduled: "info",
  medium: "info",
  // Neutral
  draft: "neutral",
  inactive: "neutral",
  closed: "neutral",
  archived: "neutral",
  vacant: "neutral",
  low: "neutral",
  unknown: "neutral",
};

/** Friendly labels for values where a simple "replace underscores" isn't good enough. */
const STATUS_LABEL_MAP: Record<string, string> = {
  awaiting_verification: "Waiting for verification",
  partially_paid: "Partially paid",
  partial: "Partially paid",
  in_progress: "In progress",
  on_notice: "On notice",
  under_review: "Under review",
};

export function normalizeStatusKey(status?: string | null): string {
  return String(status ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function toneForStatus(status?: string | null): StatusTone {
  return STATUS_TONE_MAP[normalizeStatusKey(status)] ?? "neutral";
}

export function labelForStatus(status?: string | null): string {
  const key = normalizeStatusKey(status);
  if (STATUS_LABEL_MAP[key]) return STATUS_LABEL_MAP[key];
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface StatusBadgeProps {
  /** Raw backend status value. Used for tone + label unless overridden. */
  status?: string | null;
  /** Override the computed tone. */
  tone?: StatusTone;
  /** Override the computed label. */
  label?: string;
  /** Show a leading dot indicator. */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, tone, label, dot = false, size = "md", className }: StatusBadgeProps) {
  const resolvedTone = tone ?? toneForStatus(status);
  const resolvedLabel = label ?? labelForStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium leading-none",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASSES[resolvedTone])} /> : null}
      {resolvedLabel}
    </span>
  );
}
