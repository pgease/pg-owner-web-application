import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lock, ArrowRight, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

export const SubscriptionBanner: React.FC = () => {
  const navigate = useNavigate();
  const { status, daysRemaining, isTrial, isExpired, isLoading } = useEntitlements();

  const [dismissedTrial, setDismissedTrial] = useState(() => {
    try {
      return sessionStorage.getItem("pgease_dismissed_trial_banner") === "true";
    } catch {
      return false;
    }
  });

  const handleDismissTrial = () => {
    setDismissedTrial(true);
    try {
      sessionStorage.setItem("pgease_dismissed_trial_banner", "true");
    } catch {
      // ignore
    }
  };

  if (isLoading) return null;

  // 1. EXPIRED BANNER (Never dismissable, zero data loss notice, quick CTA)
  if (isExpired) {
    return (
      <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-500/30 text-white px-3 py-2.5 sm:px-4 shadow-md transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-red-200">
                Your 45-day Pro Trial has ended.
              </span>
              <span className="hidden md:inline text-xs text-slate-300 ml-1.5">
                Your PG data is 100% safe and fully accessible. Choose a plan to re-enable automated actions.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/plans")}
              className="h-7 px-2.5 text-[11px] rounded-lg border-teal-500/40 text-teal-300 bg-teal-950/40 hover:bg-teal-900/60 font-semibold"
            >
              Choose Lite (₹29/bed)
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/plans")}
              className="h-7 px-3 text-[11px] rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-sm gap-1"
            >
              Continue with Pro (₹49/bed)
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRIAL BANNER (Non-intrusive, informs owner of Pro Trial benefits & remaining days)
  if (isTrial && !dismissedTrial) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-emerald-500/15 border-b border-amber-400/30 text-foreground px-3 py-2 sm:px-4 backdrop-blur-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-bold text-amber-800 dark:text-amber-300">
              Pro Trial
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-foreground font-medium">
              <strong className="text-teal-600 dark:text-teal-400">{daysRemaining} days remaining</strong>. All Pro features unlocked.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/plans")}
              className="h-6 px-2 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 hover:bg-teal-500/10 gap-1"
            >
              View Plans
              <ArrowRight className="h-3 w-3" />
            </Button>
            <button
              type="button"
              onClick={handleDismissTrial}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
