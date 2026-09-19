import { useMemo, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentPlan, useMyFeaturesQuery, queryKeys } from "./usePropertyOwnerQueries";
import { authStorage } from "@/api/http";

export type SubscriptionStatus = "TRIAL" | "LITE" | "PRO" | "EXPIRED";

export interface EntitlementsInfo {
  /** Normalized subscription status driven by API */
  status: SubscriptionStatus;
  /** Name of plan, e.g. "Pro Trial", "Lite", "Pro", "Trial Expired" */
  planName: string;
  /** User-friendly display name */
  planDisplayName: string;
  /** True if currently in 45-day Pro trial */
  isTrial: boolean;
  /** True if trial has elapsed and no active paid plan exists */
  isExpired: boolean;
  /** True if user has active Pro entitlement (includes Pro Trial) */
  isPro: boolean;
  /** True if user is on active paid Lite plan */
  isLite: boolean;
  /** Days remaining in trial or subscription */
  daysRemaining: number;
  /** Trial expiration date string or null */
  trialEndsAt: string | null;
  /** Formatted date for expiration */
  trialExpiresAtDate: Date | null;
  /** Effective price per bed (₹29 Lite, ₹49 Pro) */
  pricePerBed: number;
  /** Key-value dictionary of all features */
  featuresMap: Record<string, boolean>;
  /** Check if a feature key is enabled for this owner */
  hasFeature: (featureKey: string) => boolean;
  /** Whether feature or plan queries are actively loading */
  isLoading: boolean;
  /** Refetch all entitlement queries from the server */
  refetch: () => Promise<void>;
  /** Demo simulation switcher for QA/Testing */
  setDemoPlan: (mode: "trial" | "expired" | "pro" | "reset") => void;
}

/** Standard aliases for feature keys to bridge snake_case and legacy camel/UPPERCASE */
const FEATURE_ALIASES: Record<string, string> = {
  // WhatsApp
  whatsapp_automation: "whatsapp_automation",
  whatsapp_reminders: "whatsapp_automation",
  WHATSAPP_AUTOMATION: "whatsapp_automation",
  WHATSAPP_REMINDERS: "whatsapp_automation",

  // Payment Gateway
  payment_gateway_collection: "payment_gateway_collection",
  payment_gateway_auto: "payment_gateway_collection",
  automated_payment_gateway: "payment_gateway_collection",
  PAYMENT_GATEWAY_COLLECTION: "payment_gateway_collection",
  PAYMENT_GATEWAY_AUTO: "payment_gateway_collection",

  // Direct UPI
  direct_upi_collection: "direct_upi_collection",
  direct_upi_intent: "direct_upi_collection",
  upi_intent_direct: "direct_upi_collection",
  DIRECT_UPI_COLLECTION: "direct_upi_collection",
  UPI_INTENT_DIRECT: "direct_upi_collection",

  // Manual payment verify
  manual_payment_verify: "manual_payment_verify",
  MANUAL_PAYMENT_VERIFY: "manual_payment_verify",

  // PG Website
  pg_website: "pg_website",
  pg_subdomain_website: "pg_website",
  PG_WEBSITE: "pg_website",

  // eSign
  rental_agreement_esign: "rental_agreement_esign",
  digital_agreement: "rental_agreement_esign",
  RENTAL_AGREEMENT: "rental_agreement_esign",
  DIGITAL_AGREEMENT: "rental_agreement_esign",

  // KYC
  aadhaar_kyc: "aadhaar_kyc",
  kyc_verification: "aadhaar_kyc",
  AADHAAR_KYC: "aadhaar_kyc",
  KYC_VERIFICATION: "aadhaar_kyc",

  // Lead CRM
  lead_crm: "lead_crm",
  LEAD_CRM: "lead_crm",

  // Analytics
  advanced_reports: "advanced_reports",
  advanced_analytics: "advanced_reports",
  ADVANCED_ANALYTICS: "advanced_reports",

  // Tenant Operations
  tenant_add: "tenant_add",
  TENANT_ADD: "tenant_add",
  room_structure: "room_structure",
  ROOM_STRUCTURE: "room_structure",
  electricity_dues: "electricity_dues",
  ELECTRICITY_DUES: "electricity_dues",
  complaints_desk: "complaints_desk",
  COMPLAINTS_DESK: "complaints_desk",
  dedicated_account_manager: "dedicated_account_manager",
  DEDICATED_ACCOUNT_MANAGER: "dedicated_account_manager",
};

