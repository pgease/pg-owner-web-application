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
    <div className="min-h-screen bg-[#F6F7F8]">
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
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200",
          collapsed ? "md:ml-[64px]" : "md:ml-[240px]",
        )}
      >
        <AppHeader onMenuToggle={() => setMobileOpen((v) => !v)} />
        <SubscriptionBanner />
        <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 pb-28">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
