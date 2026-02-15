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
    body: { mobileNumber },
  });
}

export async function verifyOtp(mobileNumber: string, otp: string) {
  const data = await httpRequest<VerifyOtpResponse>(`${PROPERTY_OWNER_BASE}/otp/verify`, {
    method: "POST",
    body: { mobileNumber, otp },
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
    body: { language },
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
    body: payload,
  });
}

export async function getProperties() {
  return httpRequest<PropertyResponse[]>(`${PROPERTY_OWNER_BASE}/properties`, {
    method: "GET",
    auth: true,
  });
}

// Refresh Token
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshToken(refreshTokenValue: string) {
  const data = await httpRequest<RefreshTokenResponse>(`${PROPERTY_OWNER_BASE}/refresh-token`, {
    method: "POST",
    body: { refreshToken: refreshTokenValue },
  });

  authStorage.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

// Get Current User (Me)
export async function getMe() {
  return httpRequest<PropertyOwner>(`${PROPERTY_OWNER_BASE}/me`, {
    method: "GET",
    auth: true,
  });
}

// Upload Photo
export async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.append("photo", file);

  return httpRequest<{ url: string }>(`${PROPERTY_OWNER_BASE}/upload-photo`, {
    method: "POST",
    auth: true,
    body: formData,
  });
}

// Property Types and Amenities
export interface PropertyType {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  scope: string;
}

export interface PropertyTypeAndAmenitiesResponse {
  propertyTypes: PropertyType[];
  amenities: Amenity[];
}

export async function getPropertyTypesAndAmenities() {
  return httpRequest<PropertyTypeAndAmenitiesResponse>(`${PROPERTY_OWNER_BASE}/property-type-and-amenities`, {
    method: "GET",
    auth: true,
  });
}

// My Features
export interface Feature {
  id: string;
  featureKey: string;
  name: string;
  description: string;
  category: string;
  displayOrder: number;
  active: boolean;
}

export async function getMyFeatures() {
  return httpRequest<Feature[]>(`${PROPERTY_OWNER_BASE}/my-features`, {
    method: "GET",
    auth: true,
  });
}

// Tenant APIs
export interface CheckRoomAvailabilityParams {
  propertyId: string;
  floorNumber?: string;
  block?: string;
  roomNumber?: number;
  bedNumber?: string;
}

export interface RoomAvailabilityResponse {
  available: boolean;
  message?: string;
}

export async function checkRoomAvailability(propertyId: string, params?: CheckRoomAvailabilityParams) {
  const queryParams = new URLSearchParams();
  if (params?.floorNumber) queryParams.append("floorNumber", params.floorNumber);
  if (params?.block) queryParams.append("block", params.block);
  if (params?.roomNumber) queryParams.append("roomNumber", params.roomNumber.toString());
  if (params?.bedNumber) queryParams.append("bedNumber", params.bedNumber);

  const queryString = queryParams.toString();
  const url = `${PROPERTY_OWNER_BASE}/check-room-availability/${propertyId}${queryString ? `?${queryString}` : ""}`;

  return httpRequest<RoomAvailabilityResponse>(url, {
    method: "GET",
    auth: true,
  });
}

export interface AddTenantPayload {
  name: string;
  email: string;
  phone: string;
  floorNumber: number;
  block: string;
  roomId?: string;
  roomNumber: number;
  bedNumber: number;
  rentDueDate: number;
  monthlyRent: number;
  electricityBill: number;
  securityDeposit: number;
  joiningDate?: string;
  isNewRoom: boolean;
}

export interface TenantResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  roomId: string;
  roomNumber: number;
  bedNumber: number;
  monthlyRent: number;
  rentDueDate: number;
  createdAt: string;
}

export async function addTenant(propertyId: string, payload: AddTenantPayload) {
  return httpRequest<TenantResponse>(`${PROPERTY_OWNER_BASE}/add-tenant/${propertyId}`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export interface RoomAndCount {
  roomId: string;
  roomNumber: number;
  floorNumber: number;
  block: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
}

export async function getAllRoomsAndCounts(propertyId: string) {
  return httpRequest<RoomAndCount[]>(`${PROPERTY_OWNER_BASE}/all-rooms-and-counts/${propertyId}`, {
    method: "GET",
    auth: true,
  });
}

