import { authStorage, httpRequest } from "./http";

const PROPERTY_OWNER_BASE = "/property-owners";

/**
 * Property id is **only** in the URL path (not repeated in the body).
 * `POST /api/property-owners/add-tenant/:propertyId`
 */
function propertyOwnerAddTenantPath(propertyId: string): string {
  return `${PROPERTY_OWNER_BASE}/add-tenant/${propertyId}`;
}

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

// Tenant APIs — add-tenant only (no separate check-room call).

/**
 * Body for `POST …/property-owners/add-tenant/:propertyId`.
 * `propertyId` goes in the URL only; this payload includes `floorId`, `blockId`, `roomId`.
 */
export interface AddTenantPayload {
  name: string;
  phone: string;
  floorId: string;
  blockId: string;
  roomId: string;
  bedNumber: number;
  monthlyRent: number;
  securityDeposit: number;
  rentDueDate: number;
  joiningDate?: string;
  electricityBill?: number;
  email?: string;
  gender?: string;
  dob?: string;
  alternateNumber?: string;
  alternatePhone?: string;
  tenantType?: string;
  bloodGroup?: string;
  courseName?: string;
  courseYear?: string;
  officeCollegeName?: string;
  permanentAddress?: string;
  currentAddress?: string;
  nationality?: string;
  motherTongue?: string;
  govtId?: string;
  officeInstituteId?: string;
  biometricId?: string;
  vehicleNumber?: string;
  foodPreferences?: string;
  foodPreference?: string;
  remarks?: string;
  fatherName?: string;
  fatherContact?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherContact?: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianContact?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  guardianAddress?: string;
  guardianEmail?: string;
  stayType?: string;
  lockinPeriodMonths?: number;
  noticePeriodDays?: number;
  agreementPeriodMonths?: number;
  referredBy?: string;
  bookedBy?: string;
  checkinTime?: string;
  checkoutTime?: string;
  lastMeterReading?: number;
  lastReadingDate?: string;
  rentingType?: string;
  collectOnlinePayments?: boolean;
  gstApplicable?: boolean;
  gstPercentage?: number;
  gstin?: string;
  businessName?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  bankUpiId?: string;
  paymentDetails?: {
    openingBalance?: Array<{ dueType: string; dueFor?: string; dueAmount: number; collection: number }>;
    otherDues?: Array<{ dueType: string; mode: string; amount?: number | null }>;
  };
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

/** JSON body: includes floorId, blockId, roomId and all passed profile/stay/bank/payment fields. */
function serializeAddTenantBody(payload: AddTenantPayload): Record<string, unknown> {
  const floorId = String(payload.floorId ?? "").trim();
  const blockId = String(payload.blockId ?? "").trim();
  const roomId = String(payload.roomId ?? "").trim();
  if (!floorId || !blockId || !roomId) {
    throw new Error("floorId, blockId, and roomId are required in the add-tenant body");
  }

  const bed = Math.trunc(Number(payload.bedNumber));
  if (!Number.isFinite(bed) || bed < 1) {
    throw new Error("Invalid bed number for add-tenant");
  }

  const monthlyRent = Number(payload.monthlyRent);
  const securityDeposit = Number(payload.securityDeposit);
  const rentDue = Math.trunc(Number(payload.rentDueDate));

  const body: Record<string, unknown> = {
    name: String(payload.name).trim(),
    phone: String(payload.phone).trim(),
    floorId,
    blockId,
    roomId,
    bedNumber: bed,
    monthlyRent: Number.isFinite(monthlyRent) ? monthlyRent : 0,
    securityDeposit: Number.isFinite(securityDeposit) ? securityDeposit : 0,
    rentDueDate: Number.isFinite(rentDue) ? rentDue : 5,
  };

  // Optional string & number fields
  const optionalFields: (keyof AddTenantPayload)[] = [
    "joiningDate", "electricityBill", "email", "gender", "dob",
    "alternateNumber", "tenantType", "bloodGroup", "courseName", "courseYear",
    "officeCollegeName", "permanentAddress", "currentAddress", "nationality",
    "motherTongue", "govtId", "officeInstituteId", "biometricId", "vehicleNumber",
    "foodPreferences", "remarks", "fatherName", "fatherContact", "fatherOccupation",
    "motherName", "motherContact", "motherOccupation", "guardianName",
    "guardianContact", "guardianRelation", "guardianAddress", "guardianEmail",
    "stayType", "lockinPeriodMonths", "noticePeriodDays", "agreementPeriodMonths",
    "referredBy", "bookedBy", "checkinTime", "checkoutTime", "lastMeterReading",
    "lastReadingDate", "rentingType", "collectOnlinePayments", "gstApplicable",
    "gstPercentage", "gstin", "businessName", "bankAccountHolderName",
    "bankAccountNumber", "bankIfscCode", "bankName", "bankUpiId", "paymentDetails"
  ];

  for (const key of optionalFields) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== "") {
      body[key] = val;
    }
  }

  // Fallback aliases for duplicate names in spec
  if (payload.alternatePhone && !body.alternateNumber) body.alternateNumber = payload.alternatePhone;
  if (payload.foodPreference && !body.foodPreferences) body.foodPreferences = payload.foodPreference;
  if (payload.fatherPhone && !body.fatherContact) body.fatherContact = payload.fatherPhone;
  if (payload.motherPhone && !body.motherContact) body.motherContact = payload.motherPhone;
  if (payload.guardianPhone && !body.guardianContact) body.guardianContact = payload.guardianPhone;

  return body;
}

