import { useMemo } from "react";
import { useEntitlements } from "./useEntitlements";
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
  hasGroupChat: boolean;
  subdomainUrl: string;
  isLoading: boolean;
  setDemoPlan: (mode: "trial" | "expired" | "pro" | "lite" | "reset") => void;
}

export function useSubscriptionAccess(): SubscriptionAccessInfo {
  const entitlements = useEntitlements();
  const owner = authStorage.getPropertyOwner();

  return useMemo(() => {
    const currentPlan: PlanType = entitlements.isExpired
      ? null
      : entitlements.isPro
      ? "PRO"
      : "LITE";

    // Operations are allowed during active trial or paid subscription
    const canPerformOperations = !entitlements.isExpired;
    const canAddTenant = canPerformOperations;
    const canDeleteTenant = canPerformOperations;
    const canViewRentAnalytics = true; // Read-only access preserved
    const canAddBuilding = canPerformOperations;
    const canTrackNotice = canPerformOperations;

    // Feature gates driven by entitlements
    const hasDirectUpiIntent = entitlements.hasFeature("direct_upi_collection");
    const hasManualPaymentVerify = entitlements.hasFeature("manual_payment_verify");
    const hasAutomatedGateway = entitlements.hasFeature("payment_gateway_collection");
    const hasPgWebsite = entitlements.hasFeature("pg_website");
    const hasDedicatedAccountManager = true;
    const hasGroupChat = entitlements.hasFeature("pg_group_chat");

    // Subdomain generation
    const ownerNameSlug = (owner?.name || "pg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const subdomainUrl = `${ownerNameSlug}.pgease.in`;

    return {
      currentPlan,
      planDisplayName: entitlements.planDisplayName,
      isTrial: entitlements.isTrial,
      trialDaysRemaining: entitlements.daysRemaining,
      trialExpiresAt: entitlements.trialExpiresAtDate,
      isExpired: entitlements.isExpired,
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
      hasGroupChat,
      subdomainUrl,
      isLoading: entitlements.isLoading,
      setDemoPlan: entitlements.setDemoPlan,
    };
  }, [entitlements, owner]);
}
