import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange?: (val: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onValueChange, onClear, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center w-full sm:w-64", className)}>
        <Search className="absolute left-2.5 h-4 w-4 text-[#98A2AE] pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange?.(e.target.value);
            props.onChange?.(e);
          }}
          placeholder={placeholder}
          className="h-[36px] w-full rounded-[6px] border border-[#C8CFD6] bg-white pl-8 pr-7 text-[13px] text-[#18212B] placeholder:text-[#98A2AE] hover:border-[#98A2AE] focus:border-[#008080] focus:outline-none focus:ring-[3px] focus:ring-[rgba(0,128,128,0.25)] transition-colors"
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onValueChange?.("");
              onClear?.();
            }}
            className="absolute right-2 p-0.5 text-[#98A2AE] hover:text-[#18212B] transition-colors rounded-sm"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
