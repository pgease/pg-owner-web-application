import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  IndianRupee,
  ShieldCheck,
  Clock,
  ArrowRightLeft,
  UserMinus,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantDisplayName,
  tenantInitials,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantStayStatus,
  tenantBlock,
  tenantFloor,
  tenantBedNo,
  tenantCode,
} from "@/lib/tenantDisplay";
import { formatDate } from "@/lib/formatters";

interface TenantDetailDrawerProps {
  tenant: PropertyTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveTenant?: (tenant: PropertyTenant) => void;
  onNoticeTenant?: (tenant: PropertyTenant) => void;
  onVacateTenant?: (tenant: PropertyTenant) => void;
  onRecordPayment?: (tenant: PropertyTenant) => void;
  onSendReminder?: (tenant: PropertyTenant) => void;
}

export const TenantDetailDrawer: React.FC<TenantDetailDrawerProps> = ({
  tenant,
  open,
  onOpenChange,
  onMoveTenant,
  onNoticeTenant,
  onVacateTenant,
  onRecordPayment,
  onSendReminder,
}) => {
  if (!tenant) return null;

  const phone = tenantPhone(tenant);
  const cleanPhone = phone !== "—" ? phone.replace(/\D/g, "") : "";
  const wa = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}` : null;
  const isVerified = tenantVerificationLabel(tenant) === "verified";
  const stay = tenantStayStatus(tenant);
  const room = tenantRoomNo(tenant);
  const bed = tenantBedNo(tenant);
  const block = tenantBlock(tenant);
  const floor = tenantFloor(tenant);
  const code = tenantCode(tenant);
  const joiningDate = (tenant as any).roomTenant?.startDate || tenant.createdAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-[var(--gray-200)] shadow-overlay"
      >
        <SheetHeader className="p-4 sm:p-5 border-b border-[var(--gray-200)] bg-[var(--gray-50)] text-left shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--brand-50)] border border-[var(--brand-100)] text-[var(--brand-700)] font-semibold flex items-center justify-center text-sm shrink-0">
                {tenantInitials(tenant)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-base font-semibold text-[var(--gray-900)] truncate">
                    {tenantDisplayName(tenant)}
                  </SheetTitle>
                  {code && (
                    <span className="font-mono text-[11px] text-[var(--gray-500)] bg-[var(--gray-200)] px-1.5 py-0.5 rounded-sm">
                      {code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">{phone}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StatusBadge
              status={stay === "UNDER_NOTICE" ? "on_notice" : stay === "MOVED_OUT" ? "moved_out" : "occupied"}
              size="sm"
            />
            <StatusBadge
              status={isVerified ? "kyc_completed" : "kyc_pending"}
              size="sm"
            />
          </div>
        </SheetHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Room Allocation */}
          <div className="register-card p-3.5 space-y-2">
            <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider block">
              Room & Bed Allocation
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[var(--gray-500)] block">Room / Bed</span>
                <span className="font-semibold text-[var(--gray-900)]">
                  {room !== "—" ? `Room ${room}` : "Unassigned"} {bed !== "—" ? `· Bed ${bed}` : ""}
                </span>
              </div>
              <div>
                <span className="text-[var(--gray-500)] block">Block / Floor</span>
                <span className="font-semibold text-[var(--gray-900)]">
                  {block !== "—" ? block : "Main"} · {floor !== "—" ? floor : "Floor"}
                </span>
              </div>
            </div>
          </div>

          {/* Rent & Dues */}
          <div className="register-card p-3.5 space-y-2">
            <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider block">
              Financial & Billing
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[var(--gray-500)] block">Monthly Rent</span>
                <span className="font-semibold text-[var(--gray-900)] tabular-nums text-sm">
                  {tenantRentAmount(tenant)}
                </span>
              </div>
              <div>
                <span className="text-[var(--gray-500)] block">Due Status</span>
                <span className="font-semibold text-[var(--gray-900)]">
                  {tenantRentDueLabel(tenant)}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[var(--gray-500)] block">Joined On</span>
                <span className="text-[var(--gray-700)] tabular-nums">
                  {formatDate(joiningDate)}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[var(--gray-500)] block">Security Deposit</span>
                <span className="text-[var(--gray-700)] tabular-nums">
                  {(tenant as any).roomTenant?.securityDeposit
                    ? `₹${Number((tenant as any).roomTenant.securityDeposit).toLocaleString("en-IN")}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider block">
              Operations
            </span>
            <div className="grid grid-cols-2 gap-2">
              {phone !== "—" && (
                <Button variant="secondary" size="sm" asChild className="gap-1.5 justify-start text-xs">
                  <a href={`tel:${cleanPhone}`}>
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Tenant
                  </a>
                </Button>
              )}
              {wa && (
                <Button variant="secondary" size="sm" asChild className="gap-1.5 justify-start text-xs">
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                  </a>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 justify-start text-xs"
                onClick={() => {
                  onOpenChange(false);
                  onMoveTenant?.(tenant);
                }}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-[var(--gray-600)]" /> Move Tenant
              </Button>
              {stay !== "UNDER_NOTICE" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 justify-start text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onNoticeTenant?.(tenant);
                  }}
                >
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Initiate Notice
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 justify-start text-xs text-[#B42318] hover:bg-[#FEF1F0]"
                onClick={() => {
                  onOpenChange(false);
                  onVacateTenant?.(tenant);
                }}
              >
                <UserMinus className="h-3.5 w-3.5" /> Move Out
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3 sm:p-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-[var(--brand-600)] hover:text-[var(--brand-700)]"
          >
            <Link to={`/tenants/${tenant.id}`}>
              Full Profile <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onSendReminder?.(tenant);
              }}
            >
              Send reminder
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onRecordPayment?.(tenant);
              }}
            >
              <IndianRupee className="h-3.5 w-3.5" /> Record payment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
