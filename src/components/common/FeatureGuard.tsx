import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEntitlements } from "@/hooks/useEntitlements";

export interface FeatureGuardProps {
  /** The feature key to check entitlement for */
  feature: string;
  /** Custom title when feature is locked */
  fallbackTitle?: string;
  /** Custom description when feature is locked */
  fallbackDescription?: string;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** If true, renders a compact inline lock badge instead of full card */
  inline?: boolean;
  /** Children to render when feature is unlocked */
  children: ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  fallbackTitle,
  fallbackDescription,
  fallback,
  inline = false,
  children,
}) => {
  const navigate = useNavigate();
  const { hasFeature, isExpired, isLoading } = useEntitlements();

  // If loading, we avoid flashing locked state prematurely
  if (isLoading) {
    return <>{children}</>;
  }

  const isUnlocked = hasFeature(feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const title = fallbackTitle || "Feature Locked";
  const description =
    fallbackDescription ||
    (isExpired
      ? "Your 45-day Pro Trial has concluded. Reactivate your subscription with Lite or Pro to use this feature."
      : "This advanced automation is available on the PG Ease Pro Plan. Upgrade to unlock full access.");

  if (inline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
        <Lock className="h-3 w-3 text-amber-600" />
        <span>{title}</span>
        <button
          type="button"
          onClick={() => navigate("/plans")}
          className="ml-1 text-teal-600 hover:text-teal-700 underline font-bold"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-2 border-dashed border-teal-500/30 bg-gradient-to-b from-teal-500/[0.04] to-transparent p-6 sm:p-8 text-center shadow-sm">
      <CardContent className="p-0 flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
          {isExpired ? <Lock className="h-7 w-7" /> : <Crown className="h-7 w-7" />}
        </div>

        <div className="space-y-1.5">
          <Badge className="bg-teal-600/15 text-teal-700 dark:text-teal-300 border border-teal-600/30 text-[10px] font-bold uppercase tracking-wider">
            {isExpired ? "Subscription Expired" : "Pro Plan Feature"}
          </Badge>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => navigate("/plans")}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-sm gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isExpired ? "Choose a Plan" : "Upgrade to Pro (₹49/bed)"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto text-xs h-9 px-4 rounded-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
