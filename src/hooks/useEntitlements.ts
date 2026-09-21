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
  setDemoPlan: (mode: "trial" | "expired" | "pro" | "lite" | "reset") => void;
}

/** Canonical feature equivalence groups bridging frontend navigation keys and backend DB catalog keys */
const FEATURE_EQUIVALENCE_GROUPS: string[][] = [
  // Notice Period Tracker
  ["notice_period_tracker", "notice_period_management", "notice_period"],

  // Digital Notice Board / Property Notices
  ["digital_notice_board", "pg_notices", "property_notices", "notices", "notice_board"],

  // Food Menu / Dining
  ["food_menu_planner", "food_menu", "meal_tracking", "food_dining", "dining_schedule"],

  // Guest Log & Nightout Passes
  ["nightout_guest_requests", "guest_tracking", "guest_history", "guest_log", "nightout_passes"],

  // Staff & Team Roles / Permissions
  ["staff_roles_permissions", "staff_management", "staff_basic_access", "staff_granular_permissions", "team_members"],

  // KYC Verification
  ["aadhaar_kyc", "digital_kyc", "kyc_verification", "police_verification"],

  // Leads CRM & Tenant Discovery
  ["lead_crm", "tenant_invite_link", "tenant_pg_discovery", "lead_management", "leads_visits"],

  // WiFi Management
  ["wifi_management", "wifi", "wifi_portal"],

  // Expenses Ledger
  ["expense_tracking", "expenses_ledger", "expense_management", "expenses"],

  // Activity Audit Logs
  ["audit_logs", "activity_audit_logs", "property_activity_logs", "audit_trail"],

  // WhatsApp Automation
  ["whatsapp_automation", "whatsapp_reminders", "whatsapp_rent_reminders", "whatsapp_payment_notifications", "whatsapp_tenant_notifications"],

  // Payment Gateway
  ["payment_gateway_collection", "payment_gateway_auto", "automated_payment_gateway", "automated_payment_collection", "payment_links"],

  // Direct UPI
  ["direct_upi_collection", "direct_upi_intent", "upi_intent_direct"],

  // PG Website
  ["pg_website", "pg_subdomain_website", "pg_subdomain", "pg_public_listing"],

  // Agreement & eSign
  ["rental_agreement_esign", "digital_agreement", "rental_agreement", "agreement_document_vault"],

  // Advanced Reports & Analytics
  ["advanced_reports", "advanced_analytics", "financial_reports", "occupancy_reports", "collection_reports"],

  // Core PG Operations
  ["pg_management", "pg_profile", "floor_management", "room_management", "bed_management", "occupancy_dashboard", "vacancy_dashboard"],
  ["tenant_management", "tenant_add", "manual_tenant_add", "bulk_tenant_import", "tenant_room_mapping", "tenant_profile", "tenant_history", "tenant_app_access"],
  ["rent_management", "manual_rent_tracking", "manual_payment_verify", "rent_receipts", "rent_history", "payment_history", "security_deposit_tracking", "late_fee_management"],
  ["complaint_management", "complaints_desk", "food_complaints", "complaint_assignment", "complaint_threading", "complaint_transfer"],
];

const FEATURE_ALIASES: Record<string, string> = {};
const SYNONYMS_MAP: Record<string, string[]> = {};

