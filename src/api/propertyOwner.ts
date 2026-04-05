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
  /** Present when API returns it (edit-properties / GET properties). */
  bedRange?: string;
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

/** PUT /property-owners/properties/:propertyId — Postman "edit-properties" */
export interface UpdatePropertyPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  locationPin: string;
  bedRange: string;
  propertyTypeId: string;
  photos?: unknown[];
}

export async function updateProperty(propertyId: string, payload: UpdatePropertyPayload) {
  return httpRequest<PropertyResponse>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}`, {
    method: "PUT",
    auth: true,
    body: payload,
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
  floorNumber?: string;
  block?: string;
  /** Prefer sending with floor/block labels when the API supports UUID-based lookup. */
  floorId?: string;
  blockId?: string;
  roomNumber?: number;
  /** When roomNumber is not purely numeric (e.g. "A-101"), pass the raw value for the query string. */
  roomNumberRaw?: string;
  bedNumber?: string;
}

export interface RoomAvailabilityResponse {
  available: boolean;
  message?: string;
}

/** Backend responses vary: `{ available }`, `{ isAvailable }`, `{ data: { available } }`, etc. */
export function normalizeRoomAvailabilityResponse(raw: unknown): RoomAvailabilityResponse {
  const msg = (m: unknown): string | undefined => (typeof m === "string" ? m : undefined);

  if (raw == null || typeof raw !== "object") {
    return { available: false, message: "Invalid availability response" };
  }
  const o = raw as Record<string, unknown>;

  if (typeof o.available === "boolean") {
    return { available: o.available, message: msg(o.message) };
  }
  if (typeof o.isAvailable === "boolean") {
    return { available: o.isAvailable, message: msg(o.message ?? o.reason) };
  }

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (typeof d.available === "boolean") {
      return { available: d.available, message: msg(d.message) };
    }
    if (typeof d.isAvailable === "boolean") {
      return { available: d.isAvailable, message: msg(d.message) };
    }
  }

  return { available: false, message: msg(o.message) ?? "Could not verify room availability" };
}

export async function checkRoomAvailability(propertyId: string, params?: CheckRoomAvailabilityParams) {
  const queryParams = new URLSearchParams();
  if (params?.floorNumber) queryParams.append("floorNumber", params.floorNumber);
  if (params?.block) queryParams.append("block", params.block);
  if (params?.floorId) queryParams.append("floorId", params.floorId);
  if (params?.blockId) queryParams.append("blockId", params.blockId);
  const roomQ =
    params?.roomNumberRaw?.trim() ||
    (params?.roomNumber !== undefined && params?.roomNumber !== null
      ? String(params.roomNumber)
      : "");
  if (roomQ) queryParams.append("roomNumber", roomQ);
  if (params?.bedNumber) queryParams.append("bedNumber", params.bedNumber);

  const queryString = queryParams.toString();
  const url = `${PROPERTY_OWNER_BASE}/check-room-availability/${propertyId}${queryString ? `?${queryString}` : ""}`;

  const raw = await httpRequest<unknown>(url, {
    method: "GET",
    auth: true,
  });
  return normalizeRoomAvailabilityResponse(raw);
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
  /** Some list APIs return label as `name` instead of `roomNumber`. */
  name?: string;
  roomNumber: string;
  /** Backend may send bed count as `capacity` instead of `numberOfBeds`. */
  numberOfBeds: number;
  capacity?: number;
  sharingWisePricing?: SharingWisePricingItem[];
  occupiedBeds?: number;
  /** When omitted, derive from capacity/numberOfBeds − occupiedBeds in the client. */
  availableBeds?: number;
  isVacant?: boolean;
  status?: string;
  /** Denormalized labels from API (e.g. floor "1", block "2") — use for check-room-availability. */
  floor?: string;
  block?: string;
  createdAt?: string;
}

/** POST /properties/:id/rooms often returns `{ room, beds }` instead of a bare room. */
export type CreateRoomResponse = RoomItem | { room: RoomItem; beds?: unknown[] };

/** True if the room can be chosen when adding a tenant (free bed, or vacant with unknown counts from API). */
export function roomHasVacancyForAllocation(r: RoomItem): boolean {
  const avail = Number(r.availableBeds) || 0;
  if (avail > 0) return true;
  const total = Number(r.numberOfBeds) || Number(r.capacity) || 0;
  const occupied = Number(r.occupiedBeds) || 0;
  if (total > 0) return occupied < total;
  return r.isVacant === true || String(r.status ?? "").toLowerCase() === "vacant";
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
  const raw = await httpRequest<CreateRoomResponse>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms`,
    {
      method: "POST",
      auth: true,
      body: payload,
    }
  );
  if (raw && typeof raw === "object" && "room" in raw && raw.room) {
    return raw.room;
  }
  return raw as RoomItem;
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