/** `propertyId` = selected PG id in the URL; `payload` must include `floorId`, `blockId`, `roomId`. */
export async function addTenant(propertyId: string, payload: AddTenantPayload) {
  return httpRequest<TenantResponse>(propertyOwnerAddTenantPath(propertyId), {
    method: "POST",
    auth: true,
    body: serializeAddTenantBody(payload),
  });
}

/** Nested shapes from `GET …/properties/:propertyId/tenants` (`{ tenants: [...] }`). */
export interface PropertyTenantRoomAssignment {
  id: string;
  rentAmount?: string;
  securityDeposit?: string;
  startDate?: string;
  status?: string;
  bedNumberOnAssignment?: number;
}

export interface PropertyTenantRoomInfo {
  id: string;
  name?: string;
  roomNumber?: string;
}

export interface PropertyTenantFloorInfo {
  id: string;
  name?: string;
  displayOrder?: number;
}

export interface PropertyTenantBlockInfo {
  id: string;
  name?: string;
  displayOrder?: number;
}

export interface PropertyTenantBedInfo {
  id: string;
  bedNumber?: string;
  isOccupied?: boolean;
}

export interface PropertyTenantNotice {
  isOnNotice?: boolean;
  noticeStartedAt?: string | null;
  vacateOn?: string | null;
  daysUntilVacate?: number | null;
}

export interface PropertyTenant {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  roomTenant?: PropertyTenantRoomAssignment;
  room?: PropertyTenantRoomInfo;
  floor?: PropertyTenantFloorInfo;
  block?: PropertyTenantBlockInfo;
  bed?: PropertyTenantBedInfo;
  notice?: PropertyTenantNotice;
  /** KYC / Aadhaar — set when API sends it */
  kycVerified?: boolean;
  aadhaarVerified?: boolean;
  mobileNumber?: string;
  emergencyContact?: string;
  workAddress?: string;
  monthlyRent?: number | string;
  securityDeposit?: number | string;
  moveInDate?: string;
  createdAt?: string;
  noticeGivenAt?: string;
  expectedMoveOutDate?: string;
  isKycVerified?: boolean;
  kycInfo?: any;
  kycStatus?: string;
}

/** @deprecated use PropertyTenant */
export type PropertyTenantListItem = PropertyTenant;

