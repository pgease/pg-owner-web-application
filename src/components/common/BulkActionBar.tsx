import React from "react";
import { Button } from "@/components/ui/button";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "secondary" | "destructive";
  }[];
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClear,
  actions,
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#CCE6E6] bg-[#E8F4F4] px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#008080]">
          {selectedCount} selected
        </span>
        <span className="text-[#6B7785]">·</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[#008080] hover:underline font-medium"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act, i) => (
          <Button
            key={i}
            size="sm"
            variant={act.variant === "destructive" ? "destructive" : "secondary"}
            onClick={act.onClick}
            className="h-[30px] px-2.5 text-xs gap-1"
          >
            {act.icon}
            <span>{act.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
