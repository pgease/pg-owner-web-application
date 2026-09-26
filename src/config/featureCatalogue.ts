export interface FeatureDefinition {
  key: string;
  name: string;
  module: string;
  description: string;
  defaultEnabledOnLite?: boolean;
  defaultEnabledOnPro?: boolean;
}

/**
 * PGEASE Canonical Feature Catalogue
 * Central Single Source of Truth for all PG Owner Web & Mobile application feature keys.
 * 
 * Rules for feature_key:
 * - lowercase
 * - snake_case
 * - no spaces
 * - unique
 * - stable
 * - case-sensitive
 */
export const FEATURE_CATALOGUE: Record<string, FeatureDefinition> = {
  dashboard: {
    key: "dashboard",
    name: "Dashboard",
    module: "Core",
    description: "Main PG operations dashboard and vacancy overview",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  property_management: {
    key: "property_management",
    name: "Property Management",
    module: "Property",
    description: "Property profile, floor structures, rooms, and bed configurations",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  tenant_management: {
    key: "tenant_management",
    name: "Tenant Management",
    module: "Tenant",
    description: "Tenant onboarding, room allocation, directory, and history",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  rent_collection: {
    key: "rent_collection",
    name: "Rent Collection",
    module: "Rent",
    description: "Rent dues tracking, payment recording, and collection management",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  rent_receipts: {
    key: "rent_receipts",
    name: "Rent Receipts",
    module: "Rent",
    description: "Automated rent payment receipt generation and sharing",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  direct_upi_intent: {
    key: "direct_upi_intent",
    name: "Direct UPI Collection",
    module: "Rent",
    description: "0% transaction fee direct UPI intent payment collection",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  payment_gateway_collection: {
    key: "payment_gateway_collection",
    name: "Automated Payment Gateway",
    module: "Rent",
    description: "Automated credit/debit card, netbanking, and payment link collection",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  lead_crm: {
    key: "lead_crm",
    name: "Leads CRM & Tenant Discovery",
    module: "CRM",
    description: "Prospective tenant leads tracking, visit schedules, and invite links",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  aadhaar_kyc: {
    key: "aadhaar_kyc",
    name: "Aadhaar KYC Verification",
    module: "Verification",
    description: "DigiLocker instant Aadhaar verification for onboarded tenants",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  police_verification: {
    key: "police_verification",
    name: "Police Verification",
    module: "Verification",
    description: "Digital police verification form submission and status tracking",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  notice_period_tracker: {
    key: "notice_period_tracker",
    name: "Notice Period Tracker",
    module: "Tenant",
    description: "Tenant move-out notice period tracking and bed availability calendar",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  digital_notice_board: {
    key: "digital_notice_board",
    name: "Digital Notice Board",
    module: "Property",
    description: "PG digital notice board for announcements and rules",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  food_menu_planner: {
    key: "food_menu_planner",
    name: "Food & Dining",
    module: "Operations",
    description: "Weekly mess menu schedule planner and meal complaint desk",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  nightout_guest_requests: {
    key: "nightout_guest_requests",
    name: "Guest Log & Night Out Passes",
    module: "Operations",
    description: "Visitor sign-in log and tenant night-out pass request approvals",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  staff_roles_permissions: {
    key: "staff_roles_permissions",
    name: "Staff Roles & Permissions",
    module: "Team",
    description: "Staff team members list, role assignments, and permission matrix",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  wifi_management: {
    key: "wifi_management",
    name: "WiFi Management",
    module: "Property",
    description: "PG WiFi credentials and voucher management",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  expense_tracking: {
    key: "expense_tracking",
    name: "Expenses Ledger",
    module: "Rent",
    description: "Operational expense tracking, vendor payments, and category ledgers",
    defaultEnabledOnLite: true,
    defaultEnabledOnPro: true,
  },
  audit_logs: {
    key: "audit_logs",
    name: "Activity Audit Logs",
    module: "Audit",
    description: "Detailed system audit logs for all owner and staff actions",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  whatsapp_notifications: {
    key: "whatsapp_notifications",
    name: "WhatsApp Notifications",
    module: "Communication",
    description: "Automated WhatsApp rent payment reminders and receipts",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  pg_subdomain_website: {
    key: "pg_subdomain_website",
    name: "PG Website",
    module: "Listing",
    description: "Dedicated public PG website ({pgname}.pgease.in)",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  rental_agreement_esign: {
    key: "rental_agreement_esign",
    name: "Rental Agreement eSign",
    module: "Legal",
    description: "Digital rental agreement template creation and eSigning",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  advanced_reports: {
    key: "advanced_reports",
    name: "Advanced Reports & Analytics",
    module: "Reports",
    description: "Financial, occupancy, collection, and tax report exports",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
  pg_group_chat: {
    key: "pg_group_chat",
    name: "PG Group Chat",
    module: "Communication",
    description: "Private resident & management group chat channel",
    defaultEnabledOnLite: false,
    defaultEnabledOnPro: true,
  },
};

export const FEATURE_KEYS = Object.keys(FEATURE_CATALOGUE);

export function getFeatureDefinition(key: string): FeatureDefinition | undefined {
  if (!key) return undefined;
  const canonicalKey = key.toLowerCase().replace(/-/g, "_");
  return FEATURE_CATALOGUE[canonicalKey] || FEATURE_CATALOGUE[key];
}

export function getAllFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_CATALOGUE);
}
