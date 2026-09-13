import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, QrCode, CheckSquare, Users2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TRIAL_CLAIMED_KEY = "pgease_lite_trial_claimed_v1";

export const FirstLoginTrialModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const alreadyClaimed = localStorage.getItem(TRIAL_CLAIMED_KEY);
      if (!alreadyClaimed) {
        // Show after a brief delay for smooth entrance
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleClaimAndClose = () => {
    try {
      localStorage.setItem(TRIAL_CLAIMED_KEY, "true");
    } catch {}
    setIsOpen(false);
  };

  const handleViewPlans = () => {
    handleClaimAndClose();
    navigate("/plans");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-teal-500/30 bg-[#0a1128] text-white shadow-2xl">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 p-6 sm:p-8 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
              <Sparkles className="h-7 w-7 text-amber-300 animate-pulse" />
            </div>
            <Badge className="bg-amber-400 text-slate-900 font-bold px-3 py-0.5 text-xs mb-2 uppercase tracking-wider">
              🎉 45 Days Free Trial Unlocked
            </Badge>
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome to Lite Plan!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-sm">
              You have successfully claimed your full <strong>45-day free trial</strong> of the PG Ease Lite Plan.
            </DialogDescription>
          </div>
        </div>

        {/* Features Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            What you get during your 45-day trial:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-white">Direct UPI Intent Collection</p>
                <p className="text-slate-400 leading-relaxed">
                  Tenants pay directly into your account with 0% gateway commission.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-white">Manual Payment Approve / Reject</p>
                <p className="text-slate-400 leading-relaxed">
                  Verify received payments with one-click approve or reject controls.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Users2 className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-white">Dedicated Account Manager</p>
                <p className="text-slate-400 leading-relaxed">
                  Assigned support specialist available via direct phone and WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-teal-950/40 border border-teal-500/20 p-3 flex items-center justify-between text-xs text-slate-300">
            <span>Trial valid for: <strong className="text-teal-400">45 Days</strong></span>
            <span className="text-[11px] text-slate-400">Then ₹29/bed/mo</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-teal-900/30"
              onClick={handleClaimAndClose}
            >
              Start Managing My PG
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              className="border-white/15 text-slate-300 hover:text-white hover:bg-white/5 h-11 rounded-xl"
              onClick={handleViewPlans}
            >
              Explore Plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
