import { useState } from "react";
import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          "md:ml-[240px]",
          collapsed && "md:ml-[68px]"
        )}
      >
        <AppHeader onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
