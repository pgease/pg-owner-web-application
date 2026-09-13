import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrialExpiredGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  featureName?: string;
}

export const TrialExpiredGateModal: React.FC<TrialExpiredGateModalProps> = ({
  open,
  onOpenChange,
  title = "45-Day Free Trial is Over",
  description = "Your 45-day free trial has concluded. All operations including adding tenants, building structure updates, notice period tracking, and rent analytics are restricted.",
  featureName,
}) => {
  const navigate = useNavigate();

  const handleGoToPlans = () => {
    onOpenChange(false);
    navigate("/plans");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-amber-500/30 bg-[#0a1128] text-white shadow-2xl rounded-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <Badge className="bg-destructive/20 text-red-300 border border-destructive/40 text-[10px] font-bold uppercase tracking-wider">
              Subscription Over • Operations Locked
            </Badge>
            <DialogTitle className="text-xl font-black text-white">
              {featureName ? `${featureName} Restricted` : title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {featureName
                ? `You cannot perform "${featureName}" because your 45-day free trial has expired. Contact support or buy a plan to unlock all operations.`
                : description}
            </DialogDescription>
          </div>

          {/* Quick Plans Preview */}
          <div className="w-full grid grid-cols-2 gap-3 pt-1 text-left">
            <div
              className="p-3 rounded-xl bg-white/[0.04] border border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer group"
              onClick={handleGoToPlans}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-400">Lite Plan</span>
                <Zap className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <p className="text-lg font-black text-white">
                ₹29<span className="text-[10px] font-normal text-slate-400">/bed/mo</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Direct UPI 0% fee + Manual verify</p>
            </div>

            <div
              className="p-3 rounded-xl bg-white/[0.04] border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer group"
              onClick={handleGoToPlans}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-400">Pro Plan</span>
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-black text-white">
                ₹49<span className="text-[10px] font-normal text-slate-400">/bed/mo</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Gateway + T+2 payout + PG Website</p>
            </div>
          </div>

          {/* Account Manager Contact Card */}
          <div className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-white">Need help? Talk to Rahul Sharma</p>
                <p className="text-[10px] text-slate-400">Dedicated Account Manager • +91 98765 43210</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <a
                href="tel:+919876543210"
                className="py-1.5 px-2 text-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-200 transition-colors"
              >
                📞 Call
              </a>
              <a
                href="https://wa.me/919876543210?text=Hi%20Rahul,%20my%20PG%20Ease%20trial%20is%20over%20and%20I%20need%20help%20activating%20my%20plan"
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2 text-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 transition-colors"
              >
                💬 WhatsApp
              </a>
              <a
                href="mailto:support@pgease.in?subject=Subscription%20Assistance%20-%20Trial%20Over"
                className="py-1.5 px-2 text-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-300 transition-colors"
              >
                ✉️ Email
              </a>
            </div>
          </div>

          <div className="w-full pt-1 flex flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-teal-900/30"
              onClick={handleGoToPlans}
            >
              Buy Plan to Reactivate
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="ghost"
              className="text-xs text-slate-400 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
