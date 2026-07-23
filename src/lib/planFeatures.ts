import type { PlanFeature } from "@/api/propertyOwner";

export type PlanTierKey = "FREE" | "LITE" | "PRO";

export interface StaticPlanFeatureRow {
  name: string;
  /** If set, "Your plan" column uses GET /property-owners/my-features when the API returns features. */
  featureKey?: string;
  free: boolean;
  lite: boolean;
  pro: boolean;
  details?: string;
}

export function buildFeatureKeySet(features: PlanFeature[] | undefined): Set<string> {
  return new Set(features?.map((f) => f.featureKey) ?? []);
}

/** Whether the user should see this row as included, for the "Your plan" column. */
export function userHasFeatureForRow(
  row: StaticPlanFeatureRow,
  apiKeys: Set<string>,
  hasExplicitApiList: boolean,
  planKey: PlanTierKey
): boolean {
  if (hasExplicitApiList && row.featureKey) {
    return apiKeys.has(row.featureKey);
  }
  if (planKey === "FREE") return row.free;
  if (planKey === "LITE") return row.lite;
  return row.pro;
}

