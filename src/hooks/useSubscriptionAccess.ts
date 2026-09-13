import { useMemo, useState, useEffect, useCallback } from "react";
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
  setDemoPlan: (mode: "trial" | "expired" | "pro" | "reset") => void;
}

export function useSubscriptionAccess(): SubscriptionAccessInfo {
  const { data: currentPlanData, isLoading: isPlanLoading } = useCurrentPlan();
  const { data: featuresData, isLoading: isFeaturesLoading } = useMyFeaturesQuery();

  const [demoState, setDemoState] = useState<string | null>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has("expired") || sp.get("plan_status") === "expired") return "expired";
      if (sp.has("trial")) return "trial";
      if (sp.has("pro")) return "pro";
      return localStorage.getItem("pgease_demo_plan");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleDemoChange = (e: any) => {
      setDemoState(e.detail !== undefined ? e.detail : localStorage.getItem("pgease_demo_plan"));
    };
    window.addEventListener("pgease-demo-plan-change", handleDemoChange);
    return () => window.removeEventListener("pgease-demo-plan-change", handleDemoChange);
  }, []);

  const setDemoPlan = useCallback((mode: "trial" | "expired" | "pro" | "reset") => {
    if (mode === "reset") {
      localStorage.removeItem("pgease_demo_plan");
      setDemoState(null);
      window.dispatchEvent(new CustomEvent("pgease-demo-plan-change", { detail: null }));
    } else {
      localStorage.setItem("pgease_demo_plan", mode);
      setDemoState(mode);
      window.dispatchEvent(new CustomEvent("pgease-demo-plan-change", { detail: mode }));
    }
  }, []);

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

    // Apply demo simulation overrides if active
    if (demoState === "expired") {
      isExpired = true;
      isTrial = false;
      trialDaysRemaining = 0;
    } else if (demoState === "trial") {
      isExpired = false;
      isTrial = true;
      trialDaysRemaining = 18;
      trialExpiresAt = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000);
    } else if (demoState === "pro") {
      isExpired = false;
      isTrial = false;
      trialDaysRemaining = 0;
    }

    const currentPlan: PlanType = (demoState === "pro" || isPaidPro)
      ? "PRO"
      : (demoState === "trial" || isPaidLite || (!isExpired && !demoState))
      ? "LITE"
      : null;

    const planDisplayName = currentPlan === "PRO"
      ? "Pro Plan"
      : isExpired
      ? "Trial Expired"
      : isTrial || demoState === "trial"
      ? `Lite Plan (${trialDaysRemaining}-Day Trial)`
      : isPaidLite
      ? "Lite Plan"
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
      setDemoPlan,
    };
  }, [currentPlanData, featuresData, owner, isPlanLoading, isFeaturesLoading, demoState, setDemoPlan]);
}
