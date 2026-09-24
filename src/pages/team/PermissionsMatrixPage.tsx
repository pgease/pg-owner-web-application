import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Zap,
  Lock,
  Unlock,
  AlertCircle,
  IndianRupee,
  Home,
  Wrench,
  Utensils,
  ClipboardCheck,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { usePermissions } from "@/context/PermissionContext";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface EverydayAction {
  id: string;
  category: string;
  question: string;
  explanation: string;
  type: "view" | "edit";
  planRequired: "Free" | "Lite (₹29)" | "Pro (₹49)";
  manager: boolean;
  caretaker: boolean;
  cleaner: boolean;
  warden: boolean;
}

const EVERYDAY_ACTIONS: EverydayAction[] = [
  // Money & Rent
  {
    id: "see_rent_dues",
    category: "Rent & Money",
    question: "Can see who paid rent and pending dues?",
    explanation: "If turned OFF, all rent amounts, tenant dues, and payment screens are completely HIDDEN from staff.",
    type: "view",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: false, // User requested: hide rent from caretaker
    cleaner: false,   // User requested: hide rent from cleaner
    warden: false,
  },
  {
    id: "collect_payments",
    category: "Rent & Money",
    question: "Can collect and record rent payments?",
    explanation: "Allows staff to collect cash or offline UPI and issue a receipt voucher to tenant.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: false,
    cleaner: false,
    warden: false,
  },
  {
    id: "send_reminders",
    category: "Rent & Money",
    question: "Can send WhatsApp rent reminders?",
    explanation: "Send 1-click payment reminder alerts to tenants who have overdue balances.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: false,
    cleaner: false,
    warden: false,
  },
  {
    id: "log_expenses",
    category: "Rent & Money",
    question: "Can log daily property expenses?",
    explanation: "Record petty cash payments for plumbing, electricals, groceries, or cleaning supplies.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: false,
    cleaner: false,
    warden: false,
  },

  // Tenants
  {
    id: "view_tenants",
    category: "Tenants",
    question: "Can see list of tenants and their rooms?",
    explanation: "Allows staff to see tenant names, phone numbers, and room allocation (needed for housekeeping & maintenance).",
    type: "view",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: true, // Cleaner can see rooms & occupants
    warden: true,
  },
  {
    id: "edit_tenant_details",
    category: "Tenants",
    question: "Can edit tenant details and phone numbers?",
    explanation: "Update profile, emergency contact, or address. Cleaners are blocked to prevent accidental changes.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false, // User requested: Cleaner CANNOT edit tenant details
    warden: false,
  },
  {
    id: "add_tenant",
    category: "Tenants",
    question: "Can register and check-in new tenants?",
    explanation: "Onboard walk-in tenants and assign them to vacant beds.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: false,
  },
  {
    id: "change_room",
    category: "Tenants",
    question: "Can shift tenants to another room?",
    explanation: "Move tenants to different floors or vacant rooms.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: false,
  },

  // Rooms
  {
    id: "view_rooms",
    category: "Rooms",
    question: "Can view rooms and bed occupancy?",
    explanation: "See room layout, vacant beds, and who is staying where.",
    type: "view",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: true, // Cleaner needs to see rooms to clean
    warden: true,
  },
  {
    id: "edit_rooms",
    category: "Rooms",
    question: "Can add new rooms or change room prices?",
    explanation: "Create new rooms, change room capacity, or modify monthly rent pricing.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: false,
  },

  // Complaints
  {
    id: "view_all_complaints",
    category: "Complaints",
    question: "Can see all tenant complaints?",
    explanation: "View all plumbing, electrical, WiFi, and cleaning complaints from all tenants.",
    type: "view",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: true,
  },
  {
    id: "resolve_complaints",
    category: "Complaints",
    question: "Can update status and resolve complaints?",
    explanation: "Mark complaints as In Progress or Resolved after repairs are completed.",
    type: "edit",
    planRequired: "Lite (₹29)",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: false,
  },
  {
    id: "raise_complaint",
    category: "Complaints",
    question: "Can log new complaints for tenants?",
    explanation: "Raise maintenance tickets when an issue is spotted during daily rounds.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: true,
    warden: true,
  },

  // Attendance & Gate
  {
    id: "mark_attendance",
    category: "Attendance & Gate",
    question: "Can take daily tenant attendance?",
    explanation: "Mark daily tenant presence or absence during morning/evening roll call.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: true,
  },
  {
    id: "approve_nightout",
    category: "Attendance & Gate",
    question: "Can approve late curfew / night out passes?",
    explanation: "Grant or decline tenant requests to stay out late or overnight.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: true,
  },
  {
    id: "gate_visitor_log",
    category: "Attendance & Gate",
    question: "Can log visitors at the gate?",
    explanation: "Record entry and exit of guests and delivery personnel.",
    type: "edit",
    planRequired: "Free",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: true,
  },

  // Group Chat
  {
    id: "group_chat",
    category: "PG Group Chat",
    question: "Can send messages in PG Group Chat?",
    explanation: "Post official announcements and chat with tenants in the private verified PG group.",
    type: "edit",
    planRequired: "Pro (₹49)",
    manager: true,
    caretaker: true,
    cleaner: false,
    warden: true,
  },
];