export function normalizeSingleTenant(t: any): PropertyTenant {
  if (!t) return t;

  const monthlyRent = t.monthlyRent ?? t.roomTenant?.rentAmount ?? t.roomTenant?.monthlyRent ?? 0;
  const securityDeposit = t.securityDeposit ?? t.roomTenant?.securityDeposit ?? 0;
  const moveInDate = t.moveInDate ?? t.roomTenant?.startDate ?? t.roomTenant?.moveInDate ?? t.createdAt ?? "";

  const noticeGivenAt = t.noticeGivenAt ?? t.notice?.noticeStartedAt ?? null;
  const expectedMoveOutDate = t.expectedMoveOutDate ?? t.notice?.vacateOn ?? null;

  const phone = t.phone ?? t.mobileNumber ?? "";
  const mobileNumber = t.mobileNumber ?? t.phone ?? "";

  const roomNo = t.roomNo ?? t.room?.roomNumber ?? "";
  const roomNumber = t.roomNumber ?? t.room?.roomNumber ?? "";
  const bedNo = t.bedNo ?? t.bed?.bedNumber ?? "";

  return {
    ...t,
    phone,
    mobileNumber,
    monthlyRent,
    securityDeposit,
    moveInDate,
    noticeGivenAt,
    expectedMoveOutDate,
    roomNo,
    roomNumber,
    bedNo,
  };
}

export function normalizePropertyTenantsList(raw: unknown): PropertyTenant[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) list = o.data;
    else if (Array.isArray(o.tenants)) list = o.tenants;
    else if (Array.isArray(o.items)) list = o.items;
    else if (o.data && typeof o.data === "object") {
      const inner = o.data as Record<string, unknown>;
      if (Array.isArray(inner.tenants)) list = inner.tenants;
    }
  }
  return list.map(normalizeSingleTenant);
}

export interface UpdatePropertyTenantPayload {
  name?: string;
  phone?: string;
  email?: string;
  remarks?: string;
  alternatePhone?: string;
  foodPreference?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  currentAddress?: string;
  permanentAddress?: string;
  nationality?: string;
  gstNumber?: string;
  panNumber?: string;
  companyName?: string;
  companyAddress?: string;
  businessOwnerName?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  emergencyContact?: string;
  workAddress?: string;
}

export async function updatePropertyTenant(
  propertyId: string,
  tenantId: string,
  payload: UpdatePropertyTenantPayload,
) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/tenants/${tenantId}`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
    },
  );
}

export async function getPropertyTenantById(propertyId: string, tenantId: string) {
  const raw = await httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/tenants/${tenantId}`,
    {
      method: "GET",
      auth: true,
    }
  );
  return normalizeSingleTenant(raw);
}

/** GET `/api/property-owners/properties/:propertyId/tenants` */
export async function getPropertyTenants(propertyId: string) {
  const raw = await httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/tenants`,
    {
      method: "GET",
      auth: true,
    }
  );
  return normalizePropertyTenantsList(raw);
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
  /** Denormalized labels from API (e.g. floor "1", block "2"). */
  floor?: string;
  block?: string;
  createdAt?: string;
  beds?: any[];
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
  if (r.isVacant === true || String(r.status ?? "").toLowerCase() === "vacant") return true;
  // List responses often omit bed counts entirely; allow selection and let add-tenant validate.
  if (r.id && r.isVacant !== false && total === 0 && occupied === 0) return true;
  return false;
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

/** GET …/properties/{propertyId}/rooms?page=&limit=&blockId=&floorId= */
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

/** GET …/properties/{propertyId}/rooms/list?blockId=&floorId= */
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

/** POST …/properties/{propertyId}/rooms — body includes floorId (not in URL path). */
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

/** PUT /properties/{propertyId}/rooms/{roomId} */
export async function updateRoom(propertyId: string, roomId: string, payload: Partial<CreateRoomPayload>) {
  try {
    return await httpRequest<RoomItem>(
      `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms/${roomId}`,
      {
        method: "PUT",
        auth: true,
        body: payload,
      }
    );
  } catch {
    return await httpRequest<RoomItem>(
      `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms/${roomId}`,
      {
        method: "PATCH",
        auth: true,
        body: payload,
      }
    );
  }
}

/** PUT /properties/{propertyId}/blocks/{blockId} */
export async function updateBlock(propertyId: string, blockId: string, payload: { name?: string; displayOrder?: number }) {
  return httpRequest<BlockItem>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks/${blockId}`,
    {
      method: "PUT",
      auth: true,
      body: payload,
    }
  );
}