/** Features that remain accessible even when trial has expired (Zero Data Loss) */
const EXPIRED_READONLY_ALLOWED_FEATURES = new Set([
  "tenant_view",
  "room_view",
  "complaint_view",
  "account_view_dues",
  "dedicated_account_manager",
]);

/** Pro-only features that Lite does not have */
const PRO_EXCLUSIVE_FEATURES = new Set([
  "payment_gateway_collection",
  "automated_settlement",
  "pg_website",
  "rental_agreement_esign",
  "whatsapp_automation",
  "staff_roles_permissions",
  "multi_property_dashboard",
  "auto_receipt_generation",
  "late_fee_rules",
  "custom_branding",
  "api_access_webhooks",
  "broadcast_announcements",
]);

export function useEntitlements(): EntitlementsInfo {
  const qc = useQueryClient();
  const { data: featuresData, isLoading: isFeaturesLoading, refetch: refetchFeatures } = useMyFeaturesQuery();
  const { data: currentPlanData, isLoading: isPlanLoading, refetch: refetchPlan } = useCurrentPlan();

  // Demo simulation state
  const [demoState, setDemoState] = useState<string | null>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has("expired") || sp.get("plan_status") === "expired") return "expired";
      if (sp.has("trial")) return "trial";
      if (sp.has("pro")) return "pro";
      if (sp.has("lite")) return "lite";
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
    // 1. Resolve normalized status from API
    let rawStatus: SubscriptionStatus = "TRIAL";

    const apiSub = featuresData?.subscription || currentPlanData?.subscription;
    if (apiSub?.status) {
      rawStatus = apiSub.status;
    } else {
      // Evaluate from currentPlanData or featuresData
      const planNameStr = (featuresData?.planName || currentPlanData?.currentPlan?.name || "").toLowerCase();
      const statusStr = (currentPlanData?.subscriptionStatus || "").toLowerCase();

      if (statusStr === "expired") {
        rawStatus = "EXPIRED";
      } else if (planNameStr.includes("pro") && (statusStr === "active" || statusStr === "pro")) {
        rawStatus = "PRO";
      } else if (planNameStr.includes("lite") && (statusStr === "active" || statusStr === "lite")) {
        rawStatus = "LITE";
      } else {
        rawStatus = "TRIAL";
      }
    }

    // 2. Resolve trial days and dates
    let daysRemaining = 45;
    let trialEndsAt: string | null = null;
    let trialExpiresAtDate: Date | null = null;

    if (apiSub?.daysRemaining !== undefined && apiSub.daysRemaining !== null) {
      daysRemaining = Math.max(0, apiSub.daysRemaining);
    } else if (typeof currentPlanData?.daysRemaining === "number") {
      daysRemaining = Math.max(0, currentPlanData.daysRemaining);
    } else {
      const createdRaw = (owner as any)?.createdAt;
      const createdTime = createdRaw ? new Date(createdRaw).getTime() : Date.now();
      const elapsedDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, 45 - elapsedDays);
    }

    if (apiSub?.trialEndsAt) {
      trialEndsAt = apiSub.trialEndsAt;
      trialExpiresAtDate = new Date(apiSub.trialEndsAt);
    } else if (currentPlanData?.expiresAt) {
      trialEndsAt = currentPlanData.expiresAt;
      trialExpiresAtDate = new Date(currentPlanData.expiresAt);
    } else {
      const createdRaw = (owner as any)?.createdAt;
      const createdDate = createdRaw ? new Date(createdRaw) : new Date();
      trialExpiresAtDate = new Date(createdDate.getTime() + 45 * 24 * 60 * 60 * 1000);
      trialEndsAt = trialExpiresAtDate.toISOString();
    }

    // If trial is computed with 0 days and not on paid plan, status is EXPIRED
    if (rawStatus === "TRIAL" && daysRemaining <= 0) {
      rawStatus = "EXPIRED";
    }

    // 3. Apply demo overrides if active
    if (demoState === "expired") {
      rawStatus = "EXPIRED";
      daysRemaining = 0;
    } else if (demoState === "trial") {
      rawStatus = "TRIAL";
      daysRemaining = 24;
      trialExpiresAtDate = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000);
      trialEndsAt = trialExpiresAtDate.toISOString();
    } else if (demoState === "pro") {
      rawStatus = "PRO";
      daysRemaining = 0;
    } else if (demoState === "lite") {
      rawStatus = "LITE";
      daysRemaining = 0;
    }

    const isTrial = rawStatus === "TRIAL";
    const isExpired = rawStatus === "EXPIRED";
    const isPro = rawStatus === "PRO" || rawStatus === "TRIAL"; // Trial gets full Pro features
    const isLite = rawStatus === "LITE";

    const planName = isTrial
      ? "Pro Trial"
      : rawStatus === "PRO"
      ? "Pro Plan"
      : rawStatus === "LITE"
      ? "Lite Plan"
      : "Trial Expired";

    const planDisplayName = isTrial
      ? "Pro Trial"
      : rawStatus === "PRO"
      ? "Pro Plan"
      : rawStatus === "LITE"
      ? "Lite Plan"
      : "Trial Expired";

    const pricePerBed = isPro ? 49 : 29;

    // 4. Build normalized features map
    const featuresMap: Record<string, boolean> = {};

    // Ingest from API featuresMap if returned
    if (featuresData?.featuresMap && typeof featuresData.featuresMap === "object") {
      Object.entries(featuresData.featuresMap).forEach(([k, v]) => {
        const canonical = FEATURE_ALIASES[k] || k.toLowerCase().replace(/-/g, "_");
        featuresMap[canonical] = Boolean(v);
        featuresMap[k] = Boolean(v);
      });
    }

    // Ingest from API features list
    if (Array.isArray(featuresData?.features)) {
      featuresData.features.forEach((f) => {
        const key = f.featureKey;
        if (key) {
          const canonical = FEATURE_ALIASES[key] || key.toLowerCase().replace(/-/g, "_");
          featuresMap[canonical] = true;
          featuresMap[key] = true;
        }
      });
    }

    // 5. Feature checker function
    const hasFeature = (key: string): boolean => {
      if (!key) return true;
      const canonical = FEATURE_ALIASES[key] || key.toLowerCase().replace(/-/g, "_");

      // In Expired mode: read-only access is preserved, premium actions locked
      if (isExpired) {
        if (EXPIRED_READONLY_ALLOWED_FEATURES.has(canonical)) return true;
        return false;
      }

      // If backend explicitly returned a map entry for this key
      if (featuresMap[canonical] !== undefined) {
        return featuresMap[canonical];
      }
      if (featuresMap[key] !== undefined) {
        return featuresMap[key];
      }

      // Pro trial or paid Pro has all features
      if (isPro) {
        return true;
      }

      // Lite plan has all features except Pro-exclusive ones
      if (isLite) {
        return !PRO_EXCLUSIVE_FEATURES.has(canonical);
      }

      return false;
    };

    const refetch = async () => {
      await Promise.all([
        refetchFeatures(),
        refetchPlan(),
        qc.invalidateQueries({ queryKey: queryKeys.myFeatures() }),
        qc.invalidateQueries({ queryKey: ["currentPlan"] }),
      ]);
    };

    return {
      status: rawStatus,
      planName,
      planDisplayName,
      isTrial,
      isExpired,
      isPro,
      isLite,
      daysRemaining,
      trialEndsAt,
      trialExpiresAtDate,
      pricePerBed,
      featuresMap,
      hasFeature,
      isLoading: isFeaturesLoading || isPlanLoading,
      refetch,
      setDemoPlan,
    };
  }, [featuresData, currentPlanData, owner, isFeaturesLoading, isPlanLoading, demoState, setDemoPlan, qc, refetchFeatures, refetchPlan]);
}