export default function PermissionsMatrixPage() {
  const { currentPlan, isTrial, trialDaysRemaining } = useSubscriptionAccess();
  const { isOwner } = usePermissions();
  const [activeTab, setActiveTab] = useState<"roles" | "plans" | "simple_explainer">("roles");
  const [selectedRoleForTester, setSelectedRoleForTester] = useState<"cleaner" | "caretaker" | "manager" | "warden">("cleaner");

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-fade-in">
      <PageHeader
        title="Staff Roles & Plan Access"
        description="Clear, simple guide to what each staff member can see, what is hidden, and what features your plan includes."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/team">
                <Users className="h-4 w-4 mr-1.5" /> Back to Staff Team
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/team/add-staff">
                <Shield className="h-4 w-4 mr-1.5" /> Add New Staff
              </Link>
            </Button>
          </div>
        }
      />

      {/* Clear Top Summary Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/5 via-background to-emerald-500/5 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Your Current Plan:{" "}
                  <span className="text-primary font-black uppercase">
                    {isTrial ? "PRO (45-Day Free Trial)" : currentPlan || "LITE PLAN"}
                  </span>
                </h3>
                <Badge variant="outline" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                  {isTrial ? `${trialDaysRemaining} Days Remaining` : "Active"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All staff permissions and features below are active for your property. You have complete control to turn any feature ON or OFF for any staff member.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="h-8 text-xs shrink-0 self-start sm:self-center" asChild>
            <Link to="/plans">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1.5" /> View Pricing Plans
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-5">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="roles" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Staff Roles Guide (Cleaner, Caretaker, Manager)
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Plan & Pricing Breakdown (Free vs Lite vs Pro)
          </TabsTrigger>
          <TabsTrigger value="simple_explainer" className="text-xs gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> What Happens When a Feature is OFF?
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Staff Roles Matrix in Plain English */}
        <TabsContent value="roles" className="space-y-5">
          {/* Quick Summary Cards of the 3 key roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <Card className="border-border/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs border-l-4 border-l-emerald-500">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🧹</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                    Housekeeping
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">Cleaner</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ✓ Can see rooms & occupants to know where to clean.<br />
                  ✗ <strong>CANNOT edit</strong> any tenant details.<br />
                  ✗ <strong>ALL RENT & MONEY IS HIDDEN</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs border-l-4 border-l-amber-500">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">🛡️</span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                    Ground Operations
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">Caretaker</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ✓ Manages check-ins, rooms, complaints & attendance.<br />
                  ✓ Can update basic phone/emergency contacts.<br />
                  ✗ <strong>RENT DUES & COLLECTIONS HIDDEN BY DEFAULT</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-2xs border-l-4 border-l-indigo-500">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">👔</span>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-bold">
                    Full Operations
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">Manager</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ✓ Full administrative authority.<br />
                  ✓ Can view & edit tenants, rooms, complaints.<br />
                  ✓ Can record payments & view complete rent ledger.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Simple Table */}
          <Card className="border-border/60 shadow-2xs overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 py-3.5 px-4">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Who Can Do What? (Daily Operations Checklist)</span>
                <span className="text-xs text-muted-foreground font-normal">
                  All presets can be customized per staff member in Team settings
                </span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table variant="compact">
                <TableHeader className="bg-muted/40 text-xs">
                  <TableRow>
                    <TableHead className="w-[320px]">Daily Action</TableHead>
                    <TableHead className="w-[110px]">Type</TableHead>
                    <TableHead className="text-center font-bold text-indigo-700 bg-indigo-50/30">Manager</TableHead>
                    <TableHead className="text-center font-bold text-amber-700 bg-amber-50/30">Caretaker</TableHead>
                    <TableHead className="text-center font-bold text-emerald-700 bg-emerald-50/30">Cleaner</TableHead>
                    <TableHead className="text-center font-bold text-purple-700 bg-purple-50/30">Warden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border/40">
                  {EVERYDAY_ACTIONS.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-xs sm:text-sm">{item.question}</p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">{item.explanation}</p>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            item.type === "view"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {item.type === "view" ? "View Only" : "Edit / Action"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center align-middle bg-indigo-50/10">
                        {item.manager ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 bg-muted/40 rounded px-2 py-0.5 border border-border/40">
                            <XCircle className="h-3 w-3 text-rose-500" /> No
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center align-middle bg-amber-50/10">
                        {item.caretaker ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 rounded px-2 py-0.5 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-500" /> Hidden
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center align-middle bg-emerald-50/10">
                        {item.cleaner ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 bg-muted/40 rounded px-2 py-0.5 border border-border/40">
                            <XCircle className="h-3 w-3 text-muted-foreground/40" /> Locked
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center align-middle bg-purple-50/10">
                        {item.warden ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 bg-muted/40 rounded px-2 py-0.5 border border-border/40">
                            <XCircle className="h-3 w-3 text-muted-foreground/40" /> No
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Plan & Pricing in Simple Words */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Plan */}
            <Card className="border-border/70 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold text-muted-foreground">
                    FREE PLAN
                  </Badge>
                  <span className="text-sm font-black text-foreground">₹0 / month</span>
                </div>
                <CardTitle className="text-base font-bold pt-1">Basic Management</CardTitle>
                <CardDescription className="text-xs">
                  Everything needed to run a small PG manually without automated reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                <div className="space-y-1.5 pt-1">
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Room Layout & Bed Slots
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Tenant Profiles & Contacts
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Maintenance Complaints Desk
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Daily Tenant Attendance
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Mobile App Login for Staff
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-muted-foreground">
                  Rent dues tracking and WhatsApp reminders are locked on Free plan.
                </div>
              </CardContent>
            </Card>

            {/* Lite Plan */}
            <Card className="border-amber-300 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs ring-1 ring-amber-400/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500 text-white text-xs font-bold">
                    LITE PLAN (RECOMMENDED)
                  </Badge>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-400">₹29 / bed / mo</span>
                </div>
                <CardTitle className="text-base font-bold pt-1">Rent & Staff Delegation</CardTitle>
                <CardDescription className="text-xs">
                  Unlock full rent tracking, WhatsApp reminders, and custom staff roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                <div className="space-y-1.5 pt-1">
                  <p className="flex items-center gap-2 text-foreground font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Everything in Free Plan
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Rent Dues & Received Payments
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> WhatsApp Payment Reminders
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Hide Money from Caretakers/Cleaners
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Property Expense Tracking
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-foreground font-semibold">
                  ✓ Ideal for managing properties with multiple staff members.
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-purple-300 bg-purple-50/20 dark:bg-purple-950/10 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-600 text-white text-xs font-bold">
                    PRO PLAN (FULL POWER)
                  </Badge>
                  <span className="text-sm font-black text-purple-700 dark:text-purple-400">₹49 / bed / mo</span>
                </div>
                <CardTitle className="text-base font-bold pt-1">Automation & PG Group Chat</CardTitle>
                <CardDescription className="text-xs">
                  Private verified PG chat, payment gateway auto-collection, and PG website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                <div className="space-y-1.5 pt-1">
                  <p className="flex items-center gap-2 text-foreground font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Everything in Lite Plan
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" /> Private PG Group Chat (Verified)
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" /> Automated Payment Gateway
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" /> Dedicated Public PG Website
                  </p>
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" /> Permanent Record Deletion / Purge
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                  ✓ Included in your 45-Day Free Trial!
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Simple Explainer (What happens when OFF?) */}
        <TabsContent value="simple_explainer" className="space-y-4">
          <Card className="border-border/60 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold">
                Clear Answers to Common Questions
              </CardTitle>
              <CardDescription className="text-xs">
                How turning permissions ON or OFF affects what your staff sees on their screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-border/60 space-y-1 bg-muted/20">
                <h5 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  How do I prevent my caretaker or cleaner from seeing how much rent I receive?
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  Simply open <strong>Team</strong> → Click <strong>Edit Permissions</strong> next to the caretaker or cleaner → Turn off <strong>"See Rent Amounts & Pending Dues"</strong>. Once turned off, the Money and Rent tabs are completely removed from their screen. They will never see who has paid, who owes money, or any bank transactions.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/60 space-y-1 bg-muted/20">
                <h5 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Can a cleaner see which tenant lives in Room 204 without being able to edit anything?
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! Keep <strong>"View Tenant Roster & Rooms"</strong> turned ON so they know who lives where, and keep <strong>"Edit Tenant Details"</strong> turned OFF. The cleaner can view room numbers and tenant names, but all Edit buttons and delete options will be disabled.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/60 space-y-1 bg-muted/20">
                <h5 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  What is the difference between View and Edit?
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>VIEW ONLY:</strong> The staff member can read information (e.g. read complaint description, see tenant contact number, view room rate), but cannot alter any data.<br />
                  <strong>EDIT / ACTION:</strong> The staff member can press buttons to make changes (e.g. resolve complaint, update phone number, shift room, mark payment collected).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