// ─── Dashboard (property-owner) ─────────────────────────────────────────────

export async function getDashboardDetails(propertyId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/dashboard-details/${propertyId}`, {
    method: "GET",
    auth: true,
  });
}

export async function getDashboardKpis() {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/dashboard/kpis`, {
    method: "GET",
    auth: true,
  });
}

// ─── KYC ───────────────────────────────────────────────────────────────────

export async function getKycApplications() {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/kyc/applications`, {
    method: "GET",
    auth: true,
  });
}

export async function getKycByRoomTenantId(roomTenantId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/kyc/${roomTenantId}`, {
    method: "GET",
    auth: true,
  });
}

export async function approveKycApplication(roomTenantId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/kyc/${roomTenantId}/approve`, {
    method: "PATCH",
    auth: true,
  });
}

export async function rejectKycApplication(roomTenantId: string, reason: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/kyc/${roomTenantId}/reject`, {
    method: "PATCH",
    auth: true,
    body: { reason },
  });
}

// ─── Rent collections ─────────────────────────────────────────────────────

export interface ManualRentCollectionPayload {
  roomTenantId: string;
  tenantId: string;
  periodMonth: number;
  periodYear: number;
  amountPaid: number;
}

export async function postManualRentCollection(propertyId: string, payload: ManualRentCollectionPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/rent-collections/manual`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Row shape may include extra fields from the API; camelCase or snake_case accepted in helpers. */
export interface RentDashboardTenantRow {
  roomTenantId?: string;
  tenantId?: string;
  room_tenant_id?: string;
  tenant_id?: string;
  tenantName?: string;
  name?: string;
  tenant_name?: string;
  amount?: number;
  amountDue?: number;
  amount_due?: number;
  amountPaid?: number;
  amount_paid?: number;
  pendingAmount?: number;
  roomNumber?: string | number;
  room_number?: string | number;
  [key: string]: unknown;
}

export interface RentCollectionDashboardResponse {
  period?: { month: number; year: number };
  emptyBedsCount?: number;
  totalCollectedThisPeriod?: number;
  totalRevenueAllTime?: number;
  paidCount?: number;
  unpaidCount?: number;
  paidTenants?: RentDashboardTenantRow[];
  unpaidTenants?: RentDashboardTenantRow[];
}

export async function getRentCollectionDashboard(
  propertyId: string,
  periodMonth: number,
  periodYear: number
) {
  const q = new URLSearchParams({
    periodMonth: String(periodMonth),
    periodYear: String(periodYear),
  });
  return httpRequest<RentCollectionDashboardResponse>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rent-collections/dashboard?${q}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getAnalyticsPgGrowth() {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/analytics/pg-growth`, {
    method: "GET",
    auth: true,
  });
}

export async function getAnalyticsRevenue(propertyId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/analytics/revenue?propertyId=${encodeURIComponent(propertyId)}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

export async function getAnalyticsOccupancy(propertyId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/analytics/occupancy?propertyId=${encodeURIComponent(propertyId)}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// ─── Staff: permission tiers & roles (Postman “Temp” + extended) ────────────

export interface StaffPermissionTierPayload {
  name: string;
  description?: string;
  active?: boolean;
}

export async function createStaffPermissionTier(payload: StaffPermissionTierPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/permission-tiers`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function getStaffPermissionTiers() {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/permission-tiers`, {
    method: "GET",
    auth: true,
  });
}

export async function linkPermissionToStaffTier(tierId: string, permissionId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/staff/permission-tiers/${tierId}/permissions/${permissionId}`,
    {
      method: "POST",
      auth: true,
    }
  );
}

export async function assignStaffRole(payload: { staffId: string; permissionTierId: string }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/roles/assign`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function getStaffMemberRoles(staffId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/${staffId}/roles`, {
    method: "GET",
    auth: true,
  });
}

export interface CreateStaffPermissionDefinitionPayload {
  featureKey: string;
  featureId: string;
  action: string;
  description?: string;
  active?: boolean;
}

/** Creates a staff-scoped permission definition (admin-style; exposed for completeness). */
export async function createStaffPermissionDefinition(payload: CreateStaffPermissionDefinitionPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/staff/permissions`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

