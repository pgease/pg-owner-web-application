import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { SubscriptionBanner } from "./SubscriptionBanner";
import StaffExpiredLockout from "./StaffExpiredLockout";
import { authStorage } from "@/api/http";
import { useEntitlements } from "@/hooks/useEntitlements";

interface AppLayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = "pgease_sidebar_collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isExpired, isLoading } = useEntitlements();
  const isStaff = authStorage.isStaff();

  // If user is staff and the owner's subscription has expired, enforce full operational lockout.
  if (!isLoading && isExpired && isStaff) {
    return <StaffExpiredLockout />;
  }

  // Persist the collapse preference and close the mobile drawer on navigation.
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-gradient-to-b from-[#005555] via-[#005050] to-[#003d3d]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-[6px] focus:bg-[#008080] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onSidebarToggle={() => setCollapsed((v) => !v)}
          isSidebarCollapsed={collapsed}
        />
        <SubscriptionBanner />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-contain bg-[#F8FAFC] dark:bg-slate-950 md:rounded-tl-[32px] md:shadow-xl p-3 sm:p-4 md:p-6 pb-28 transition-colors"
        >
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
