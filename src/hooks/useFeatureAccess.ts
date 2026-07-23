import { useMemo } from "react";
import { useMyFeaturesQuery } from "@/hooks/usePropertyOwnerQueries";

export type PlanTier = "FREE" | "LITE" | "PRO";

function normalizePlanTier(planName?: string, planDisplayName?: string): PlanTier {
  const raw = (planDisplayName || planName || "").toUpperCase();
  if (raw.includes("PRO") || raw.includes("STANDARD") || raw.includes("49")) return "PRO";
  if (raw.includes("LITE") || raw.includes("PREMIUM") || raw.includes("29")) return "LITE";
  return "FREE";
}

function tierRank(t: PlanTier): number {
  if (t === "FREE") return 0;
  if (t === "LITE") return 1;
  return 2;
}

/** When GET /property-owners/my-features returns no `features` array, gate nav by minimum plan tier. */
const NAV_FEATURE_MIN_TIER: Partial<Record<string, PlanTier>> = {
  MULTI_PG: "LITE",
  WHATSAPP_REMINDERS: "FREE",
  UPI_INTENT_DIRECT: "LITE",
  AADHAAR_KYC: "FREE",
  DIGITAL_AGREEMENT: "FREE",
  PAYMENT_GATEWAY_AUTO: "PRO",
  AUTO_RECEIPTS: "PRO",
  LATE_FEES: "PRO",
  PG_WEBSITE: "PRO",
  LEAD_CRM: "PRO",
  GUEST_TRACKING: "PRO",
  BROADCAST: "PRO",
  PRIORITY_SUPPORT: "PRO",
};

/**
 * Plan features from GET /property-owners/my-features.
 * - If the API returns a non-empty `features` list, access is driven by `featureKey` membership.
 * - If the list is empty, nav items with `featureKey` use plan name (Free / Lite / Standard) vs NAV_FEATURE_MIN_TIER.
 */
export function useFeatureAccess() {
  const { data, isLoading, isError, refetch } = useMyFeaturesQuery();

  const featureKeys = useMemo(() => {
    return new Set((data?.features ?? []).map((f) => f.featureKey));
  }, [data?.features]);

  const hasExplicitFeatureList = (data?.features?.length ?? 0) > 0;

  const userPlan = useMemo(
    () => normalizePlanTier(data?.planName, data?.planDisplayName),
    [data?.planName, data?.planDisplayName]
  );

  /** True if this featureKey is enabled (only meaningful when API sent a non-empty feature list). */
  function hasFeature(featureKey: string): boolean {
    if (!hasExplicitFeatureList) return true;
    return featureKeys.has(featureKey);
  }

  /**
   * Use for sidebar items with optional `featureKey`.
   * Locked when: API list exists and omits key, OR no API list and plan tier is below minimum for that key.
   */
  function isNavChildLocked(featureKey: string | undefined): boolean {
    if (!featureKey || isLoading) return false;
    if (hasExplicitFeatureList) {
      return !featureKeys.has(featureKey);
    }
    const minTier = NAV_FEATURE_MIN_TIER[featureKey];
    if (!minTier) return false;
    return tierRank(userPlan) < tierRank(minTier);
  }

  return {
    features: data?.features ?? [],
    planName: data?.planName,
    planDisplayName: data?.planDisplayName,
    userPlan,
    featureKeys,
    hasExplicitFeatureList,
    hasFeature,
    isNavChildLocked,
    isLoading,
    isError,
    refetch,
  };
}

