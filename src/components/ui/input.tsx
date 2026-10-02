import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sizeVariant?: "default" | "filter";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, sizeVariant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-[6px] border border-[#C8CFD6] bg-white px-3 text-[14px] leading-[20px] text-[#18212B] transition-colors placeholder:text-[#98A2AE] hover:border-[#98A2AE] focus-visible:outline-none focus-visible:border-[#008080] focus-visible:ring-[3px] focus-visible:ring-[rgba(0,128,128,0.25)] disabled:cursor-not-allowed disabled:bg-[#EEF1F3] disabled:text-[#98A2AE] file:border-0 file:bg-transparent file:text-sm file:font-medium",
          sizeVariant === "filter" ? "h-[36px]" : "h-[40px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
