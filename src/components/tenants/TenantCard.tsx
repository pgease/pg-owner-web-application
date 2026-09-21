import { Building2, DoorOpen, BedDouble, IndianRupee, Smartphone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantBedNo,
  tenantDisplayName,
  tenantFloor,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantStatusDisplay,
  tenantCode,
} from "@/lib/tenantDisplay";
import { cn } from "@/lib/utils";

interface TenantCardProps {
  tenant: PropertyTenant;
  onOpen: () => void;
  className?: string;
}

export function TenantCard({ tenant, onOpen, className }: TenantCardProps) {
  const verified = tenantVerificationLabel(tenant) === "verified";
  const photo = (tenant as any)?.photoUrl || (tenant as any)?.imageUrl || (tenant as any)?.profilePhotoUrl;
  const statusInfo = tenantStatusDisplay(tenant);
  const code = tenantCode(tenant);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        statusInfo.status === "UNDER_NOTICE" && "border-amber-300 dark:border-amber-800/60 bg-amber-500/[0.02]",
        statusInfo.status === "MOVED_OUT" && "opacity-75 bg-muted/20",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 shrink-0 border">
            {photo ? <AvatarImage src={photo} alt={tenantDisplayName(tenant)} className="object-cover" /> : null}
            <AvatarFallback className="text-sm font-medium bg-muted">{tenantInitials(tenant)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold leading-tight truncate">{tenantDisplayName(tenant)}</p>
              {code && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {code}
                </span>
              )}
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 font-medium shrink-0 flex items-center gap-1", statusInfo.badgeClass)}
              >
                {statusInfo.status === "UNDER_NOTICE" && <Clock className="h-2.5 w-2.5" />}
                {statusInfo.label}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0 shrink-0",
                  verified ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
                )}
              >
                {verified ? "Aadhaar verified" : "Pending KYC"}
              </Badge>
              <span className="inline-flex items-center text-muted-foreground" title="Phone on file">
                <Smartphone className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                floor: {tenantFloor(tenant)}
              </span>
              <span className="inline-flex items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                Room no: {tenantRoomNo(tenant)}
              </span>
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 shrink-0" />
                Bed no: {tenantBedNo(tenant)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm pt-1 border-t border-dashed">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
                Rent: {tenantRentAmount(tenant)}
              </span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                Rent due on {tenantRentDueLabel(tenant)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate">{tenantPhone(tenant)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
