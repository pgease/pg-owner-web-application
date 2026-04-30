import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  IndianRupee,
  UserCog,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronDown,
  Receipt,
  MessageSquareWarning,
  LogOut,
  X,
  UtensilsCrossed,
  Moon,
  ClipboardCheck,
  UserMinus,
  Wallet,
  LifeBuoy,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { usePermissions } from "@/context/PermissionContext";
import { LockedSidebarItem } from "@/components/PermissionGuard";

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

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permissionKey: "dashboard_access",
    children: [
      { title: "Overview", url: "/dashboard", permissionKey: "dashboard_access" },
      { title: "KPIs", url: "/kpis", permissionKey: "dashboard_access" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    permissionKey: "tenant_view",
    children: [
      { title: "Tenant List", url: "/tenants", permissionKey: "tenant_view" },
      { title: "Add tenant", url: "/tenants/add", permissionKey: "tenant_add" },
      { title: "Vacant Rooms", url: "/tenants/vacant-rooms", permissionKey: "tenant_view" },
      { title: "Onboarding", url: "/tenants/onboarding", permissionKey: "tenant_view" },
      { title: "Guest & Visitor Log", url: "/tenants/guests", permissionKey: "guest_log" },
      { title: "Tenant KYC", url: "/tenants/kyc", permissionKey: "kyc_view", featureKey: "AADHAAR_KYC" },
    ],
  },
  {
    title: "My PGs",
    url: "/my-pgs",
    icon: Building2,
    permissionKey: "room_view",
    children: [
      { title: "PG Details", url: "/my-pgs", permissionKey: "room_view" },
      { title: "Blocks, Floors & Rooms", url: "/my-pgs/structure", permissionKey: "room_view" },
      { title: "Rooms & Beds", url: "/my-pgs/rooms", permissionKey: "room_view" },
      { title: "Bank Account", url: "/my-pgs/bank", permissionKey: "room_view" },
    ],
  },
  {
    title: "Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    permissionKey: "account_view_dues",
    children: [
      { title: "Rent Collection", url: "/rent-payments", permissionKey: "account_view_dues" },
      { title: "Payment History", url: "/rent-payments/history", permissionKey: "account_view_dues" },
      { title: "Dues & Pending", url: "/rent-payments/dues", permissionKey: "account_view_dues" },
    ],
  },
  {
    title: "Team",
    url: "/team",
    icon: UserCog,
    permissionKey: "team_view_members",
    children: [
      { title: "Team list", url: "/team", permissionKey: "team_view_members" },
      { title: "Legacy staff", url: "/staff", permissionKey: "team_view_members" },
      { title: "Roles & Permissions", url: "/staff/roles", permissionKey: "team_property_access", featureKey: "STAFF_ROLES" },
    ],
  },
  {
    title: "Complaints",
    url: "/complaints",
    icon: MessageSquareWarning,
    permissionKey: "complaint_view_all",
  },
  {
    title: "Food Menu",
    url: "/food",
    icon: UtensilsCrossed,
    permissionKey: "food_view_edit",
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
    permissionKey: "expense_view",
    children: [
      { title: "Add Expense", url: "/expenses", permissionKey: "expense_view" },
      { title: "Categories", url: "/expenses/categories", permissionKey: "expense_view" },
      { title: "Monthly View", url: "/expenses/monthly", permissionKey: "expense_view" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    permissionKey: "report_people",
    children: [
      { title: "Tenant Due Rent", url: "/reports", permissionKey: "report_people" },
      { title: "Payment Report", url: "/reports/payments", permissionKey: "report_people" },
      { title: "Export", url: "/reports/export", permissionKey: "report_people" },
    ],
  },
  {
    title: "Night Out",
    url: "/nightout",
    icon: Moon,
    permissionKey: "nightout_view",
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: ClipboardCheck,
    permissionKey: "attend_view",
  },
  {
    title: "Eviction",
    url: "/eviction",
    icon: UserMinus,
    permissionKey: "eviction_approve",
  },
  {
    title: "Refunds",
    url: "/refunds",
    icon: Wallet,
    permissionKey: "refund_add",
  },
  {
    title: "Plans & Pricing",
    url: "/plans",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    children: [
      { title: "Profile", url: "/settings" },
      { title: "Notifications", url: "/settings/notifications" },
    ],
  },
  {
    title: "Support",
    url: "/support",
    icon: LifeBuoy,
    children: [
      { title: "Support Home", url: "/support" },
      { title: "Privacy Policy", url: "/privacy-policy" },
      { title: "Terms & Conditions", url: "/terms-and-conditions" },
      { title: "Contact Us", url: "/contact-us" },
    ],
  },
  {
    title: "API catalog",
    url: "/reference/apis",
    icon: BookOpen,
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { isOwner, can } = usePermissions();
  const { isNavChildLocked: isFeatureNavLocked } = useFeatureAccess();

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  const isChildActive = (item: NavItem) => {
    if (!item.children) return location.pathname === item.url;
    return item.children.some((c) => location.pathname === c.url);
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isGroupOpen = (item: NavItem) => {
    if (openGroups[item.title] !== undefined) return openGroups[item.title];
    return isChildActive(item);
  };

  const isLockedByPermission = (permissionKey?: string) => {
    if (!permissionKey || isOwner) return false;
    return !can(permissionKey);
  };

  const isLockedByFeature = (featureKey?: string) => {
    if (!featureKey || !isOwner) return false;
    return isFeatureNavLocked(featureKey);
  };

  const renderLocked = (label: string, Icon: React.ElementType) => (
    <LockedSidebarItem label={label} icon={Icon} />
  );

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <img src={pgeaseLogo} alt="PG Ease" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight text-sidebar-primary-foreground">
              PG Ease
            </span>
          </div>
        )}
        {collapsed && (
          <img src={pgeaseLogo} alt="PG Ease" className="mx-auto h-8 w-8 rounded-lg object-cover" />
        )}
        {mobileOpen && (
          <button onClick={onMobileClose} className="ml-auto text-sidebar-muted hover:text-sidebar-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isChildActive(item);
            const open = isGroupOpen(item);
            const hasChildren = item.children && item.children.length > 0;
            const permLocked = isLockedByPermission(item.permissionKey);
            const featLocked = isLockedByFeature(item.featureKey);
            const topLocked = permLocked || featLocked;

            return (
              <li key={item.title}>
                {hasChildren && !collapsed ? (
                  <>
                    <button
                      onClick={() => toggleGroup(item.title)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "text-sidebar-primary"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
                    </button>
                    {open && (
                      <ul className="ml-[30px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                        {item.children!.map((child) => {
                          const cPerm = isLockedByPermission(child.permissionKey);
                          const cFeat = isLockedByFeature(child.featureKey);
                          if (cFeat) {
                            return (
                              <li key={child.url}>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/80"
                                  onClick={() => {
                                    navigate("/plans");
                                    onMobileClose?.();
                                  }}
                                >
                                  <span className="truncate">{child.title}</span>
                                  <span className="text-[10px] uppercase text-amber-600/90">Plan</span>
                                </button>
                              </li>
                            );
                          }
                          if (cPerm) {
                            return (
                              <li key={child.url}>{renderLocked(child.title, item.icon)}</li>
                            );
                          }
                          return (
                            <li key={child.url}>
                              <NavLink
                                to={child.url}
                                end
                                className="block rounded-md px-3 py-1.5 text-[13px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                activeClassName="bg-sidebar-accent text-sidebar-primary"
                                onClick={onMobileClose}
                              >
                                {child.title}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : hasChildren && collapsed ? (
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    activeClassName="bg-sidebar-accent text-sidebar-primary"
                    onClick={onMobileClose}
                    title={item.title}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                  </NavLink>
                ) : topLocked ? (
                  <div className="px-1">{renderLocked(item.title, item.icon)}</div>
                ) : (
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    activeClassName="bg-sidebar-accent text-sidebar-primary"
                    onClick={onMobileClose}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive",
            "hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <div className="hidden border-t border-sidebar-border p-3 md:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          "hidden md:flex",
          collapsed ? "md:w-[68px]" : "md:w-[240px]",
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AppSidebar;
