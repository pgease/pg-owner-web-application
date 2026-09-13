import { useMemo } from "react";
import { useCurrentPlan, useMyFeaturesQuery } from "./usePropertyOwnerQueries";
import { authStorage } from "@/api/http";

export type PlanType = "LITE" | "PRO" | null;

export interface SubscriptionAccessInfo {
  currentPlan: PlanType;
  planDisplayName: string;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpiresAt: Date | null;
  isExpired: boolean;
  canAddTenant: boolean;
  canDeleteTenant: boolean;
  canViewRentAnalytics: boolean;
  canAddBuilding: boolean;
  canTrackNotice: boolean;
  canPerformOperations: boolean;
  hasDirectUpiIntent: boolean;
  hasManualPaymentVerify: boolean;
  hasAutomatedGateway: boolean;
  hasPgWebsite: boolean;
  hasDedicatedAccountManager: boolean;
  subdomainUrl: string;
  isLoading: boolean;
}

export function useSubscriptionAccess(): SubscriptionAccessInfo {
  const { data: currentPlanData, isLoading: isPlanLoading } = useCurrentPlan();
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();

  const owner = authStorage.getPropertyOwner();

  return useMemo(() => {
    const rawPlanName = (
      featuresData?.planName ||
      currentPlanData?.currentPlan?.name ||
      ""
    ).toLowerCase();

    const isPaidPro = rawPlanName.includes("pro");
    const isPaidLite =
      rawPlanName.includes("lite") || rawPlanName.includes("premium");

    const status = currentPlanData?.subscriptionStatus;

    // Calculate trial days from currentPlanData or createdAt
    let trialDaysRemaining = 45;
    let trialExpiresAt: Date | null = null;
    let isTrial = false;
    let isExpired = false;

    if (isPaidPro) {
      isTrial = false;
      isExpired = false;
      trialDaysRemaining = 0;
    } else if (isPaidLite && status === "active") {
      isTrial = false;
      isExpired = false;
      trialDaysRemaining = 0;
    } else {
      // Trial calculation
      isTrial = true;
      if (typeof currentPlanData?.daysRemaining === "number") {
        trialDaysRemaining = Math.max(0, currentPlanData.daysRemaining);
      } else {
        // Calculate based on registration timestamp
        const createdRaw = (owner as any)?.createdAt;
        const createdTime = createdRaw ? new Date(createdRaw).getTime() : Date.now();
        const elapsedDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, 45 - elapsedDays);
      }

      if (currentPlanData?.expiresAt) {
        trialExpiresAt = new Date(currentPlanData.expiresAt);
      } else {
        const createdRaw = (owner as any)?.createdAt;
        const createdDate = createdRaw ? new Date(createdRaw) : new Date();
        trialExpiresAt = new Date(createdDate.getTime() + 45 * 24 * 60 * 60 * 1000);
      }

      if (status === "expired" || trialDaysRemaining <= 0) {
        isExpired = true;
        isTrial = false;
      }
    }

    const currentPlan: PlanType = isPaidPro
      ? "PRO"
      : isPaidLite
      ? "LITE"
      : !isExpired
      ? "LITE" // Trial grants Lite features
      : null;

    const planDisplayName = isPaidPro
      ? "Pro Plan"
      : isPaidLite
      ? "Lite Plan"
      : isTrial
      ? "Lite Plan (45-Day Trial)"
      : "Trial Expired";

    // Feature permission rules - if trial expired, all operations are restricted
    const canAddTenant = !isExpired;
    const canDeleteTenant = !isExpired;
    const canViewRentAnalytics = !isExpired;
    const canAddBuilding = !isExpired;
    const canTrackNotice = !isExpired;
    const canPerformOperations = !isExpired;

    // Lite features: direct UPI intent & manual verify
    const hasDirectUpiIntent = !isExpired;
    const hasManualPaymentVerify = !isExpired;

    // Pro features: automated gateway & subdomain website
    const hasAutomatedGateway = currentPlan === "PRO";
    const hasPgWebsite = currentPlan === "PRO";

    // Dedicated account manager is in all plans (Lite, Pro, and Trial)
    const hasDedicatedAccountManager = true;

    // Subdomain generation for Pro
    const ownerNameSlug = (owner?.name || "pg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const subdomainUrl = `${ownerNameSlug}.pgease.in`;

    return {
      currentPlan,
      planDisplayName,
      isTrial,
      trialDaysRemaining,
      trialExpiresAt,
      isExpired,
      canAddTenant,
      canDeleteTenant,
      canViewRentAnalytics,
      canAddBuilding,
      canTrackNotice,
      canPerformOperations,
      hasDirectUpiIntent,
      hasManualPaymentVerify,
      hasAutomatedGateway,
      hasPgWebsite,
      hasDedicatedAccountManager,
      subdomainUrl,
      isLoading: isPlanLoading || isFeaturesLoading,
    };
  }, [currentPlanData, featuresData, owner, isPlanLoading, isFeaturesLoading]);
}
