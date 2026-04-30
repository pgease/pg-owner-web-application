import { httpRequest } from "./http";

export interface OwnerContentPage {
  title: string;
  body: string;
  updatedAt?: string;
}

const API_ENABLED = import.meta.env.VITE_OWNER_CONTENT_API_ENABLED === "true";
const OWNER_BASE = "/property-owners/content";

const FALLBACK_CONTENT: Record<"privacy-policy" | "terms-and-conditions" | "contact-us", OwnerContentPage> = {
  "privacy-policy": {
    title: "Privacy Policy",
    updatedAt: "Draft",
    body:
      "We are preparing the final Privacy Policy content. Once API is ready, this page will be loaded dynamically from backend content APIs.\n\n" +
      "For now:\n" +
      "- Your account data stays restricted to authenticated users.\n" +
      "- Access tokens are required for protected APIs.\n" +
      "- Contact support for data correction or account removal requests.",
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    updatedAt: "Draft",
    body:
      "Terms & Conditions content will be served from API as soon as backend endpoints are available.\n\n" +
      "For now:\n" +
      "- Platform usage is restricted to authorized property owners/staff.\n" +
      "- Credentials must be kept secure by account users.\n" +
      "- Product features may evolve over time based on plan and release updates.",
  },
  "contact-us": {
    title: "Contact Us",
    updatedAt: "Draft",
    body:
      "Contact channels will be managed through API content.\n\n" +
      "Current support:\n" +
      "- Email: support@pgease.in\n" +
      "- Response window: Mon-Sat, business hours\n" +
      "- In-app support center: coming soon",
  },
};

async function fetchContent(slug: "privacy-policy" | "terms-and-conditions" | "contact-us") {
  if (!API_ENABLED) {
    return FALLBACK_CONTENT[slug];
  }
  const data = await httpRequest<OwnerContentPage>(`${OWNER_BASE}/${slug}`, {
    method: "GET",
    auth: true,
  });
  return data;
}

export function getPrivacyPolicy() {
  return fetchContent("privacy-policy");
}

export function getTermsAndConditions() {
  return fetchContent("terms-and-conditions");
}

export function getContactUs() {
  return fetchContent("contact-us");
}
