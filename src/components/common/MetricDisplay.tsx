import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface MetricDisplayProps {
  label: string;
  value: React.ReactNode;
  subText?: React.ReactNode;
  hint?: React.ReactNode;
  to?: string;
  tone?: "default" | "success" | "warning" | "danger" | "neutral" | "error" | "info";
  loading?: boolean;
  className?: string;
}

const TONE_VALUE_CLASSES: Record<string, string> = {
  default: "text-[#18212B]",
  neutral: "text-[#18212B]",
  success: "text-[#157F3D]",
  warning: "text-[#A15C07]",
  danger: "text-[#B42318]",
  error: "text-[#B42318]",
  info: "text-[#1D5FC2]",
};

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  subText,
  hint,
  to,
  tone = "default",
  loading = false,
  className,
}) => {
  const displaySubText = subText ?? hint;
  const content = (
    <div
      className={cn(
        "register-card flex flex-col justify-between p-4 transition-colors",
        to && "hover:border-[#008080] hover:bg-[#F6F7F8] cursor-pointer",
        className,
      )}
    >
      <span className="whitespace-normal text-[12px] leading-[16px] font-medium text-[#6B7785]">
        {label}
      </span>

      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-[4px] bg-[#EEF1F3]" />
        ) : (
          <span
            className={cn(
              "text-[24px] leading-[32px] font-semibold tabular-nums tracking-[-0.01em]",
              TONE_VALUE_CLASSES[tone] || TONE_VALUE_CLASSES.default,
            )}
          >
            {value}
          </span>
        )}
      </div>

      {displaySubText ? (
        <span className="mt-1 text-[12px] leading-[16px] text-[#6B7785]">
          {displaySubText}
        </span>
      ) : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080] rounded-[6px]">
        {content}
      </Link>
    );
  }

  return content;
};
