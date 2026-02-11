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
  Clock,
  FileText,
  Shield,
  PlusCircle,
  Tag,
  CalendarDays,
  UserPlus,
  Eye,
  Wallet,
  LogOut,
  Bell,
  User,
  LifeBuoy,
  Home,
  BedDouble,
  Landmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";

interface NavChild {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    children: [
      { title: "Overview", url: "/" },
      { title: "KPIs", url: "/kpis" },
    ],
  },
  {
    title: "My PGs",
    url: "/my-pgs",
    icon: Building2,
    children: [
      { title: "PG Details", url: "/my-pgs" },
      { title: "Rooms & Beds", url: "/my-pgs/rooms" },
      { title: "Bank Account", url: "/my-pgs/bank" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    children: [
      { title: "Tenant List", url: "/tenants" },
      { title: "Onboarding", url: "/tenants/onboarding" },
      { title: "Guest & Visitor Log", url: "/tenants/guests" },
    ],
  },
  {
    title: "Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    children: [
      { title: "Rent Collection", url: "/rent-payments" },
      { title: "Payment History", url: "/rent-payments/history" },
      { title: "Dues & Pending", url: "/rent-payments/dues" },
    ],
  },
  {
    title: "Staff",
    url: "/staff",
    icon: UserCog,
    children: [
      { title: "Staff List", url: "/staff" },
      { title: "Roles & Permissions", url: "/staff/roles" },
    ],
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
    children: [
      { title: "Add Expense", url: "/expenses" },
      { title: "Categories", url: "/expenses/categories" },
      { title: "Monthly View", url: "/expenses/monthly" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    children: [
      { title: "Tenant Due Rent", url: "/reports" },
      { title: "Payment Report", url: "/reports/payments" },
      { title: "Export", url: "/reports/export" },
    ],
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

  const sidebarContent = (
    <>
      {/* Logo */}
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
        {/* Mobile close */}
        {mobileOpen && (
          <button onClick={onMobileClose} className="ml-auto text-sidebar-muted hover:text-sidebar-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isChildActive(item);
            const open = isGroupOpen(item);
            const hasChildren = item.children && item.children.length > 0;

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
                        {item.children!.map((child) => (
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
                        ))}
                      </ul>
                    )}
                  </>
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

      {/* Logout button */}
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

      {/* Collapse toggle - desktop only */}
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          // Desktop
          "hidden md:flex",
          collapsed ? "md:w-[68px]" : "md:w-[240px]",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
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
