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
 * Clean, operational structure with no "Coming soon" clutter in the primary nav.
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
  const { isOwner, can } = usePermissions();
  const featureAccess = useFeatureAccess();

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
    setOpenGroups((prev) => ({ ...prev, [item.title]: !prev[item.title] }));
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
          className="flex h-[32px] w-full items-center justify-between gap-2 rounded-[4px] px-2.5 text-left text-[13px] text-[#6B7785] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]"
          title="Available on the Pro plan. Click to view plans."
        >
          <span className="truncate">{child.title}</span>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#FFF7E6] px-1 py-0.2 text-[10px] font-semibold text-[#A15C07]">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (permLocked) {
      return (
        <div
          className="flex h-[32px] w-full cursor-not-allowed items-center justify-between gap-2 rounded-[4px] px-2.5 text-[13px] text-[#98A2AE]"
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
        className="flex h-[32px] items-center justify-between gap-2 rounded-[4px] px-2.5 text-[13px] text-[#556270] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]"
        activeClassName="bg-[#E8F4F4] font-medium text-[#006B6B] border-l-2 border-[#008080] hover:bg-[#E8F4F4] hover:text-[#006B6B]"
        onClick={onMobileClose}
      >
        <span className="truncate">{child.title}</span>
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
                "mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-[4px] text-[#556270] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]",
                active && "bg-[#E8F4F4] text-[#006B6B] hover:bg-[#E8F4F4] hover:text-[#006B6B]",
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
              "flex h-[36px] w-full items-center gap-2.5 rounded-[4px] px-3 text-[14px] leading-[20px] font-medium text-[#3D4A57] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]",
              active && "text-[#006B6B]",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#008080]" : "text-[#6B7785]")} aria-hidden />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#6B7785] transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open ? (
            <ul className="ml-[18px] mt-0.5 space-y-0.5 border-l border-[#E2E6EA] pl-2">
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
          className="flex h-[36px] w-full items-center gap-2.5 rounded-[4px] px-3 text-[14px] leading-[20px] font-medium text-[#6B7785] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]"
          title="Available on the Pro plan. Click to view plans."
        >
          <Icon className="h-[18px] w-[18px] shrink-0 text-[#6B7785]" aria-hidden />
          <span className="flex-1 text-left">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#FFF7E6] px-1.5 py-0.2 text-[10px] font-semibold text-[#A15C07]">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (topLocked) {
      return (
        <div
          className="flex h-[36px] w-full cursor-not-allowed items-center gap-2.5 rounded-[4px] px-3 text-[14px] leading-[20px] font-medium text-[#98A2AE]"
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
        className="flex h-[36px] items-center gap-2.5 rounded-[4px] px-3 text-[14px] leading-[20px] font-medium text-[#3D4A57] transition-colors hover:bg-[#F6F7F8] hover:text-[#18212B]"
        activeClassName="bg-[#E8F4F4] text-[#006B6B] border-l-2 border-[#008080] hover:bg-[#E8F4F4] hover:text-[#006B6B]"
        onClick={onMobileClose}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#008080]" : "text-[#6B7785]")} aria-hidden />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Brand Header */}
      <div className={cn("flex h-[56px] items-center border-b border-[#E2E6EA]", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <NavLink to="/dashboard" className="flex items-center gap-2.5" onClick={onMobileClose} aria-label="PG Ease dashboard">
          <img src={pgeaseLogo} alt="" className="h-7 w-7 rounded-[4px] object-cover" />
          {!collapsed ? <span className="text-[16px] font-semibold tracking-tight text-[#18212B]">PG Ease</span> : null}
        </NavLink>
        {mobileOpen ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-[4px] p-1.5 text-[#6B7785] hover:bg-[#EEF1F3] hover:text-[#18212B] md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.title}>{renderTopLevel(item)}</li>
          ))}
        </ul>
      </nav>

      {/* Secondary: Help + Logout */}
      <div className="space-y-1 border-t border-[#E2E6EA] px-2 py-2">
        {renderTopLevel(HELP_ITEM)}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-[4px] text-[#6B7785] transition-colors hover:bg-[#FEF1F0] hover:text-[#B42318]"
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
            className="flex h-[36px] w-full items-center gap-2.5 rounded-[4px] px-3 text-[14px] leading-[20px] font-medium text-[#556270] transition-colors hover:bg-[#FEF1F0] hover:text-[#B42318]"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-[#6B7785]" aria-hidden />
            <span>Log out</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle (Desktop) */}
      <div className="hidden border-t border-[#E2E6EA] p-2 md:block">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-[32px] w-full items-center justify-center rounded-[4px] text-[#6B7785] transition-colors hover:bg-[#EEF1F3] hover:text-[#18212B]"
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
        <div className="fixed inset-0 z-40 bg-[rgba(16,24,40,0.40)] md:hidden" onClick={onMobileClose} aria-hidden />
      ) : null}

      {/* Desktop Sidebar: 240px or 64px, full viewport height, white surface, 1px right border */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#E2E6EA] bg-white text-[#18212B] transition-[width] duration-200 md:flex",
          collapsed ? "md:w-[64px]" : "md:w-[240px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} mobileOpen={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#E2E6EA] bg-white text-[#18212B] transition-[transform,visibility] duration-200 md:hidden",
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