/** DELETE /properties/{propertyId}/blocks/{blockId} */
export async function deleteBlock(propertyId: string, blockId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks/${blockId}`,
    {
      method: "DELETE",
      auth: true,
    }
  );
}

/** PUT /properties/{propertyId}/floors/{floorId} */
export async function updateFloor(propertyId: string, floorId: string, payload: { name?: string; displayOrder?: number; blockId?: string }) {
  return httpRequest<FloorItem>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/floors/${floorId}`,
    {
      method: "PUT",
      auth: true,
      body: payload,
    }
  );
}

/** DELETE /properties/{propertyId}/floors/{floorId} */
export async function deleteFloor(propertyId: string, floorId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/floors/${floorId}`,
    {
      method: "DELETE",
      auth: true,
    }
  );
}

/** DELETE /properties/{propertyId}/rooms/{roomId} */
export async function deleteRoom(propertyId: string, roomId: string) {
  return httpRequest<unknown>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/rooms/${roomId}`,
    {
      method: "DELETE",
      auth: true,
    }
  );
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

// ==========================================================
// VERIFICATION CREDITS & TOP-UPS (RAZORPAY)
// ==========================================================

export interface CreditBalanceResponse {
  totalCredits: number;
  freeCreditsAllocated: number;
  freeCreditsUsed: number;
  freeCreditsRemaining: number;
  topupCreditsRemaining: number;
  remainingCredits: number;
  isBlocked: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage?: number;
  popular?: boolean;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  notes?: Record<string, any>;
}

export async function getCreditBalance() {
  return httpRequest<CreditBalanceResponse>(`${PROPERTY_OWNER_BASE}/credits/balance`, {
    auth: true,
  });
}

export async function getCreditPacks() {
  return httpRequest<{ creditPacks: CreditPack[] }>(`${PROPERTY_OWNER_BASE}/credit-packs`, {
    auth: true,
  });
}

export async function createCreditTopupOrder(creditPackId: string) {
  return httpRequest<RazorpayOrderResponse>(`${PROPERTY_OWNER_BASE}/credits/${creditPackId}/checkout-order`, {
    method: 'POST',
    auth: true,
  });
}

