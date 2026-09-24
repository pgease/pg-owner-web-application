import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, Eye, Edit3, Trash2, ShieldCheck, Search, Filter } from "lucide-react";
import { PERMISSION_GROUPS, type Tier, type PermissionAction } from "@/constants/permissionGroups";
import type { PresetCell } from "@/constants/rolePresets";
import { cn } from "@/lib/utils";

const tierStyles: Record<Tier, string> = {
  free: "bg-[#EAF3DE] text-[#3B6D11] border-[#c2e49c]",
  lite: "bg-[#FAEEDA] text-[#854F0B] border-[#f3d297]",
  pro: "bg-[#EEEDFE] text-[#534AB7] border-[#c8c5fc]",
};

const tierLabel: Record<Tier, string> = {
  free: "FREE",
  lite: "LITE",
  pro: "PRO",
};

const actionStyles: Record<PermissionAction, { label: string; icon: any; className: string }> = {
  view: {
    label: "VIEW ONLY",
    icon: Eye,
    className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
  },
  edit: {
    label: "EDIT / ACTION",
    icon: Edit3,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  delete: {
    label: "DELETE / PURGE",
    icon: Trash2,
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  admin: {
    label: "ADMIN CONTROL",
    icon: ShieldCheck,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  },
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
  const [filterAction, setFilterAction] = useState<"all" | "view" | "edit">("all");
  const [search, setSearch] = useState("");

  const defaultOpen = useMemo(() => {
    return PERMISSION_GROUPS.filter((g) =>
      g.permissions.some((p) => preset[p.key] !== undefined)
    ).map((g) => g.id);
  }, [preset]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        {/* Filter bar for View vs Edit and search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-muted/40 p-2.5 rounded-lg border border-border/60">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions or backend key..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Type:
            </span>
            <button
              type="button"
              onClick={() => setFilterAction("all")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                filterAction === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterAction("view")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1",
                filterAction === "view"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-background text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              <Eye className="h-3 w-3" /> View Only
            </button>
            <button
              type="button"
              onClick={() => setFilterAction("edit")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1",
                filterAction === "edit"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-background text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              <Edit3 className="h-3 w-3" /> Edit / Action
            </button>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full border rounded-lg px-3">
          {PERMISSION_GROUPS.map((group) => {
            const visible = group.permissions.filter((p) => {
              if (preset[p.key] === undefined) return false;
              if (filterAction === "view" && p.action !== "view") return false;
              if (filterAction === "edit" && p.action === "view") return false;
              if (search.trim()) {
                const q = search.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.desc.toLowerCase().includes(q) ||
                  p.key.toLowerCase().includes(q) ||
                  p.backendFeatureKey.toLowerCase().includes(q)
                );
              }
              return true;
            });

            if (visible.length === 0) return null;

            return (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <span>{group.label}</span>
                    <Badge variant="outline" className="text-[10px] font-normal py-0 h-4.5 text-muted-foreground">
                      {visible.length} permission{visible.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3.5 pb-4 pt-1">
                  {visible.map((p) => {
                    const cell = preset[p.key]!;
                    const isAlways = cell === "always";
                    const checked = enabled[p.key] ?? false;
                    const actionMeta = actionStyles[p.action] || actionStyles.view;
                    const ActionIcon = actionMeta.icon;

                    return (
                      <div
                        key={p.key}
                        className={cn(
                          "flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 p-3 rounded-lg border transition-colors",
                          checked
                            ? "bg-background/90 border-border"
                            : "bg-muted/20 border-dashed border-border/70 opacity-75 hover:opacity-100"
                        )}
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
                                Mandatory core capability for this staff role
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Switch
                              className="shrink-0 mt-0.5 data-[state=checked]:bg-emerald-600"
                              checked={checked}
                              onCheckedChange={(v) => onToggle(p.key, v)}
                            />
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Label className="text-sm font-semibold leading-snug cursor-pointer" onClick={() => !isAlways && onToggle(p.key, !checked)}>
                                {p.name}
                              </Label>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0 h-4 gap-1", actionMeta.className)}
                              >
                                <ActionIcon className="h-2.5 w-2.5" />
                                {actionMeta.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                            <div className="pt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/80 font-mono">
                              <span>key: <code className="text-foreground/90 font-semibold">{p.key}</code></span>
                              <span>•</span>
                              <span>backend: <code>{p.backendFeatureKey}</code></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                              tierStyles[p.tier]
                            )}
                          >
                            {tierLabel[p.tier]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </TooltipProvider>
  );
}
