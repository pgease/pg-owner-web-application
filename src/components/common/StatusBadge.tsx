import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "error" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#ECFAF1] text-[#157F3D] border-[#B4E5C5]",
  warning: "bg-[#FFF7E6] text-[#A15C07] border-[#F5D9A8]",
  error:   "bg-[#FEF1F0] text-[#B42318] border-[#F6C7C2]",
  danger:  "bg-[#FEF1F0] text-[#B42318] border-[#F6C7C2]",
  info:    "bg-[#EEF5FF] text-[#1D5FC2] border-[#BFD6F6]",
  neutral: "bg-[#F1F3F5] text-[#475462] border-[#D5DBE1]",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#22A350]",
  warning: "bg-[#E08A00]",
  error:   "bg-[#D92D20]",
  danger:  "bg-[#D92D20]",
  info:    "bg-[#2E77E5]",
  neutral: "bg-[#8A96A3]",
};

/**
 * Normalizes backend enum strings to design system tones according to Section 4.8.
 */
const STATUS_TONE_MAP: Record<string, StatusTone> = {
  // Success
  paid: "success",
  occupied: "success",
  resolved: "success",
  completed: "success",
  verified: "success",
  approved: "success",
  active: "success",
  signed: "success",
  kyc_completed: "success",
  kyc_verified: "success",

  // Warning
  partially_paid: "warning",
  partial: "warning",
  due_today: "warning",
  due: "warning",
  on_notice: "warning",
  notice_active: "warning",
  notice: "warning",
  under_notice: "warning",
  kyc_pending: "warning",

  // Error / Destructive
  overdue: "error",
  critical: "error",
  rejected: "error",
  open: "error",
  complaint_open: "error",
  expired: "error",
  failed: "error",

  // Info
  verification_pending: "info",
  awaiting_verification: "info",
  booked: "info",
  reserved: "info",
  in_progress: "info",
  processing: "info",
  kyc_link_sent: "info",
  sent: "info",
  new: "info",

  // Neutral
  pending: "neutral",
  vacant: "neutral",
  blocked: "neutral",
  under_repair: "neutral",
  inactive: "neutral",
  moved_out: "neutral",
  closed: "neutral",
  archived: "neutral",
  draft: "neutral",
  low: "neutral",
  medium: "info",
  high: "error",
  urgent: "error",
};

/** Human readable labels - Section 4.8 */
const STATUS_LABEL_MAP: Record<string, string> = {
  paid: "Paid",
  partially_paid: "Partially paid",
  partial: "Partially paid",
  pending: "Pending",
  due_today: "Due today",
  overdue: "Overdue",
  critical: "Overdue",
  verification_pending: "Verification pending",
  awaiting_verification: "Verification pending",
  rejected: "Rejected",
  occupied: "Occupied",
  vacant: "Vacant",
  on_notice: "On notice",
  under_notice: "On notice",
  booked: "Booked",
  reserved: "Reserved",
  blocked: "Blocked",
  under_repair: "Under repair",
  kyc_pending: "KYC pending",
  kyc_completed: "KYC completed",
  kyc_verified: "KYC verified",
  kyc_link_sent: "KYC link sent",
  open: "Open",
  complaint_open: "Complaint open",
  in_progress: "In progress",
  resolved: "Resolved",
  notice_active: "Notice active",
  inactive: "Inactive",
  moved_out: "Moved out",
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

export interface StatusBadgeProps {
  /** Raw backend status value. Used for tone + label unless overridden. */
  status?: string | null;
  /** Override the computed tone. */
  tone?: StatusTone;
  /** Override the computed label. */
  label?: string;
  /** Show a leading dot indicator (default: true). */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  tone,
  label,
  dot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const resolvedTone = tone ?? toneForStatus(status);
  const resolvedLabel = label ?? labelForStatus(status);
  const isVacant = normalizeStatusKey(status) === "vacant";

  return (
    <span
      role="status"
      aria-label={resolvedLabel}
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 text-[12px] leading-[16px] font-medium select-none",
        TONE_CLASSES[resolvedTone],
        isVacant && "bg-white border-[#C8CFD6] text-[#475462]",
        size === "sm" && "h-[20px] px-1.5 text-[11px]",
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-[6px] w-[6px] shrink-0 rounded-full",
            DOT_CLASSES[resolvedTone],
            isVacant && "bg-[#8A96A3]",
          )}
        />
      ) : null}
      <span>{resolvedLabel}</span>
    </span>
  );
}
