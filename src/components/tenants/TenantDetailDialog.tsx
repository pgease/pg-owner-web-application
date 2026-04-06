import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import type { PropertyTenant } from "@/api/propertyOwner";
import { updatePropertyTenant } from "@/api/propertyOwner";
import { CanAccess } from "@/components/PermissionGuard";
import {
  tenantBedNo,
  tenantDisplayName,
  tenantFloor,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
} from "@/lib/tenantDisplay";

interface TenantDetailDialogProps {
  tenant: PropertyTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string | null;
  /** Called with merged tenant after a successful save (so the dialog shows fresh basics without closing). */
  onSaved?: (tenant: PropertyTenant) => void;
}

export function TenantDetailDialog({
  tenant,
  open,
  onOpenChange,
  propertyId,
  onSaved,
}: TenantDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!tenant || !open) return;
    setName(tenant.name ?? "");
    setPhone(tenant.phone ?? "");
    setEmail(tenant.email ?? "");
    setEditing(false);
  }, [tenant, open]);

  const handleSave = async () => {
    if (!propertyId || !tenant) return;
    try {
      setSaving(true);
      await updatePropertyTenant(propertyId, tenant.id, {
        name: name.trim(),
        phone: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      toast({ title: "Saved", description: "Tenant details updated." });
      setEditing(false);
      const next: PropertyTenant = {
        ...tenant,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      };
      onSaved?.(next);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Could not save", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenantDisplayName(tenant)}</DialogTitle>
          <DialogDescription>Tenant profile, room assignment, and rent. Edit only basic contact fields.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <CanAccess permission="tenant_edit_basic">
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit details
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setName(tenant.name ?? "");
                    setPhone(tenant.phone ?? "");
                    setEmail(tenant.email ?? "");
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </>
            )}
          </CanAccess>
        </div>

        {editing ? (
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Name</Label>
              <Input id="tenant-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-phone">Phone</Label>
              <Input id="tenant-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-email">Email</Label>
              <Input id="tenant-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Rental amounts and room assignment are managed separately.</p>
          </div>
        ) : (
          <div className="grid gap-2 text-sm py-2">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Phone</span>
              <p className="font-medium">{tenantPhone(tenant)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Email</span>
              <p className="font-medium">{tenant.email?.trim() ? tenant.email : "—"}</p>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-foreground">Location</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground text-xs">Block</span>
              <p className="font-medium">{tenant.block?.name ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Floor</span>
              <p className="font-medium">{tenantFloor(tenant)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Room</span>
              <p className="font-medium">{tenantRoomNo(tenant)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Bed</span>
              <p className="font-medium">{tenantBedNo(tenant)}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-foreground">Rent & tenancy</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground text-xs">Monthly rent</span>
              <p className="font-medium">{tenantRentAmount(tenant)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Security deposit</span>
              <p className="font-medium">
                {tenant.roomTenant?.securityDeposit != null
                  ? `₹${Number(tenant.roomTenant.securityDeposit).toLocaleString("en-IN")}`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <p className="font-medium">{tenant.roomTenant?.status ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Start date</span>
              <p className="font-medium">
                {tenant.roomTenant?.startDate
                  ? new Date(tenant.roomTenant.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs">Next rent due (estimated)</span>
              <p className="font-medium text-orange-600 dark:text-orange-400">{tenantRentDueLabel(tenant)}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <h4 className="font-semibold text-foreground">Notice</h4>
          <p className="text-muted-foreground">
            {tenant.notice?.isOnNotice
              ? `On notice — vacate ${tenant.notice.vacateOn ?? "—"}`
              : "Not on notice"}
          </p>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Room tenant id: {tenant.roomTenant?.id ?? "—"} · Tenant id: {tenant.id}
        </div>
      </DialogContent>
    </Dialog>
  );
}
