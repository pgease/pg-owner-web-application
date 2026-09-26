import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Send,
  IndianRupee,
  ShieldCheck,
  Zap,
  Building,
  DoorClosed,
  Calendar,
  AlertCircle,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  getTenantPaymentLink,
  sendWhatsAppRentReminder,
  type TenantPaymentLinkData,
} from "@/api/propertyOwner";

interface SharePaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  roomTenantId: string;
  tenantName?: string;
  roomNumber?: string;
  phone?: string;
}

export function SharePaymentLinkDialog({
  open,
  onOpenChange,
  propertyId,
  roomTenantId,
  tenantName,
  roomNumber,
  phone,
}: SharePaymentLinkDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TenantPaymentLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fetchPaymentLink = useCallback(async () => {
    if (!propertyId || !roomTenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTenantPaymentLink(propertyId, roomTenantId);
      if (res?.success && res.data) {
        setData(res.data);
      } else {
        setError("Failed to retrieve payment link details.");
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Could not fetch tenant payment link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, roomTenantId]);

  useEffect(() => {
    if (open) {
      fetchPaymentLink();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, fetchPaymentLink]);

  const handleCopy = (text: string, type: "link" | "direct" | "message") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Payment Link Copied! 🔗", description: "Ready to share with tenant." });
    } else if (type === "direct") {
      setCopiedDirectLink(true);
      setTimeout(() => setCopiedDirectLink(false), 2000);
      toast({ title: "Direct Link Copied! 🔗" });
    } else if (type === "message") {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
      toast({ title: "WhatsApp Message Copied! 💬", description: "Paste directly into WhatsApp or SMS." });
    }
  };

  const activePhone = data?.tenant?.phone || phone || "";
  const cleanPhone = activePhone.replace(/\D/g, "");

  const handleOpenWhatsApp = () => {
    if (!data?.whatsAppMessage) return;
    const text = encodeURIComponent(data.whatsAppMessage);
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  const handleSendOfficialReminder = async () => {
    if (!propertyId || !roomTenantId) return;
    setIsSendingReminder(true);
    try {
      const res = await sendWhatsAppRentReminder(propertyId, roomTenantId);
      toast({
        title: "WhatsApp Reminder Dispatched! 🚀",
        description: res?.message || `Sent official rent reminder to ${data?.tenant?.name || tenantName}.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Could not send reminder",
        description: (err as Error)?.message || "Please use the 'Open WhatsApp' button to send manually.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const breakdown = data?.breakdown;
  const displayName = data?.tenant?.name || tenantName || "Tenant";
  const displayRoom = data?.room?.roomNumber || roomNumber || "—";
  const displayPeriod = data?.period?.label || "Current Month";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <IndianRupee className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Tenant Payment Link & Dues
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Share online rent collection link or dispatch a reminder directly to WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="py-6 space-y-3 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl text-xs"
              onClick={fetchPaymentLink}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-4 py-2 text-xs">
            {/* TENANT & ROOM HEADER TAGS */}
            <div className="flex flex-wrap items-center gap-2 pb-1 border-b text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground flex items-center gap-1">
                {displayName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <DoorClosed className="h-3 w-3" /> Room {displayRoom}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {displayPeriod}
              </span>
              {data.status && (
                <Badge
                  variant="outline"
                  className={
                    data.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 ml-auto uppercase text-[10px]"
                      : "bg-amber-50 text-amber-700 border-amber-300 ml-auto uppercase text-[10px]"
                  }
                >
                  {data.status}
                </Badge>
              )}
            </div>

            {/* DUES BREAKDOWN CARD */}
            {breakdown && (
              <div className="rounded-xl border border-border/80 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold text-xs">Total Outstanding</span>
                  <span className="text-xl font-black text-foreground tabular-nums flex items-center">
                    ₹{breakdown.totalOutstanding.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Monthly Rent</span>
                    <span className="font-bold tabular-nums">
                      ₹{breakdown.monthlyRent.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Security Deposit</span>
                    <span className="font-bold tabular-nums">
                      {breakdown.isSecurityDepositPaid
                        ? "Paid ✓"
                        : `₹${breakdown.securityDeposit.toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Electricity / Misc</span>
                    <span className="font-bold tabular-nums">
                      ₹{(breakdown.miscellaneousFees + breakdown.electricityAmount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Paid So Far</span>
                    <span className="font-bold text-emerald-600 tabular-nums">
                      ₹{breakdown.amountPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECT PAYMENT LINK */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                Direct Tenant Payment Link
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={data.paymentLink}
                  className="h-9 font-mono text-xs rounded-xl bg-muted/30 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold shrink-0"
                  onClick={() => handleCopy(data.paymentLink, "link")}
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
                <Button
                  type="button"
                  variant={showQr ? "default" : "outline"}
                  size="sm"
                  className={`h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold shrink-0 ${
                    showQr ? "bg-teal-600 hover:bg-teal-700 text-white" : ""
                  }`}
                  onClick={() => setShowQr(!showQr)}
                  title="Toggle QR Code for direct scan"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  {showQr ? "Hide QR" : "Show QR"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl shrink-0"
                  onClick={() => window.open(data.paymentLink, "_blank")}
                  title="Open payment link in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Scannable Payment Link QR Code */}
              {showQr && (
                <div className="p-4 bg-white dark:bg-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-700/60 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 my-2 shadow-xs">
                  <QRCodeSVG
                    value={data.settlement?.upiQrString || data.paymentLink}
                    size={160}
                    level="M"
                    includeMargin={true}
                    className="rounded-lg mx-auto"
                  />
                  <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                    {data.settlement?.upiQrString
                      ? "Scan with GPay / PhonePe / Paytm to Pay"
                      : "Scan to Open Rent Payment Portal"}
                  </p>
                  {data.settlement && (
                    <div className="text-[10px] text-muted-foreground flex flex-col items-center gap-0.5">
                      <span>Direct Payout to: <strong className="text-foreground">{data.settlement.bankName || "Settlement Bank"}</strong></span>
                      {data.settlement.upiId && <span className="font-mono">{data.settlement.upiId}</span>}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Tenants can scan this directly using their mobile camera or any UPI app.
                  </p>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                Tenants can open this link on mobile to pay with UPI Intent (GPay, PhonePe, Paytm, etc.) or NetBanking.
              </p>
            </div>

            {/* WHATSAPP MESSAGE PREVIEW */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  WhatsApp Reminder Preview
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(data.whatsAppMessage, "message")}
                  className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                >
                  {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedMessage ? "Copied" : "Copy Message"}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 text-[11px] font-sans leading-relaxed whitespace-pre-wrap text-emerald-950 dark:text-emerald-200">
                {data.whatsAppMessage}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 font-bold text-xs gap-1.5 shadow-xs"
                onClick={handleOpenWhatsApp}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Open in WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSendingReminder}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl h-9 font-bold text-xs gap-1.5"
                onClick={handleSendOfficialReminder}
              >
                {isSendingReminder ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                )}
                Send via PG Ease Bot
              </Button>
            </div>
          </div>
        ) : null}

        <DialogFooter className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
