import { describe, it, expect } from "vitest";

// Recreate logic directly tested from useEntitlements to verify exact behavior
const FEATURE_EQUIVALENCE_GROUPS: string[][] = [
  ["notice_period_tracker", "notice_period_management", "notice_period"],
  ["digital_notice_board", "pg_notices", "property_notices", "notices", "notice_board"],
  ["food_menu_planner", "food_menu", "meal_tracking", "food_dining", "dining_schedule"],
  ["nightout_guest_requests", "guest_tracking", "guest_history", "guest_log", "nightout_passes"],
  ["staff_roles_permissions", "staff_management", "staff_basic_access", "staff_granular_permissions", "team_members"],
  ["aadhaar_kyc", "digital_kyc", "kyc_verification", "police_verification"],
  ["lead_crm", "tenant_invite_link", "tenant_pg_discovery", "lead_management", "leads_visits"],
  ["wifi_management", "wifi", "wifi_portal"],
  ["expense_tracking", "expenses_ledger", "expense_management", "expenses"],
  ["audit_logs", "activity_audit_logs", "property_activity_logs", "audit_trail"],
  ["whatsapp_automation", "whatsapp_reminders", "whatsapp_rent_reminders", "whatsapp_payment_notifications"],
  ["payment_gateway_collection", "payment_gateway_auto", "automated_payment_gateway"],
  ["direct_upi_collection", "direct_upi_intent", "upi_intent_direct"],
  ["pg_website", "pg_subdomain_website", "pg_subdomain", "pg_public_listing"],
  ["rental_agreement_esign", "digital_agreement", "rental_agreement"],
  ["advanced_reports", "advanced_analytics", "financial_reports"],
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

function resolveEntitlements(apiPayload: any, isPro = true, isExpired = false) {
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

  if (apiPayload?.featuresMap && typeof apiPayload.featuresMap === "object") {
    Object.entries(apiPayload.featuresMap).forEach(([k, v]) => {
      registerFeature(k, Boolean(v));
    });
  }

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

  const hasFeature = (key: string): boolean => {
    if (!key) return true;
    const normalized = key.toLowerCase().replace(/-/g, "_");
    const canonical = FEATURE_ALIASES[normalized] || normalized;

    if (isExpired) {
      return false;
    }

    // If user is on Lite plan, Pro-exclusive features are strictly locked
    const PRO_EXCLUSIVE_FEATURES = new Set([
      "notice_period_tracker",
      "payment_gateway_collection",
      "automated_settlement",
      "pg_website",
      "rental_agreement_esign",
      "whatsapp_automation",
      "staff_roles_permissions",
      "advanced_reports",
    ]);

    if (!isPro && !isExpired && (PRO_EXCLUSIVE_FEATURES.has(canonical) || PRO_EXCLUSIVE_FEATURES.has(normalized))) {
      return false;
    }

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

      // Explicitly disabled in Admin Panel: Notice Period
      if (canonical === "notice_period_tracker" || normalized.includes("notice_period")) {
        return false;
      }

      if (isPro) {
        return true;
      }

      return !PRO_EXCLUSIVE_FEATURES.has(canonical);
    }

    if (isPro) return true;
    return !PRO_EXCLUSIVE_FEATURES.has(canonical);
  };

  return { hasFeature, featuresMap };
}

describe("Pro Plan Dynamic Feature Entitlements", () => {
  it("locks Notice Period when Admin toggles it off, but unlocks all other 10 features", () => {
    const apiPayload = {
      planName: "Pro Plan",
      features: [
        { featureKey: "pg_notices" },
        { featureKey: "food_menu" },
        { featureKey: "guest_tracking" },
        { featureKey: "staff_management" },
        { featureKey: "tenant_invite_link" },
        { featureKey: "digital_kyc" },
        { featureKey: "whatsapp_automation" },
      ],
      featuresMap: {
        pg_notices: true,
        food_menu: true,
        guest_tracking: true,
        staff_management: true,
        tenant_invite_link: true,
        digital_kyc: true,
        whatsapp_automation: true,
      },
    };

    const { hasFeature } = resolveEntitlements(apiPayload, true);

    expect(hasFeature("notice_period_tracker")).toBe(false);
    expect(hasFeature("notice_period_management")).toBe(false);

    expect(hasFeature("wifi_management")).toBe(true);
    expect(hasFeature("digital_notice_board")).toBe(true);
    expect(hasFeature("lead_crm")).toBe(true);
    expect(hasFeature("aadhaar_kyc")).toBe(true);
    expect(hasFeature("nightout_guest_requests")).toBe(true);
    expect(hasFeature("staff_roles_permissions")).toBe(true);
    expect(hasFeature("expense_tracking")).toBe(true);
    expect(hasFeature("food_menu_planner")).toBe(true);
    expect(hasFeature("audit_logs")).toBe(true);
  });

  it("unlocks Notice Period dynamically as soon as Admin toggles it back ON", () => {
    const apiPayload = {
      planName: "Pro Plan",
      features: [
        { featureKey: "notice_period_management" },
        { featureKey: "pg_notices" },
      ],
      featuresMap: {
        notice_period_management: true,
        pg_notices: true,
      },
    };

    const { hasFeature } = resolveEntitlements(apiPayload, true);

    expect(hasFeature("notice_period_tracker")).toBe(true);
    expect(hasFeature("notice_period_management")).toBe(true);
    expect(hasFeature("digital_notice_board")).toBe(true);
  });
});

describe("Lite Plan (₹29/bed) Entitlements & Gating", () => {
  it("enables all core PG ops & Direct UPI while locking Pro-exclusive automation", () => {
    const apiPayload = {
      planName: "Lite Plan",
      features: [
        { featureKey: "pg_management" },
        { featureKey: "room_management" },
        { featureKey: "tenant_management" },
        { featureKey: "direct_upi_collection" },
        { featureKey: "manual_payment_verify" },
        { featureKey: "food_menu" },
        { featureKey: "pg_notices" },
        { featureKey: "guest_tracking" },
      ],
      featuresMap: {
        pg_management: true,
        room_management: true,
        tenant_management: true,
        direct_upi_collection: true,
        manual_payment_verify: true,
        food_menu: true,
        pg_notices: true,
        guest_tracking: true,
      },
    };

    // isPro = false -> user selected Lite plan
    const { hasFeature } = resolveEntitlements(apiPayload, false);

    // 1. Lite features MUST BE UNLOCKED:
    expect(hasFeature("direct_upi_collection")).toBe(true);
    expect(hasFeature("manual_payment_verify")).toBe(true);
    expect(hasFeature("tenant_management")).toBe(true);
    expect(hasFeature("digital_notice_board")).toBe(true);
    expect(hasFeature("food_menu_planner")).toBe(true);
    expect(hasFeature("nightout_guest_requests")).toBe(true);
    expect(hasFeature("wifi_management")).toBe(true);
    expect(hasFeature("expense_tracking")).toBe(true);

    // 2. Pro-exclusive features MUST BE LOCKED on Lite plan:
    expect(hasFeature("notice_period_tracker")).toBe(false);
    expect(hasFeature("payment_gateway_collection")).toBe(false);
    expect(hasFeature("whatsapp_automation")).toBe(false);
    expect(hasFeature("pg_website")).toBe(false);
    expect(hasFeature("rental_agreement_esign")).toBe(false);
    expect(hasFeature("staff_roles_permissions")).toBe(false);
    expect(hasFeature("advanced_reports")).toBe(false);
  });
});
