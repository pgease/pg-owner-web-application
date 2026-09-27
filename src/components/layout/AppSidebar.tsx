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
  ChevronDown,
  LogOut,
  X,
  Wrench,
  LifeBuoy,
  Lock,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { usePermissions } from "@/context/PermissionContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavChild {
  title: string;
  url: string;
  permissionKey?: string;
  featureKey?: string;
  /** Route exists but the screen is a placeholder. Shown with a subtle "Soon" tag. */
  comingSoon?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: NavChild[];
  permissionKey?: string;
  featureKey?: string;
}

/**
 * Navigation mirrors the routes in App.tsx. Labels use plain PG-owner language.
 * Actions (e.g. "Add tenant") live on their pages, not in navigation.
 */
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permissionKey: "dashboard_access",
  },
  {
    title: "Property",
    url: "/my-pgs",
    icon: Building2,
    permissionKey: "room_view",
    children: [
      { title: "PG Details", url: "/my-pgs", permissionKey: "room_view" },
      { title: "Rooms & Beds", url: "/my-pgs/structure", permissionKey: "room_view" },
      { title: "Amenities", url: "/my-pgs/amenities", permissionKey: "room_view" },
      { title: "House Rules", url: "/my-pgs/restrictions", permissionKey: "room_view" },
      { title: "WiFi", url: "/my-pgs/wifi", permissionKey: "room_view", featureKey: "wifi_management" },
      { title: "Notice Board", url: "/my-pgs/notices", permissionKey: "room_view", featureKey: "digital_notice_board" },
      { title: "Bank Account", url: "/my-pgs/bank", permissionKey: "room_view" },
      { title: "Public Listing", url: "/post-pg", permissionKey: "room_view" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    permissionKey: "tenant_view",
    children: [
      { title: "All Tenants", url: "/tenants", permissionKey: "tenant_view" },
      { title: "Leads & Visits", url: "/leads", permissionKey: "tenant_view", featureKey: "lead_crm" },
      { title: "KYC & Agreements", url: "/tenants/kyc", permissionKey: "kyc_view", featureKey: "aadhaar_kyc" },
      { title: "Notice Period", url: "/tenants/notice-period", permissionKey: "tenant_view", featureKey: "notice_period_tracker" },
      { title: "Guest Requests", url: "/tenants/guests", permissionKey: "guest_log", featureKey: "nightout_guest_requests" },
    ],
  },
  {
    title: "Rent & Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    permissionKey: "account_view_dues",
    children: [
      { title: "Rent Collection", url: "/rent-payments", permissionKey: "account_view_dues" },
      { title: "Payment History", url: "/rent-payments/history", permissionKey: "account_view_dues" },
      { title: "Dues & Pending", url: "/rent-payments/dues", permissionKey: "account_view_dues" },
      { title: "Expenses", url: "/expenses", permissionKey: "expense_view", featureKey: "expense_tracking" },
      { title: "Refunds", url: "/refunds", permissionKey: "refund_add", comingSoon: true },
    ],
  },
  {
    title: "Operations",
    url: "/complaints",
    icon: Wrench,
    children: [
      { title: "Complaints", url: "/complaints", permissionKey: "complaint_view_all" },
      { title: "Group Chat", url: "/group-chat", permissionKey: "chat_view", featureKey: "pg_group_chat" },
      { title: "Food & Meals", url: "/food", permissionKey: "food_view_edit", featureKey: "food_menu_planner" },
      { title: "Night Out Passes", url: "/nightout", permissionKey: "nightout_view", featureKey: "nightout_guest_requests" },
      { title: "Eviction", url: "/eviction", permissionKey: "eviction_approve", comingSoon: true },
    ],
  },
  {
    title: "Staff",
    url: "/team",
    icon: UserCog,
    permissionKey: "team_view_members",
    featureKey: "staff_roles_permissions",
    children: [
      { title: "Team Members", url: "/team", permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
      { title: "Permissions", url: "/team/permissions-matrix", permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    permissionKey: "account_view_dues",
    featureKey: "advanced_reports",
  },
  {
    title: "Account",
    url: "/settings",
    icon: Settings,
    children: [
      { title: "Settings", url: "/settings" },
      { title: "Plans & Billing", url: "/plans" },
      { title: "Refer & Earn", url: "/referrals" },
      { title: "Feature Catalogue", url: "/feature-catalogue" },
      { title: "Activity Logs", url: "/activity-logs", featureKey: "audit_logs" },
    ],
  },
];

const HELP_ITEM: NavItem = { title: "Help & Support", url: "/support", icon: LifeBuoy };

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { isOwner, can } = usePermissions();
  const { isNavChildLocked: isFeatureNavLocked } = useFeatureAccess();

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  const isGroupActive = (item: NavItem) => {
    if (!item.children) return location.pathname === item.url;
    return item.children.some((c) => location.pathname === c.url);
  };

  /** A group is open if the user toggled it open, or (by default) it contains the active route. */
  const isGroupOpen = (item: NavItem) => openGroups[item.title] ?? isGroupActive(item);

  const toggleGroup = (item: NavItem) => {
    setOpenGroups((prev) => ({ ...prev, [item.title]: !isGroupOpen(item) }));
  };

  const isLockedByPermission = (permissionKey?: string) => {
    if (!permissionKey || isOwner) return false;
    return !can(permissionKey);
  };

  const isLockedByFeature = (featureKey?: string) => {
    if (!featureKey || !isOwner) return false;
    return isFeatureNavLocked(featureKey);
  };

  const goToPlans = () => {
    navigate("/plans");
    onMobileClose?.();
  };

  const renderChild = (child: NavChild) => {
    const permLocked = isLockedByPermission(child.permissionKey);
    const featLocked = isLockedByFeature(child.featureKey);

    if (featLocked) {
      return (
        <button
          type="button"
          onClick={goToPlans}
          className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title="Available on the Pro plan. Click to view plans."
        >
          <span className="truncate">{child.title}</span>
          <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (permLocked) {
      return (
        <div
          className="flex w-full cursor-not-allowed items-center justify-between gap-2 rounded-md px-3 py-1.5 text-[13px] text-sidebar-muted/70"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <span className="truncate">{child.title}</span>
          <Lock className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={child.url}
        end
        className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        activeClassName="bg-sidebar-primary/10 font-medium text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary"
        onClick={onMobileClose}
      >
        <span className="truncate">{child.title}</span>
        {child.comingSoon ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
        ) : null}
      </NavLink>
    );
  };

  const renderTopLevel = (item: NavItem) => {
    const active = isGroupActive(item);
    const hasChildren = Boolean(item.children?.length);
    const topLocked = isLockedByPermission(item.permissionKey) || isLockedByFeature(item.featureKey);
    const featLocked = isLockedByFeature(item.featureKey);
    const Icon = item.icon;

    // Collapsed rail: icon only, tooltip with the label.
    if (collapsed) {
      const target = featLocked ? "/plans" : item.url;
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={target}
              end={!hasChildren}
              aria-label={item.title}
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary",
              )}
              onClick={onMobileClose}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.title}
            {featLocked ? " · Pro" : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (hasChildren) {
      const open = isGroupOpen(item);
      return (
        <>
          <button
            type="button"
            onClick={() => toggleGroup(item)}
            aria-expanded={open}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "font-medium text-sidebar-primary",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-sidebar-primary" : "text-sidebar-muted")} aria-hidden />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-muted transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open ? (
            <ul className="ml-[21px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2.5">
              {item.children!.map((child) => (
                <li key={child.url}>{renderChild(child)}</li>
              ))}
            </ul>
          ) : null}
        </>
      );
    }

    if (featLocked) {
      return (
        <button
          type="button"
          onClick={goToPlans}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title="Available on the Pro plan. Click to view plans."
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="flex-1 text-left">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (topLocked) {
      return (
        <div
          className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-muted/70"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <Icon className="h-[18px] w-[18px] shrink-0 opacity-60" aria-hidden />
          <span className="flex-1 text-left">{item.title}</span>
          <Lock className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        activeClassName="bg-sidebar-primary/10 font-medium text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary"
        onClick={onMobileClose}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-sidebar-primary" : "text-sidebar-muted")} aria-hidden />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Brand */}
      <div className={cn("flex h-14 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <NavLink to="/dashboard" className="flex items-center gap-2.5" onClick={onMobileClose} aria-label="PG Ease dashboard">
          <img src={pgeaseLogo} alt="" className="h-8 w-8 rounded-md object-cover" />
          {!collapsed ? <span className="text-base font-semibold tracking-tight text-foreground">PG Ease</span> : null}
        </NavLink>
        {mobileOpen ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Primary navigation */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.title}>{renderTopLevel(item)}</li>
          ))}
        </ul>
      </nav>

      {/* Secondary: help + logout */}
      <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
        {renderTopLevel(HELP_ITEM)}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-destructive"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Log out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-sidebar-muted" aria-hidden />
            <span>Log out</span>
          </button>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden border-t border-sidebar-border p-2 md:block">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} aria-hidden />
        </button>
      </div>
    </>
  );
};

const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onMobileClose} aria-hidden />
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "md:w-[68px]" : "md:w-[248px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} mobileOpen={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,visibility] duration-200 md:hidden",
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
