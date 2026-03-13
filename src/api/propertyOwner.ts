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

export interface GetPropertiesResponse {
  properties: PropertyResponse[];
  total: number;
}

export async function getProperties() {
  return httpRequest<GetPropertiesResponse | PropertyResponse[]>(`${PROPERTY_OWNER_BASE}/properties`, {
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

// My Features (plan + features list)
export interface PlanFeature {
  id: string;
  featureKey: string;
  featureName: string;
  featureDescription: string;
  category: string;
  limit: number | null;
}

export interface MyFeaturesResponse {
  planName: string;
  planDisplayName: string;
  isDefault: boolean;
  features: PlanFeature[];
}

export async function getMyFeatures() {
  return httpRequest<MyFeaturesResponse>(`${PROPERTY_OWNER_BASE}/my-features`, {
    method: "GET",
    auth: true,
  });
}

// Legacy alias if code expects Feature[]
export interface Feature {
  id: string;
  featureKey: string;
  name: string;
  description: string;
  category: string;
  displayOrder?: number;
  active?: boolean;
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
  email?: string;
  phone: string;
  floorId?: string;
  blockId?: string;
  floorNumber?: number;
  block?: string;
  roomId?: string;
  roomNumber?: number | string;
  bedNumber: number;
  rentDueDate: number;
  monthlyRent: number;
  electricityBill?: number;
  securityDeposit: number;
  joiningDate?: string;
  isNewRoom?: boolean;
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

// ─── Staff APIs (property-owner) ───────────────────────────────────────────

export interface CreateStaffPayload {
  propertyId: string;
  name: string;
  email: string;
  mobileContactNumber: string;
  countryCode?: string;
  designation?: string;
  staffPermissionTierId?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  mobileContactNumber: string;
  countryCode: string | null;
  designation: string | null;
  propertyId: string;
  staffPermissionTierId: string | null;
  createdAt: string;
}

export async function createStaff(payload: CreateStaffPayload) {
  return httpRequest<StaffMember>(`${PROPERTY_OWNER_BASE}/create-staff`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export interface StaffPermissionsAssignPayload {
  permissions: string[];
  permissionTierName: string;
}

export async function staffPermissionsAssign(staffId: string, payload: StaffPermissionsAssignPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/permissions/assign/${staffId}`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export interface PermissionItem {
  id: string;
  name?: string;
  featureKey?: string;
}

export async function getStaffPermissions() {
  return httpRequest<PermissionItem[]>(`${PROPERTY_OWNER_BASE}/staff/permissions`, {
    method: "GET",
    auth: true,
  });
}

export async function getStaffPermissionsById(staffId: string) {
  return httpRequest<PermissionItem[]>(`${PROPERTY_OWNER_BASE}/staff/${staffId}/permissions`, {
    method: "GET",
    auth: true,
  });
}

export interface Designation {
  id: string;
  name: string;
  description?: string;
}

export async function getDesignations() {
  return httpRequest<Designation[]>(`${PROPERTY_OWNER_BASE}/designations`, {
    method: "GET",
    auth: true,
  });
}

export interface StaffWithPermissions extends StaffMember {
  permissions?: PermissionItem[];
  permissionTierName?: string;
}

export async function getAllStaffWithPermissions(propertyId: string) {
  return httpRequest<StaffWithPermissions[]>(`${PROPERTY_OWNER_BASE}/get-all-staff-with-permissions/${propertyId}`, {
    method: "GET",
    auth: true,
  });
}

export interface UpdateStaffPermissionsPayload {
  permissions: string[];
}

export async function updateStaffPermissions(staffId: string, payload: UpdateStaffPermissionsPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/update-staff-permissions/${staffId}`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

// ─── Complaints APIs ────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  propertyId: string;
  tenantId?: string;
  subject?: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getComplaintsByProperty(
  propertyId: string,
  params?: { priority?: string }
) {
  const query = new URLSearchParams();
  if (params?.priority) query.append("priority", params.priority);
  const qs = query.toString();
  const url = `${PROPERTY_OWNER_BASE}/properties/${propertyId}/complaints${qs ? `?${qs}` : ""}`;
  return httpRequest<Complaint[]>(url, {
    method: "GET",
    auth: true,
  });
}

export interface UpdateComplaintStatusPayload {
  status: string;
  remarks?: string;
}

export async function updateComplaintStatus(
  complaintId: string,
  payload: UpdateComplaintStatusPayload
) {
  return httpRequest<Complaint>(`${PROPERTY_OWNER_BASE}/complaints/${complaintId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

// ─── Structure APIs (blocks/floors/rooms) ───────────────────────────────────

export interface BlockItem {
  id: string;
  name: string;
  propertyId: string;
  createdAt?: string;
}

export interface FloorItem {
  id: string;
  name: string;
  blockId: string;
  propertyId: string;
  createdAt?: string;
}

export interface SharingWisePricingItem {
  sharingCount: number;
  monthlyRent: number;
  securityDeposit: number;
}

export interface RoomItem {
  id: string;
  propertyId: string;
  floorId: string;
  blockId?: string;
  roomNumber: string;
  numberOfBeds: number;
  sharingWisePricing?: SharingWisePricingItem[];
  occupiedBeds?: number;
  availableBeds?: number;
  createdAt?: string;
}

export async function getBlocks(propertyId: string) {
  return httpRequest<BlockItem[]>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks`, {
    method: "GET",
    auth: true,
  });
}

export async function createBlock(propertyId: string, payload: { name: string }) {
  return httpRequest<BlockItem>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function getFloors(propertyId: string, blockId: string) {
  return httpRequest<FloorItem[]>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks/${blockId}/floors`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function createFloor(propertyId: string, blockId: string, payload: { name: string }) {
  return httpRequest<FloorItem>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks/${blockId}/floors`,
    {
      method: "POST",
      auth: true,
      body: payload,
    }
  );
}

export interface GetRoomsParams {
  page?: number;
  limit?: number;
  blockId?: string;
  floorId?: string;
}

export async function getRooms(propertyId: string, params?: GetRoomsParams) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.blockId) query.append("blockId", params.blockId);
  if (params?.floorId) query.append("floorId", params.floorId);
  const qs = query.toString();

  return httpRequest<RoomItem[] | { data?: RoomItem[] }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function getRoomsList(propertyId: string, params?: { blockId?: string; floorId?: string }) {
  const query = new URLSearchParams();
  if (params?.blockId) query.append("blockId", params.blockId);
  if (params?.floorId) query.append("floorId", params.floorId);
  const qs = query.toString();

  return httpRequest<RoomItem[] | { data?: RoomItem[] }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms/list${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export interface CreateRoomPayload {
  floorId: string;
  roomNumber: string;
  numberOfBeds: number;
  sharingWisePricing?: SharingWisePricingItem[];
}

export async function createRoom(propertyId: string, payload: CreateRoomPayload) {
  return httpRequest<RoomItem>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

// ─── Amenities/Restrictions APIs ─────────────────────────────────────────────

export interface PropertyAmenity {
  id: string;
  name: string;
  scope?: string;
}

export interface PropertyRestriction {
  id: string;
  name: string;
}

export async function getPropertyAmenities(propertyId: string) {
  return httpRequest<PropertyAmenity[]>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/amenities`, {
    method: "GET",
    auth: true,
  });
}

export async function createCustomAmenity(propertyId: string, payload: { name: string }) {
  return httpRequest<PropertyAmenity>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/amenities/custom`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function linkAmenities(propertyId: string, payload: { amenityIds: string[] }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/amenities`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function getPropertyRestrictions(propertyId: string) {
  return httpRequest<PropertyRestriction[]>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/restrictions`, {
    method: "GET",
    auth: true,
  });
}

export async function createCustomRestriction(propertyId: string, payload: { name: string }) {
  return httpRequest<PropertyRestriction>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/restrictions/custom`,
    {
      method: "POST",
      auth: true,
      body: payload,
    }
  );
}

export async function linkRestrictions(propertyId: string, payload: { restrictionIds: string[] }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/restrictions`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

// ─── Dining schedule APIs ────────────────────────────────────────────────────

export interface DiningSlot {
  menu: string;
  startTime: string;
  endTime: string;
}

export interface DiningDaySchedule {
  dayOfWeek: number;
  breakfast?: DiningSlot;
  lunch?: DiningSlot;
  dinner?: DiningSlot;
}

export async function getDiningSchedule(propertyId: string) {
  return httpRequest<DiningDaySchedule[] | { schedule?: DiningDaySchedule[] }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/dining-schedule`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function updateDiningSchedule(propertyId: string, payload: { schedule: DiningDaySchedule[] }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/dining-schedule`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

