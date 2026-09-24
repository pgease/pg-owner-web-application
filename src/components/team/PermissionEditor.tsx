import React, { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Home,
  IndianRupee,
  Wrench,
  Utensils,
  ClipboardCheck,
  MessageSquare,
  Smartphone,
  Lock,
  Eye,
  Edit3,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { PresetCell } from "@/constants/rolePresets";
import { cn } from "@/lib/utils";

interface SimplePermissionItem {
  key: string;
  title: string;
  description: string;
  whenOn: string;
  whenOff: string;
  isImportant?: boolean;
  type: "view" | "edit";
}

interface SimplePermissionCategory {
  id: string;
  title: string;
  icon: any;
  colorClass: string;
  description: string;
  items: SimplePermissionItem[];
}

const SIMPLE_CATEGORIES: SimplePermissionCategory[] = [
  {
    id: "money",
    title: "Rent, Dues & Money",
    icon: IndianRupee,
    colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200",
    description: "Control whether this staff member can see financial transactions or collect money.",
    items: [
      {
        key: "account_view_dues",
        title: "See Rent Amounts & Pending Dues",
        description: "View who has paid rent, who has pending balance, and total collection.",
        whenOn: "Staff can see all rent dues and payment history",
        whenOff: "RENT IS HIDDEN: Staff cannot see any rent amounts or dues",
        isImportant: true,
        type: "view",
      },
      {
        key: "account_record_payment",
        title: "Collect & Record Payments",
        description: "Mark cash or offline UPI payments as received and issue receipts.",
        whenOn: "Staff can collect money and issue payment receipts",
        whenOff: "Staff cannot record or accept payments",
        type: "edit",
      },
      {
        key: "account_send_reminders",
        title: "Send WhatsApp Payment Reminders",
        description: "Send 1-click WhatsApp payment reminders to tenants with pending dues.",
        whenOn: "Staff can send payment reminders to tenants",
        whenOff: "Reminders can only be sent by owner/manager",
        type: "edit",
      },
      {
        key: "expense_view",
        title: "View & Log Daily Expenses",
        description: "Record petty cash expenses for groceries, plumbing, electrical, or repairs.",
        whenOn: "Staff can log and view property expenses",
        whenOff: "Expense ledger is hidden from this staff member",
        type: "edit",
      },
    ],
  },
  {
    id: "tenants",
    title: "Tenants Management",
    icon: Users,
    colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200",
    description: "Control visibility of tenant profiles and who can edit their details.",
    items: [
      {
        key: "tenant_view",
        title: "View Tenant Roster & Rooms",
        description: "See tenant names, photos, phone numbers, and which room they stay in.",
        whenOn: "Staff can see the tenant list (needed for cleaners & caretakers)",
        whenOff: "Tenant list is hidden",
        isImportant: true,
        type: "view",
      },
      {
        key: "tenant_edit_basic",
        title: "Edit Tenant Details",
        description: "Update tenant name, contact numbers, email, or emergency contact info.",
        whenOn: "Staff can update tenant contact details",
        whenOff: "READ-ONLY: Staff can only look at details, cannot change them",
        isImportant: true,
        type: "edit",
      },
      {
        key: "tenant_add",
        title: "Add / Check-In New Tenants",
        description: "Onboard new walk-in tenants and assign them to a room.",
        whenOn: "Staff can register and check-in new tenants",
        whenOff: "Staff cannot add new tenants",
        type: "edit",
      },
      {
        key: "tenant_change_room",
        title: "Shift Rooms & Bed Allocation",
        description: "Move an existing tenant to another vacant room or floor.",
        whenOn: "Staff can shift tenants to different rooms",
        whenOff: "Room shifting is restricted",
        type: "edit",
      },
    ],
  },
  {
    id: "rooms",
    title: "Rooms & Floors",
    icon: Home,
    colorClass: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200",
    description: "Access to room layout, floor plans, and vacant bed inventory.",
    items: [
      {
        key: "room_view",
        title: "View Rooms & Bed Occupancy",
        description: "See all floors, room numbers, bed occupancy, and vacant slots.",
        whenOn: "Staff can view floor plan and check vacant beds",
        whenOff: "Room layout is hidden",
        type: "view",
      },
      {
        key: "room_edit",
        title: "Add & Edit Rooms",
        description: "Create new rooms, modify monthly rent rate, or update room amenities.",
        whenOn: "Staff can create or modify room pricing and amenities",
        whenOff: "Room editing is locked (Owner/Manager only)",
        type: "edit",
      },
    ],
  },
  {
    id: "complaints",
    title: "Complaints & Maintenance",
    icon: Wrench,
    colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200",
    description: "Manage tenant issues like WiFi, plumbing, cleaning, and electrical repairs.",
    items: [
      {
        key: "complaint_view_all",
        title: "View All Tenant Complaints",
        description: "See all maintenance tickets reported by tenants across the property.",
        whenOn: "Staff can see and monitor all complaints",
        whenOff: "Staff only sees complaints assigned directly to them",
        type: "view",
      },
      {
        key: "complaint_edit_assign",
        title: "Resolve & Update Complaint Status",
        description: "Mark complaints In Progress, assign repair workers, or mark Resolved.",
        whenOn: "Staff can update status and close tickets",
        whenOff: "Staff cannot resolve tickets",
        type: "edit",
      },
      {
        key: "complaint_raise",
        title: "Log Complaint for Tenant",
        description: "Raise a maintenance ticket when a tenant reports an issue in person.",
        whenOn: "Staff can log new complaints anytime",
        whenOff: "Staff cannot raise complaints",
        type: "edit",
      },
    ],
  },
  {
    id: "attendance_curfew",
    title: "Attendance & Gate Curfew",
    icon: ClipboardCheck,
    colorClass: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200",
    description: "Daily tenant check-in, night out passes, and visitor gate logs.",
    items: [
      {
        key: "attend_mark",
        title: "Mark Daily Tenant Attendance",
        description: "Record tenant presence or absence during morning/evening roll call.",
        whenOn: "Staff can take daily attendance",
        whenOff: "Attendance screen is disabled",
        type: "edit",
      },
      {
        key: "nightout_approve",
        title: "Approve Night Out & Curfew Passes",
        description: "Grant or reject tenant late-night entry or overnight stay requests.",
        whenOn: "Staff can approve or deny night out passes",
        whenOff: "Night out approval is restricted to owner",
        type: "edit",
      },
      {
        key: "guest_log",
        title: "Log Visitors at Gate",
        description: "Record visitor names, phone numbers, and in/out timestamps.",
        whenOn: "Staff can record gate entries",
        whenOff: "Gate entry log is hidden",
        type: "edit",
      },
    ],
  },
  {
    id: "food_chat",
    title: "Food Menu & Group Chat",
    icon: Utensils,
    colorClass: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200",
    description: "Daily meal schedule and communication in the PG group chat.",
    items: [
      {
        key: "food_view",
        title: "View & Edit Food Menu",
        description: "View daily breakfast, lunch, and dinner menus and update timings.",
        whenOn: "Staff can view and update meal schedules",
        whenOff: "Food menu management is hidden",
        type: "view",
      },
      {
        key: "chat_send",
        title: "Post Messages in PG Group Chat",
        description: "Send announcements and reply to tenant messages in the PG group.",
        whenOn: "Staff can chat and send announcements",
        whenOff: "Staff can only read messages or chat is hidden",
        type: "edit",
      },
    ],
  },
];

export function PermissionEditor({
  preset,
  enabled,
  onToggle,
}: {
  preset: Record<string, PresetCell>;
  enabled: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Helpful Explainer Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="space-y-1 text-xs">
          <p className="font-bold text-foreground text-sm">
            Simple Permission Controls for Staff
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Every switch below shows exactly what the staff member will be able to do. For example, turning off <strong>"See Rent Amounts & Pending Dues"</strong> completely hides all money and transaction screens from this staff member.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        {SIMPLE_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;

          return (
            <Card key={category.id} className="border-border/60 shadow-2xs overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border/50">
                <div className={cn("p-2 rounded-lg border shrink-0", category.colorClass)}>
                  <CategoryIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{category.title}</h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              </div>

              {/* Items List */}
              <CardContent className="p-0 divide-y divide-border/40">
                {category.items.map((item) => {
                  const cell = preset[item.key];
                  const isAlways = cell === "always";
                  const isChecked = enabled[item.key] ?? false;

                  return (
                    <div
                      key={item.key}
                      className={cn(
                        "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
                        isChecked ? "bg-background" : "bg-muted/10 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label
                            className="text-sm font-bold text-foreground cursor-pointer"
                            onClick={() => !isAlways && onToggle(item.key, !isChecked)}
                          >
                            {item.title}
                          </Label>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0 h-4.5 gap-1",
                              item.type === "view"
                                ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            )}
                          >
                            {item.type === "view" ? (
                              <>
                                <Eye className="h-2.5 w-2.5" /> VIEW
                              </>
                            ) : (
                              <>
                                <Edit3 className="h-2.5 w-2.5" /> EDIT / ACTION
                              </>
                            )}
                          </Badge>

                          {item.isImportant && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-bold">
                              Key Setting
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-normal">
                          {item.description}
                        </p>

                        {/* Status preview (What happens if ON vs OFF) */}
                        <div className="pt-1 flex items-center gap-2 text-xs">
                          {isChecked ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md px-2 py-0.5 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" />
                              {item.whenOn}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium bg-muted/60 border border-border/60 rounded-md px-2 py-0.5 text-[11px]">
                              <EyeOff className="h-3 w-3 text-rose-500" />
                              {item.whenOff}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Switch Toggle */}
                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        {isAlways ? (
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold">
                            <Lock className="h-3 w-3" /> Required for Role
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {isChecked ? "Allowed" : "Blocked"}
                            </span>
                            <Switch
                              checked={isChecked}
                              onCheckedChange={(val) => onToggle(item.key, val)}
                              className="data-[state=checked]:bg-emerald-600 scale-110"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