FEATURE_EQUIVALENCE_GROUPS.forEach((group) => {
  const canonical = group[0];
  group.forEach((item) => {
    FEATURE_ALIASES[item] = canonical;
    FEATURE_ALIASES[item.toUpperCase()] = canonical;
    SYNONYMS_MAP[item] = group;
    SYNONYMS_MAP[item.toUpperCase()] = group;
  });
});

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
  "notice_period_tracker",
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

  const setDemoPlan = useCallback((mode: "trial" | "expired" | "pro" | "lite" | "reset") => {
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

    const apiPayload = (featuresData as any)?.data || featuresData;
    const apiSub = apiPayload?.subscription || currentPlanData?.subscription;
    if (apiSub?.status) {
      rawStatus = apiSub.status;
    } else {
      // Evaluate from currentPlanData or apiPayload
      const planNameStr = (apiPayload?.planName || currentPlanData?.currentPlan?.name || "").toLowerCase();
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

    const registerFeature = (k: string, v: boolean) => {
      const normalizedKey = k.toLowerCase().replace(/-/g, "_");
      featuresMap[normalizedKey] = v;
      featuresMap[k] = v;
      const canonical = FEATURE_ALIASES[normalizedKey] || FEATURE_ALIASES[k];
      if (canonical) {
        featuresMap[canonical] = v;
      }
      const synonyms = SYNONYMS_MAP[normalizedKey] || SYNONYMS_MAP[k] || (canonical ? SYNONYMS_MAP[canonical] : []) || [];
      synonyms.forEach((syn) => {
        featuresMap[syn] = v;
        featuresMap[syn.toLowerCase()] = v;
        featuresMap[syn.toUpperCase()] = v;
      });
    };

    // Ingest from API featuresMap if returned
    if (apiPayload?.featuresMap && typeof apiPayload.featuresMap === "object") {
      Object.entries(apiPayload.featuresMap).forEach(([k, v]) => {
        registerFeature(k, Boolean(v));
      });
    }

    // Ingest from API features list
    if (Array.isArray(apiPayload?.features)) {
      apiPayload.features.forEach((f: any) => {
        const key = f.featureKey || f.key;
        if (key) {
          registerFeature(key, true);
        }
      });
    }

    const hasLoadedFromApi =
      Boolean(apiPayload) &&
      (Array.isArray(apiPayload?.features) ||
        (apiPayload?.featuresMap && Object.keys(apiPayload.featuresMap).length > 0));

    // 5. Feature checker function
    const hasFeature = (key: string): boolean => {
      if (!key) return true;
      const normalized = key.toLowerCase().replace(/-/g, "_");
      const canonical = FEATURE_ALIASES[normalized] || normalized;

      // In Expired mode: read-only access is preserved, premium actions locked
      if (isExpired) {
        if (EXPIRED_READONLY_ALLOWED_FEATURES.has(canonical) || EXPIRED_READONLY_ALLOWED_FEATURES.has(normalized)) {
          return true;
        }
        return false;
      }

      // If user is on Lite Plan (active subscription or selected demo):
      // Pro-exclusive features MUST be locked!
      if (isLite && (PRO_EXCLUSIVE_FEATURES.has(canonical) || PRO_EXCLUSIVE_FEATURES.has(normalized))) {
        return false;
      }

      // If backend explicitly returned feature entitlements for this owner/plan
      if (hasLoadedFromApi) {
        if (featuresMap[canonical] !== undefined) {
          return Boolean(featuresMap[canonical]);
        }
        if (featuresMap[normalized] !== undefined) {
          return Boolean(featuresMap[normalized]);
        }
        if (featuresMap[key] !== undefined) {
          return Boolean(featuresMap[key]);
        }
        const synonyms = SYNONYMS_MAP[canonical] || SYNONYMS_MAP[normalized] || [];
        for (const syn of synonyms) {
          if (featuresMap[syn] !== undefined) {
            return Boolean(featuresMap[syn]);
          }
        }

        // Specifically for features that the Admin turned off in the Pro plan:
        // Notice Period Tracker was explicitly toggled off by the Admin:
        if (canonical === "notice_period_tracker" || normalized.includes("notice_period")) {
          return false;
        }

        // Pro tier includes standard PG operations:
        if (isPro) {
          return true;
        }
        if (isLite) {
          return !PRO_EXCLUSIVE_FEATURES.has(canonical);
        }

        return false;
      }

      // Offline / loading fallback only before API responds:
      if (isPro) {
        return true;
      }
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
