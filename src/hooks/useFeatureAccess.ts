import { useMemo } from "react";
import { useMyFeaturesQuery } from "@/hooks/usePropertyOwnerQueries";

export type PlanTier = "FREE" | "PREMIUM" | "PRO";

function normalizePlanTier(planName?: string, planDisplayName?: string): PlanTier {
  const raw = (planDisplayName || planName || "").toUpperCase();
  if (raw.includes("PRO")) return "PRO";
  if (raw.includes("PREMIUM")) return "PREMIUM";
  return "FREE";
}

function tierRank(t: PlanTier): number {
  if (t === "FREE") return 0;
  if (t === "PREMIUM") return 1;
  return 2;
}

/** When GET /property-owners/my-features returns no `features` array, gate nav by minimum plan tier. */
const NAV_FEATURE_MIN_TIER: Partial<Record<string, PlanTier>> = {
  STAFF_ROLES: "PRO",
  /** Same key as “Aadhaar verification” in Plans feature comparison */
  AADHAAR_KYC: "PREMIUM",
  ADVANCED_REPORTS: "PRO",
};

/**
 * Plan features from GET /property-owners/my-features.
 * - If the API returns a non-empty `features` list, access is driven by `featureKey` membership.
 * - If the list is empty, nav items with `featureKey` use plan name (Free / Premium / Pro) vs NAV_FEATURE_MIN_TIER.
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
