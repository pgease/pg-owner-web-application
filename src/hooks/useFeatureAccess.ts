import { useMemo } from "react";
import { useEntitlements } from "./useEntitlements";
import { useMyFeaturesQuery } from "./usePropertyOwnerQueries";

export type PlanTier = "FREE" | "LITE" | "PRO";

export function useFeatureAccess() {
  const entitlements = useEntitlements();
  const { data, isLoading, isError, refetch } = useMyFeaturesQuery();

  const userPlan: PlanTier = useMemo(() => {
    if (entitlements.isExpired) return "FREE";
    if (entitlements.isPro) return "PRO";
    return "LITE";
  }, [entitlements.isExpired, entitlements.isPro]);

  function hasFeature(featureKey: string): boolean {
    return entitlements.hasFeature(featureKey);
  }

  function isNavChildLocked(featureKey: string | undefined): boolean {
    if (!featureKey || entitlements.isLoading) return false;
    return !entitlements.hasFeature(featureKey);
  }

  return {
    features: data?.features ?? [],
    planName: entitlements.planName,
    planDisplayName: entitlements.planDisplayName,
    userPlan,
    featureKeys: new Set(Object.keys(entitlements.featuresMap)),
    hasExplicitFeatureList: Object.keys(entitlements.featuresMap).length > 0,
    hasFeature,
    isNavChildLocked,
    isLoading: entitlements.isLoading,
    isError,
    refetch: entitlements.refetch,
  };
}
