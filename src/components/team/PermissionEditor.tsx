import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { PERMISSION_GROUPS, type Tier } from "@/constants/permissionGroups";
import type { PresetCell } from "@/constants/rolePresets";
import { cn } from "@/lib/utils";

const tierStyles: Record<Tier, string> = {
  free: "bg-[#EAF3DE] text-[#3B6D11]",
  lite: "bg-[#FAEEDA] text-[#854F0B]",
  pro: "bg-[#EEEDFE] text-[#534AB7]",
};

const tierLabel: Record<Tier, string> = {
  free: "FREE",
  lite: "LITE",
  pro: "PRO",
};

export function PermissionEditor({
  preset,
  enabled,
  onToggle,
}: {
  preset: Record<string, PresetCell>;
  enabled: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}) {
  const defaultOpen = useMemo(() => {
    return PERMISSION_GROUPS.filter((g) =>
      g.permissions.some((p) => preset[p.key] !== undefined)
    ).map((g) => g.id);
  }, [preset]);

  return (
    <TooltipProvider delayDuration={200}>
      <Accordion type="multiple" defaultValue={defaultOpen} className="w-full border rounded-lg px-3">
        {PERMISSION_GROUPS.map((group) => {
          const visible = group.permissions.filter((p) => preset[p.key] !== undefined);
          if (visible.length === 0) return null;
          return (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger className="text-sm font-semibold">{group.label}</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {visible.map((p) => {
                  const cell = preset[p.key]!;
                  const isAlways = cell === "always";
                  const checked = enabled[p.key] ?? false;
                  return (
                    <div
                      key={p.key}
                      className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-dashed pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-1 items-start gap-3 min-w-0">
                        {isAlways ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 pt-0.5 shrink-0">
                                <Switch checked disabled className="data-[state=checked]:bg-blue-600" />
                                <Lock className="h-3.5 w-3.5 text-blue-600" aria-hidden />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              This permission is always required for this role
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Switch
                            className="shrink-0 mt-0.5 data-[state=checked]:bg-emerald-600"
                            checked={checked}
                            onCheckedChange={(v) => onToggle(p.key, v)}
                          />
                        )}
                        <div className="min-w-0">
                          <Label className="text-sm font-semibold leading-snug">{p.name}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          tierStyles[p.tier]
                        )}
                      >
                        {tierLabel[p.tier]}
                      </span>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </TooltipProvider>
  );
}
