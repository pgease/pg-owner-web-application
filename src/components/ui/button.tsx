import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#008080] text-white hover:bg-[#006B6B] active:bg-[#005757]",
        secondary: "bg-white border border-[#C8CFD6] text-[#18212B] hover:bg-[#F6F7F8] active:bg-[#EEF1F3]",
        outline: "bg-white border border-[#C8CFD6] text-[#18212B] hover:bg-[#F6F7F8] active:bg-[#EEF1F3]",
        ghost: "text-[#3D4A57] hover:bg-[#EEF1F3] active:bg-[#E2E6EA]",
        destructive: "bg-[#B42318] text-white hover:bg-[#912018]",
        destructiveOutline: "border border-[#B42318] text-[#B42318] hover:bg-[#FEF1F0]",
        link: "text-[#008080] underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-[36px] px-[14px] text-[14px] leading-[20px] font-medium",
        sm: "h-[32px] px-[10px] text-[13px] leading-[18px] font-medium",
        lg: "h-[40px] px-[16px] text-[14px] leading-[20px] font-semibold",
        icon: "h-[36px] w-[36px] p-0",
        iconSm: "h-[32px] w-[32px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin size-4 shrink-0" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
