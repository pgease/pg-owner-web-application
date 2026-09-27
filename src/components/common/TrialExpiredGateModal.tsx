import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Phone, MessageCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_HOURS, supportMailtoUrl, supportWhatsAppUrl } from "@/config/links";

interface TrialExpiredGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  featureName?: string;
}

/**
 * Shown when an expired plan blocks an action. Explains what is paused, reassures
 * that data is safe, and offers a clear path to plans or a real support channel.
 */
export const TrialExpiredGateModal: React.FC<TrialExpiredGateModalProps> = ({
  open,
  onOpenChange,
  title = "Your plan has expired",
  description = "Adding tenants, editing rooms, tracking notices and recording rent are paused until you choose a plan. Your existing data is safe and stays exactly as it is.",
  featureName,
}) => {
  const navigate = useNavigate();

  const handleGoToPlans = () => {
    onOpenChange(false);
    navigate("/plans");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-start text-left">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-warning/15 text-warning">
            <Lock className="h-5 w-5" />
          </span>
          <DialogTitle>{featureName ? `“${featureName}” needs an active plan` : title}</DialogTitle>
          <DialogDescription>
            {featureName
              ? `Your plan has expired, so “${featureName}” is paused for now. Your existing data is safe. Choose a plan to continue.`
              : description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-sm font-medium">Need help choosing or paying?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{SUPPORT_HOURS}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={SUPPORT_PHONE_TEL} aria-label={`Call ${SUPPORT_PHONE_DISPLAY}`}>
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={supportWhatsAppUrl("Hi, my PG Ease plan has expired and I need help choosing a plan.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={supportMailtoUrl("Help with my expired PG Ease plan")}>
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button onClick={handleGoToPlans}>See plans</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
