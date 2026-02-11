import { authStorage, httpRequest } from "./http";

const PROPERTY_OWNER_BASE = "/property-owners";

export interface RequestOtpResponse {
  message: string;
  expiresIn: number;
}

export interface PropertyOwner {
  id: string;
  name: string;
  email: string | null;
  mobileContactNumber: string;
  countryCode: string | null;
  kycInfo: unknown | null;
  language: string;
  bankDetails: unknown | null;
  createdBy: string;
  createdAt: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  propertyOwner: PropertyOwner;
  isNewUser: boolean;
  hasProperties: boolean;
  propertyCount: number;
}

export async function requestOtp(mobileNumber: string) {
  return httpRequest<RequestOtpResponse>(`${PROPERTY_OWNER_BASE}/otp/request`, {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

export async function verifyOtp(mobileNumber: string, otp: string) {
  const data = await httpRequest<VerifyOtpResponse>(`${PROPERTY_OWNER_BASE}/otp/verify`, {
    method: "POST",
    body: JSON.stringify({ mobileNumber, otp }),
  });

  authStorage.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    propertyOwner: data.propertyOwner,
  });

  return data;
}

export type SupportedLanguage = "hi-IN" | "en-US";

export async function updateLanguage(language: SupportedLanguage) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/language`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ language }),
  });
}

export interface CreatePropertyPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  locationPin: string;
  bedRange: string;
  propertyTypeId: string;
}

export interface PropertyResponse {
  id: string;
  propertyCode: string;
  propertyTypeId: string;
  propertyOwnerId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  locationPin: string;
  journeyCompletionPercentage: number;
  status: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// NOTE: propertyTypeId is currently fixed based on backend configuration.
export const DEFAULT_PROPERTY_TYPE_ID = "064a5796-04c0-42df-b0f1-1baa487cfd67";

export async function createProperty(payload: CreatePropertyPayload) {
  return httpRequest<PropertyResponse>(`${PROPERTY_OWNER_BASE}/properties`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