export async function verifyCreditPayment(body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  creditPackId: string;
}) {
  return httpRequest<{ success: boolean; message: string; newBalance: number }>(`${PROPERTY_OWNER_BASE}/credits/verify-payment`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export async function requestTenantKyc(roomTenantId: string) {
  return httpRequest<{
    success: boolean;
    message: string;
    kycApplicationId: string;
    digioKycId?: string;
    kycDirectUrl?: string;
    remainingCredits: number;
  }>(`${PROPERTY_OWNER_BASE}/tenants/${roomTenantId}/request-kyc`, {
    method: 'POST',
    auth: true,
  });
}

// ==========================================================
// PLANS & SUBSCRIPTION UPGRADES (RAZORPAY)
// ==========================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  maxProperties: number;
  maxTenants: number;
  isPopular?: boolean;
}

export interface CurrentPlanResponse {
  currentPlan: SubscriptionPlan | null;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'free';
  expiresAt: string | null;
  daysRemaining: number | null;
  propertiesUsage: { used: number; max: number };
  tenantsUsage: { used: number; max: number };
}

export async function getPlans() {
  return httpRequest<{ plans: SubscriptionPlan[] }>(`${PROPERTY_OWNER_BASE}/plans`, {
    auth: true,
  });
}

export async function getCurrentPlan() {
  return httpRequest<CurrentPlanResponse>(`${PROPERTY_OWNER_BASE}/plans/current`, {
    auth: true,
  });
}

export async function createPlanCheckoutOrder(
  planId: string,
  payload?: { numberOfBeds?: number; durationMonths?: number; billingCycle?: 'monthly' | 'annual' } | 'monthly' | 'annual'
) {
  const body = typeof payload === 'object' ? payload : { billingCycle: payload || 'monthly' };
  return httpRequest<RazorpayOrderResponse>(`${PROPERTY_OWNER_BASE}/plans/${planId}/checkout-order`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export async function verifyPlanPayment(body: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  planId: string;
  numberOfBeds?: number;
  durationMonths?: number;
  billingCycle?: 'monthly' | 'annual';
}) {
  return httpRequest<{ success: boolean; message: string; plan: SubscriptionPlan }>(`${PROPERTY_OWNER_BASE}/plans/verify-payment`, {
    method: 'POST',
    body,
    auth: true,
  });
}

// ==========================================================
// RENTAL AGREEMENTS (DIGIO eSIGN)
// ==========================================================

export interface RentalAgreement {
  id: string;
  propertyId: string;
  roomTenantId: string;
  tenantName: string;
  tenantPhone: string;
  roomNumber: string;
  monthlyRent: number;
  securityDeposit: number;
  noticePeriodDays: number;
  lockInPeriodMonths: number;
  agreementStartDate: string;
  agreementEndDate: string;
  status: 'draft' | 'sent_for_esign' | 'partially_signed' | 'signed' | 'rejected' | 'expired';
  agreementPdfUrl?: string;
  signedPdfUrl?: string;
  digioDocumentId?: string;
  signingDirectUrl?: string;
  createdAt: string;
}

export async function getPropertyAgreements(propertyId: string) {
  return httpRequest<{ agreements: RentalAgreement[] }>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/agreements`, {
    auth: true,
  });
}

export async function createRentalAgreement(
  propertyId: string,
  body: {
    roomTenantId: string;
    monthlyRent: number;
    securityDeposit: number;
    noticePeriodDays: number;
    lockInPeriodMonths?: number;
    agreementStartDate: string;
    agreementEndDate?: string;
    houseRules?: string[];
  }
) {
  return httpRequest<{
    success: boolean;
    message: string;
    agreement: RentalAgreement;
    signingUrl?: string;
  }>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/agreements/create`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export async function sendAgreementForEsign(agreementId: string) {
  return httpRequest<{
    success: boolean;
    message: string;
    signingUrl?: string;
  }>(`${PROPERTY_OWNER_BASE}/agreements/${agreementId}/send-esign`, {
    method: 'POST',
    auth: true,
  });
}

// ==========================================================
// NOTICE PERIOD MANAGEMENT
// ==========================================================

export interface NoticePeriodResponse {
  success: boolean;
  message: string;
  noticeGivenAt: string;
  expectedMoveOutDate: string;
}

export async function setTenantNotice(
  propertyId: string,
  roomTenantId: string,
  body: { noticeGivenAt: string; expectedMoveOutDate: string; reason?: string }
) {
  return httpRequest<NoticePeriodResponse>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/notice`,
    {
      method: 'POST',
      body,
    }
  );
}

export async function clearTenantNotice(propertyId: string, roomTenantId: string) {
  return httpRequest<{ success: boolean; message: string }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/notice`,
    {
      method: 'DELETE',
    }
  );
}

// ==========================================================
// ELECTRICITY METER DUES MANAGEMENT
// ==========================================================

export interface ElectricityMeterDue {
  id: string;
  propertyId: string;
  roomTenantId: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  billingMonth: number;
  billingYear: number;
  readingDate: string;
  dueDate: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export async function getElectricityDues(propertyId: string, roomTenantId: string) {
  return httpRequest<{ dues: ElectricityMeterDue[] }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/electricity-meter-dues`,
    {
      auth: true,
    }
  );
}

export async function addElectricityDues(
  propertyId: string,
  roomTenantId: string,
  body: {
    previousReading: number;
    currentReading: number;
    ratePerUnit: number;
    billingMonth: number;
    billingYear: number;
    dueDate?: string;
    notes?: string;
  }
) {
  return httpRequest<{ success: boolean; message: string; due: ElectricityMeterDue }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/electricity-meter-dues`,
    {
      method: 'POST',
      body,
      auth: true,
    }
  );
}

export async function updateElectricityDues(
  propertyId: string,
  roomTenantId: string,
  duesId: string,
  body: Partial<{
    previousReading: number;
    currentReading: number;
    ratePerUnit: number;
    isPaid: boolean;
    dueDate: string;
    notes: string;
  }>
) {
  return httpRequest<{ success: boolean; message: string; due: ElectricityMeterDue }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/electricity-meter-dues/${duesId}`,
    {
      method: 'PATCH',
      body,
      auth: true,
    }
  );
}

export async function deleteElectricityDues(propertyId: string, roomTenantId: string, duesId: string) {
  return httpRequest<{ success: boolean; message: string }>(
    `${PROPERTY_OWNER_BASE}/properties/${propertyId}/room-tenants/${roomTenantId}/electricity-meter-dues/${duesId}`,
    {
      method: 'DELETE',
      auth: true,
    }
  );
}

// ==========================================================
// WIFI MANAGEMENT HIERARCHY
// ==========================================================

export async function getWifiHierarchy(propertyId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/wifi-details`, {
    auth: true,
  });
}

export async function updateFloorWifi(propertyId: string, floorId: string, payload: { wifiSsid: string; wifiPassword?: string; wifiDetails?: any }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/floors/${floorId}/wifi`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function updateBlockWifi(propertyId: string, blockId: string, payload: { wifiSsid: string; wifiPassword?: string }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/blocks/${blockId}/wifi`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function updatePropertyWifiHierarchy(propertyId: string, payload: { blocks?: any[]; floors?: any[] }) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/wifi-details`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

// ==========================================================
// GUEST ARRIVAL REQUESTS
// ==========================================================

export async function createGuestRequest(propertyId: string, payload: {
  tenantId?: string;
  guestName: string;
  guestPhone?: string;
  relationship?: string;
  expectedArrival?: string;
  purpose?: string;
}) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/guest-requests`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function getGuestRequests(propertyId: string, status?: string) {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/guest-requests${qs}`, {
    auth: true,
  });
}

export async function updateGuestRequestStatus(
  propertyId: string,
  requestId: string,
  statusOrPayload: "approved" | "rejected" | { status: "approved" | "rejected"; remarks?: string },
  remarks?: string
) {
  const body = typeof statusOrPayload === "object" ? statusOrPayload : { status: statusOrPayload, remarks };
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/guest-requests/${requestId}/status`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

// ==========================================================
// NIGHT OUT / LATE PASS REQUESTS
// ==========================================================

export async function createNightOutRequest(propertyId: string, payload: {
  tenantId?: string;
  leaveDate: string;
  returnDate: string;
  reason?: string;
  destinationAddress?: string;
}) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/night-out-requests`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function getNightOutRequests(propertyId: string, status?: string) {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/night-out-requests${qs}`, {
    auth: true,
  });
}

export async function updateNightOutRequestStatus(
  propertyId: string,
  requestId: string,
  statusOrPayload: "approved" | "rejected" | { status: "approved" | "rejected"; remarks?: string },
  remarks?: string
) {
  const body = typeof statusOrPayload === "object" ? statusOrPayload : { status: statusOrPayload, remarks };
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/night-out-requests/${requestId}/status`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

// ==========================================================
// PROPERTY NOTICES & ANNOUNCEMENTS
// ==========================================================

export interface CreateNoticePayload {
  title: string;
  message: string;
  category?: string;
  priority?: string;
  targetType?: string;
  attachmentUrl?: string;
  expiresAt?: string;
}

export async function createPropertyNotice(propertyId: string, payload: CreateNoticePayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/notices`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function getPropertyNotices(propertyId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/notices`, {
    auth: true,
  });
}

export async function deletePropertyNotice(propertyId: string, noticeId: string) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/notices/${noticeId}`, {
    method: "DELETE",
    auth: true,
  });
}

// ==========================================================
// MOVE / TRANSFER TENANT
// ==========================================================

export interface MoveTenantPayload {
  roomTenantId: string;
  targetPropertyId: string;
  targetRoomId: string;
  targetBedNumber: number;
  transferDate: string;
  newMonthlyRent?: number;
  newSecurityDeposit?: number;
  transferSecurityDeposit?: boolean;
  remarks?: string;
}

export async function moveTenant(propertyId: string, payload: MoveTenantPayload) {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/properties/${propertyId}/tenants/move`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

// ==========================================================
// ACTIVITY LOGS & AUDIT TRAIL
// ==========================================================

export async function getActivityLogs(params?: { limit?: number; offset?: number; module?: string; action?: string }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  if (params?.module) q.set("module", params.module);
  if (params?.action) q.set("action", params.action);

  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/activity-logs?${q.toString()}`, {
    auth: true,
  });
}

export async function getActivityLogModules() {
  return httpRequest<unknown>(`${PROPERTY_OWNER_BASE}/activity-logs/modules`, {
    auth: true,
  });
}

