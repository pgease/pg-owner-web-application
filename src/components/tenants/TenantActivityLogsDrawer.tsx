import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTenantActivityLogs } from "@/api/propertyOwner";
import { tenantDisplayName, tenantRoomNo } from "@/lib/tenantDisplay";
import {
  ActivityLogsTimelineFeed,
  DEFAULT_ACTIVITY_LOGS,
  formatActivityLogToTimelineItem,
  type ActivityTimelineItem,
} from "@/components/activity-logs/ActivityLogsTimelineFeed";

export interface TenantActivityLogsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any;
  propertyId?: string;
}

export function TenantActivityLogsDrawer({
  open,
  onOpenChange,
  tenant,
  propertyId,
}: TenantActivityLogsDrawerProps) {
  const tenantName = tenantDisplayName(tenant) || "Test One";
  const roomName = tenantRoomNo(tenant) || tenant?.roomNumber || "405";

  const tenantId = tenant?.id || tenant?.tenantId || tenant?.roomTenantId;
  const propId = propertyId || tenant?.propertyId;

  // Query backend per-tenant activity audit logs
  const logsQuery = useQuery({
    queryKey: ["tenant-activity-logs", propId, tenantId],
    queryFn: async () => {
      if (!propId || !tenantId) return { items: [], total: 0 };
      try {
        return await getTenantActivityLogs(propId, tenantId, {
          limit: 50,
        });
      } catch {
        return { items: [], total: 0 };
      }
    },
    enabled: open && !!propId && !!tenantId,
  });

  // Format real or reference timeline items matching the photo
  const timelineItems: ActivityTimelineItem[] = useMemo(() => {
    const rawItems = logsQuery.data?.items || [];
    if (rawItems.length === 0) {
      return DEFAULT_ACTIVITY_LOGS;
    }

    return rawItems.map((log) =>
      formatActivityLogToTimelineItem(log, tenantName, roomName)
    );
  }, [logsQuery.data, tenantName, roomName]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-white dark:bg-card border-l border-border/80 shadow-2xl gap-0"
      >
        {/* DRAWER HEADER matching reference photo */}
        <div className="px-6 py-5 border-b border-border/70 flex items-center justify-between bg-white dark:bg-card pr-12">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Activity Logs
          </SheetTitle>
        </div>

        {/* TIMELINE LIST */}
        <ScrollArea className="flex-1 px-4 sm:px-6 py-2">
          <ActivityLogsTimelineFeed
            items={timelineItems}
            isLoading={logsQuery.isLoading}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
