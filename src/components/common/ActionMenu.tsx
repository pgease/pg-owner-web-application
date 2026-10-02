import React from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface ActionMenuItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: (ActionMenuItem | "separator")[];
  ariaLabel?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  ariaLabel = "More options",
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          className="h-8 w-8 text-[#556270] hover:text-[#18212B]"
          aria-label={ariaLabel}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 shadow-pop border-[#E2E6EA] bg-white">
        {items.map((item, index) => {
          if (item === "separator") {
            return <DropdownMenuSeparator key={`sep-${index}`} className="bg-[#E2E6EA]" />;
          }

          return (
            <DropdownMenuItem
              key={index}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className={`flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer rounded-[4px] ${
                item.destructive
                  ? "text-[#B42318] focus:bg-[#FEF1F0] focus:text-[#B42318]"
                  : "text-[#18212B] focus:bg-[#EEF1F3] focus:text-[#18212B]"
              }`}
            >
              {item.icon ? <span className="h-4 w-4 shrink-0 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span> : null}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
