import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  IndianRupee,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Wrench,
  Lock,
  UserCog,
  Sparkles,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import pgeaseBrandLogoWhite from "@/assets/pgease-full-brand-logo-white.png";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";
import { authStorage } from "@/api/http";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { usePermissions } from "@/context/PermissionContext";
import { useApp } from "@/context/AppContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";

interface NavChild {
  title: string;
  url: string;
  badge?: string;
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  section?: string;
  badge?: string;
  children?: NavChild[];
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
}

/**
 * Navigation mirrors the routes in App.tsx. Labels use plain PG-owner language.
 * Clean, operational structure with rich #008080 (Teal) SaaS theme.
 */
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "Overview",
    permissionKey: "dashboard_access",
  },
  {
    title: "Property",
    url: "/my-pgs",
    icon: Building2,
    section: "Management",
    permissionKey: "room_view",
    children: [
      { title: "PG Details", url: "/my-pgs", permissionKey: "room_view" },
      { title: "Rooms & Beds", url: "/my-pgs/structure", permissionKey: "room_view" },
      { title: "Amenities", url: "/my-pgs/amenities", permissionKey: "room_view" },
      { title: "House Rules", url: "/my-pgs/restrictions", permissionKey: "room_view" },
      { title: "WiFi", url: "/my-pgs/wifi", permissionKey: "room_view", featureKey: "wifi_management", badge: "Beta" },
      { title: "Notice Board", url: "/my-pgs/notices", permissionKey: "room_view", featureKey: "digital_notice_board" },
      { title: "Bank Account", url: "/my-pgs/bank", ownerOnly: true },
      { title: "Public Listing", url: "/post-pg", permissionKey: "room_view", badge: "Live" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    permissionKey: "tenant_view",
    children: [
      { title: "All Tenants", url: "/tenants", permissionKey: "tenant_view" },
      { title: "Leads & Visits", url: "/leads", permissionKey: "tenant_view", featureKey: "lead_crm", badge: "Beta" },
      { title: "KYC & Agreements", url: "/tenants/kyc", permissionKey: "kyc_view", featureKey: "aadhaar_kyc" },
      { title: "Notice Period", url: "/tenants/notice-period", permissionKey: "tenant_view", featureKey: "notice_period_tracker" },
      { title: "Guest Requests", url: "/tenants/guests", permissionKey: "guest_log", featureKey: "nightout_guest_requests" },
    ],
  },
  {
    title: "Rent & Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    section: "Finance & Ops",
    permissionKey: "account_view_dues",
    children: [
      { title: "Rent Collection", url: "/rent-payments", permissionKey: "account_view_dues" },
      { title: "Payment History", url: "/rent-payments/history", permissionKey: "account_view_dues" },
      { title: "Dues & Pending", url: "/rent-payments/dues", permissionKey: "account_view_dues" },
      { title: "Expenses", url: "/expenses", permissionKey: "expense_view", featureKey: "expense_tracking" },
    ],
  },
  {
    title: "Operations",
    url: "/complaints",
    icon: Wrench,
    permissionKey: "complaint_view_all",
    children: [
      { title: "Complaints", url: "/complaints", permissionKey: "complaint_view_all" },
      { title: "Group Chat", url: "/group-chat", permissionKey: "chat_view", featureKey: "pg_group_chat", badge: "New" },
      { title: "Food & Meals", url: "/food", permissionKey: "food_view_edit", featureKey: "food_menu_planner" },
      { title: "Night Out Passes", url: "/nightout", permissionKey: "nightout_view", featureKey: "nightout_guest_requests" },
    ],
  },
  {
    title: "Staff",
    url: "/team",
    icon: UserCog,
    ownerOnly: true,
    permissionKey: "team_view_members",
    featureKey: "staff_roles_permissions",
    children: [
      { title: "Team Members", url: "/team", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
      { title: "Permissions", url: "/team/permissions-matrix", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    section: "System",
    badge: "Pro",
    permissionKey: "account_view_dues",
    featureKey: "advanced_reports",
  },
  {
    title: "Account",
    url: "/settings",
    icon: Settings,
    children: [
      { title: "Settings", url: "/settings" },
      { title: "Plans & Billing", url: "/plans", ownerOnly: true },
      { title: "Refer & Earn", url: "/referrals", ownerOnly: true },
      { title: "Activity Logs", url: "/activity-logs", featureKey: "audit_logs" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarContent = ({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOwner, can } = usePermissions();
  const featureAccess = useFeatureAccess();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const subAccess = useSubscriptionAccess();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);

  const selectedPg = useMemo(
    () => (Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null),
    [properties, selectedPgId],
  );

  const handleAddProperty = () => {
    if (subAccess.isExpired) {
      setTrialExpiredOpen(true);
    } else {
      navigate("/my-pgs/structure");
      if (mobileOpen) onMobileClose();
    }
  };

  const owner = authStorage.getPropertyOwner();
  const ownerName = owner?.name && !owner.name.startsWith("user_") ? owner.name : "";
  const ownerPhone = owner?.mobileContactNumber || (owner as any)?.phone || "";

  const isFeatureNavLocked = (featureKey?: string) => {
    if (!featureKey) return false;
    if (typeof featureAccess?.isFeatureNavLocked === "function") {
      return featureAccess.isFeatureNavLocked(featureKey);
    }
    if (typeof featureAccess?.isNavChildLocked === "function") {
      return featureAccess.isNavChildLocked(featureKey);
    }
    return false;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const matches = item.children.some(
          (c) => location.pathname === c.url || (c.url !== "/" && location.pathname.startsWith(c.url)),
        );
        if (matches) initial[item.title] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (item: NavItem) => {
    const current = isGroupOpen(item);
    setOpenGroups((prev) => ({ ...prev, [item.title]: !current }));
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (location.pathname === item.url) return true;
    if (item.children) {
      return item.children.some(
        (c) => location.pathname === c.url || (c.url !== "/" && location.pathname.startsWith(c.url)),
      );
    }
    return item.url !== "/" && location.pathname.startsWith(item.url);
  };

  const isGroupOpen = (item: NavItem): boolean => {
    if (openGroups[item.title] !== undefined) return openGroups[item.title];
    return isGroupActive(item);
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login");
  };

  const isLockedByPermission = (permissionKey?: string) => {
    if (!permissionKey || isOwner) return false;
    return !can(permissionKey);
  };

  const isLockedByFeature = (featureKey?: string) => {
    if (!featureKey) return false;
    return isFeatureNavLocked(featureKey);
  };

  const goToPlans = () => {
    navigate("/plans");
    onMobileClose?.();
  };

  const renderChild = (child: NavChild) => {
    if (child.ownerOnly && !isOwner) {
      return null;
    }

    const permLocked = isLockedByPermission(child.permissionKey);
    const featLocked = isLockedByFeature(child.featureKey);

    if (featLocked) {
      if (!isOwner) {
        return (
          <div
            className="flex h-[36px] w-full cursor-not-allowed items-center justify-between gap-2 rounded-lg px-2.5 text-[14.5px] text-teal-200/40"
            title="This feature is not included in the PG's plan."
            aria-disabled
          >
            <span className="truncate">{child.title}</span>
            <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={goToPlans}
          className="flex h-[36px] w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[14.5px] text-teal-100/75 transition-colors hover:bg-white/10 hover:text-white"
          title="Available on the Pro plan. Click to view plans."
        >
          <span className="truncate">{child.title}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[10.5px] font-black text-amber-200">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (permLocked) {
      return (
        <div
          className="flex h-[36px] w-full cursor-not-allowed items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] text-teal-200/40"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <span className="truncate">{child.title}</span>
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={child.url}
        end
        className="flex h-[36px] items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] font-medium text-teal-100/80 transition-all duration-150 hover:bg-white/10 hover:text-white"
        activeClassName="bg-white/20 font-bold text-white shadow-xs border-l-2 border-white pl-2 hover:bg-white/25 hover:text-white"
        onClick={onMobileClose}
      >
        <span className="truncate">{child.title}</span>
        {child.badge ? (
          <span className="rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
            {child.badge}
          </span>
        ) : null}
      </NavLink>
    );
  };

  const renderTopLevel = (item: NavItem) => {
    if (item.ownerOnly && !isOwner) {
      return null;
    }

    const visibleChildren = item.children?.filter((c) => !(c.ownerOnly && !isOwner));
    const hasChildren = Boolean(visibleChildren?.length);
    const active = isGroupActive(item);
    const topLocked = isLockedByPermission(item.permissionKey) || isLockedByFeature(item.featureKey);
    const featLocked = isLockedByFeature(item.featureKey);
    const Icon = item.icon;

    // Collapsed rail: icon only, rich tooltip with label, expands on click
    if (collapsed) {
      const target = featLocked ? (isOwner ? "/plans" : item.url) : item.url;
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={item.title}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  setOpenGroups((prev) => ({ ...prev, [item.title]: true }));
                }
                onToggle();
                if (!hasChildren) {
                  navigate(target);
                }
              }}
              className={cn(
                "mx-auto flex h-[40px] w-[40px] items-center justify-center rounded-xl text-teal-100/75 transition-all duration-150 hover:bg-white/15 hover:text-white cursor-pointer",
                active && "bg-white text-[#006666] font-bold shadow-md shadow-teal-950/20 hover:bg-white hover:text-[#006666]",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs bg-slate-900 text-white border-slate-700 shadow-xl">
            {item.title}
            {featLocked && isOwner ? " · Pro" : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (hasChildren) {
      const open = isGroupOpen(item);
      return (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => toggleGroup(item)}
            aria-expanded={open}
            className={cn(
              "group flex h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-[16px] font-semibold transition-all duration-150",
              active
                ? "bg-white/15 text-white shadow-xs ring-1 ring-white/20"
                : "text-teal-100/85 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                active ? "text-white" : "text-teal-200/85 group-hover:text-white",
              )}
              aria-hidden
            />
            <span className="flex-1 text-left truncate">{item.title}</span>
            {item.badge ? (
              <span className="mr-1 rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
                {item.badge}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-teal-200/70 transition-transform duration-200",
                open && "rotate-180 text-white",
              )}
              aria-hidden
            />
          </button>
          {open ? (
            <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/20 pl-2">
              {visibleChildren!.map((child) => (
                <li key={child.url}>{renderChild(child)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (featLocked) {
      if (!isOwner) {
        return (
          <div
            className="flex h-[44px] w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 text-[16px] font-medium text-teal-200/40"
            title="This feature is not included in the PG's plan."
            aria-disabled
          >
            <Icon className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
            <span className="flex-1 text-left truncate">{item.title}</span>
            <Lock className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={goToPlans}
          className="flex h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-[16px] font-medium text-teal-100/75 transition-colors hover:bg-white/10 hover:text-white"
          title="Available on the Pro plan. Click to view plans."
        >
          <Icon className="h-5 w-5 shrink-0 text-teal-200/75" aria-hidden />
          <span className="flex-1 text-left truncate">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[10.5px] font-black text-amber-200">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (topLocked) {
      return (
        <div
          className="flex h-[44px] w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 text-[16px] font-medium text-teal-200/40"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <Icon className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
          <span className="flex-1 text-left truncate">{item.title}</span>
          <Lock className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className="group flex h-[44px] items-center gap-2.5 rounded-xl px-3 text-[16px] font-semibold text-teal-100/85 transition-all duration-150 hover:bg-white/10 hover:text-white"
        activeClassName="bg-white text-[#006666] font-bold shadow-md shadow-teal-950/20 hover:bg-white hover:text-[#006666]"
        onClick={onMobileClose}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            active ? "text-[#008080]" : "text-teal-200/85 group-hover:text-white",
          )}
          aria-hidden
        />
        <span className="truncate">{item.title}</span>
        {item.badge ? (
          <span className="ml-auto rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
            {item.badge}
          </span>
        ) : null}
      </NavLink>
    );
  };

  return (
    <>
      {/* Brand & Property Switcher Header (Rentok Style) */}
      <div
        className={cn(
          "flex h-[64px] items-center select-none",
          collapsed ? "justify-center px-2" : "justify-between px-3",
        )}
      >
        {!collapsed ? (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex flex-1 min-w-0 items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 text-white transition-all cursor-pointer text-left focus:outline-hidden"
                  aria-label="Switch property"
                >
                  <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center p-1 shadow-sm ring-2 ring-white/30 shrink-0 group-hover:scale-105 group-hover:ring-white/60 transition-all">
                    <img
                      src={pgeaseIconColor}
                      alt="PG Ease"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16.5px] font-extrabold text-white tracking-tight truncate leading-tight">
                        {selectedPg ? selectedPg.name : properties.length ? "Select a PG" : "My PG"}
                      </span>
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-teal-200 group-hover:text-white group-hover:bg-white/20 transition-all">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-[12px] text-teal-200/80 truncate font-medium leading-tight mt-0.5">
                      {selectedPg?.address || "PG Ease Portal"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50"
              >
                <div className="px-2.5 py-1.5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Switch Active PG
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a property to view rooms, dues, tenants & meals.
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                <div className="max-h-[260px] overflow-y-auto space-y-1 scrollbar-thin">
                  {properties.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No properties added yet
                    </div>
                  ) : (
                    properties.map((pg) => {
                      const isSelected = selectedPgId === pg.id;
                      return (
                        <DropdownMenuItem
                          key={pg.id}
                          onClick={() => {
                            setSelectedPgId(pg.id);
                            if (mobileOpen) onMobileClose();
                          }}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-all",
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-950/40 text-[#008080] dark:text-teal-300 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                          )}
                        >
                          <div
                            className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-[#008080] text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                            )}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate leading-tight font-bold">{pg.name}</p>
                            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                              {pg.address || "Configured property"}
                            </p>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-[#008080] shrink-0 font-bold" />
                          ) : null}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                <DropdownMenuItem
                  onClick={handleAddProperty}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors"
                >
                  <div className="h-6 w-6 rounded-md bg-[#008080]/15 text-[#008080] flex items-center justify-center shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span>Add New Property</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {mobileOpen ? (
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-lg p-1.5 text-teal-200 hover:bg-white/10 hover:text-white md:hidden transition-colors ml-1 shrink-0"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center p-1 shadow-sm ring-2 ring-white/30 hover:scale-105 hover:ring-white/60 transition-all cursor-pointer focus:outline-hidden"
                title={selectedPg?.name || "Switch PG"}
              >
                <img
                  src={pgeaseIconColor}
                  alt="PG Ease"
                  className="h-full w-full object-contain"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={12}
              className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50"
            >
              <div className="px-2.5 py-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Switch Active PG
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a property to view rooms, dues, tenants & meals.
                </p>
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="max-h-[260px] overflow-y-auto space-y-1 scrollbar-thin">
                {properties.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No properties added yet
                  </div>
                ) : (
                  properties.map((pg) => {
                    const isSelected = selectedPgId === pg.id;
                    return (
                      <DropdownMenuItem
                        key={pg.id}
                        onClick={() => {
                          setSelectedPgId(pg.id);
                          if (mobileOpen) onMobileClose();
                        }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-all",
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-950/40 text-[#008080] dark:text-teal-300 font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                      >
                        <div
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-[#008080] text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                          )}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate leading-tight font-bold">{pg.name}</p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                            {pg.address || "Configured property"}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-[#008080] shrink-0 font-bold" />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <DropdownMenuItem
                onClick={handleAddProperty}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-[#008080]/15 text-[#008080] flex items-center justify-center shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span>Add New Property</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Primary Navigation */}
      <nav
        aria-label="Main"
        className="flex-1 overflow-y-auto px-2 py-2.5 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-teal-800/40 hover:[&::-webkit-scrollbar-thumb]:bg-teal-700/60 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {NAV_ITEMS.map((item, index) => {
          const showSection = !collapsed && item.section;
          return (
            <div key={item.title}>
              {showSection ? (
                <div
                  className={cn(
                    "px-3 pb-1.5 text-[11.5px] font-black uppercase tracking-wider text-teal-200/65 select-none",
                    index > 0 ? "pt-4" : "pt-2",
                  )}
                >
                  {item.section}
                </div>
              ) : null}
              {renderTopLevel(item)}
            </div>
          );
        })}
      </nav>

      {/* User / Owner Profile & Logout Bar */}
      <div className="border-t border-teal-700/40 bg-teal-900/30 p-2.5 space-y-1.5 backdrop-blur-xs">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-teal-400/20 border border-teal-300/30 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {ownerName ? ownerName.charAt(0).toUpperCase() : "O"}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-white truncate leading-tight">
                  {ownerName || "PG Owner"}
                </p>
                <p className="text-[12px] text-teal-200/80 truncate leading-tight mt-0.5">
                  {ownerPhone || (isOwner ? "Owner Admin" : "Staff Member")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-teal-200 hover:text-rose-200 hover:bg-rose-500/25 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-teal-200 transition-colors hover:bg-rose-500/25 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs bg-slate-900 text-white border-slate-700 shadow-xl">
              Log out ({ownerName || "PG Owner"})
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Collapse Toggle (Desktop) */}
      <div className="hidden border-t border-teal-700/30 p-2 md:block bg-teal-950/20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/15 text-teal-200/90 hover:text-white transition-all cursor-pointer border border-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="text-[12px] font-semibold">Collapse</span>
            </>
          )}
        </button>
      </div>

      <TrialExpiredGateModal open={trialExpiredOpen} onOpenChange={setTrialExpiredOpen} />
    </>
  );
};

const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,30,30,0.65)] backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      ) : null}

      {/* Desktop Sidebar: 260px or 64px, seamless deep teal gradient */}
      <aside
        onClick={() => {
          if (collapsed) {
            onToggle();
          }
        }}
        title={collapsed ? "Click to expand sidebar" : undefined}
        className={cn(
          "hidden md:flex h-screen shrink-0 flex-col bg-gradient-to-b from-[#005555] via-[#004b4b] to-[#003d3d] text-white transition-[width] duration-200 shadow-xl select-none z-30",
          collapsed ? "w-[64px] cursor-pointer hover:brightness-105" : "w-[260px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} mobileOpen={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/10 bg-gradient-to-b from-[#005555] via-[#004b4b] to-[#003d3d] text-white transition-[transform,visibility] duration-200 md:hidden shadow-2xl select-none",
          mobileOpen ? "translate-x-0 visible" : "-translate-x-full invisible",
        )}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />
      </aside>
    </>
  );
};

export default AppSidebar;
