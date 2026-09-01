import {useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignStaffRole,
  approveKycApplication,
  createStaffPermissionDefinition,
  createStaffPermissionTier,
  getAllRoomsAndCounts,
  getAllStaffWithPermissions,
  getAnalyticsOccupancy,
  getAnalyticsPgGrowth,
  getAnalyticsRevenue,
  getBlocks,
  getComplaintsByProperty,
  getDashboardDetails,
  getDashboardKpis,
  getDesignations,
  getDiningSchedule,
  getFloors,
  getKycApplications,
  getKycByRoomTenantId,
  getMyFeatures,
  getPropertyAmenities,
  getPropertyRestrictions,
  getRentCollectionDashboard,
  getPropertyTenantById,
  getPropertyTenants,
  getRooms,
  getRoomsList,
  getStaffMemberRoles,
  getStaffPermissionTiers,
  getStaffPermissions,
  getStaffPermissionsById,
  linkAmenities,
  linkPermissionToStaffTier,
  linkRestrictions,
  postManualRentCollection,
  rejectKycApplication,
  staffPermissionsAssign,
  updateComplaintStatus,
  updateDiningSchedule,
  updateProperty,
  updateStaffPermissions,
  uploadPhoto,
  createBlock,
  updateBlock,
  deleteBlock,
  createCustomAmenity,
  createCustomRestriction,
  createFloor,
  updateFloor,
  deleteFloor,
  createRoom,
  deleteRoom,
  moveTenant,
  createStaff,
  type BlockItem,
  type MoveTenantPayload,
  type CreateRoomPayload,
  type CreateStaffPayload,
  type CreateStaffPermissionDefinitionPayload,
  type DiningDaySchedule,
  type FloorItem,
  type ManualRentCollectionPayload,
  type RoomItem,
  type StaffPermissionTierPayload,
  type UpdateComplaintStatusPayload,
  type UpdatePropertyPayload,
  type UpdateStaffPermissionsPayload,
  type StaffPermissionsAssignPayload,
  type Complaint,
  type RoomAndCount,
  type StaffWithPermissions,
  type Designation,
  type PermissionItem,
  type PropertyAmenity,
  type PropertyRestriction,
  getCreditBalance,
  getCreditPacks,
  createCreditTopupOrder,
  verifyCreditPayment,
  requestTenantKyc,
  getPlans,
  getCurrentPlan,
  createPlanCheckoutOrder,
  verifyPlanPayment,
  getPropertyAgreements,
  createRentalAgreement,
  sendAgreementForEsign,
  setTenantNotice,
  clearTenantNotice,
  getElectricityDues,
  addElectricityDues,
  updateElectricityDues,
  deleteElectricityDues,
  getWifiHierarchy,
  updateFloorWifi,
  updateBlockWifi,
  updatePropertyWifiHierarchy,
  getGuestRequests,
  updateGuestRequestStatus,
  getNightOutRequests,
  updateNightOutRequestStatus,
  createPropertyNotice,
  getPropertyNotices,
  deletePropertyNotice,
  getActivityLogs,
  getActivityLogModules,
} from "@/api/propertyOwner";

/**
 * Safely extract an array from API responses that may be:
 *  - a plain array
 *  - { data: [...] }
 *  - { <key>: [...] }  (e.g. { properties: [...] }, { amenities: [...] })
 */
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

function coerceNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Floor/block labels from API may be strings or nested `{ name }` objects. */
function coerceFloorBlockLabel(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const s = v.trim();
    return s !== "" ? s : undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object" && v !== null && "name" in v) {
    const n = (v as { name: unknown }).name;
    if (typeof n === "string" && n.trim()) return n.trim();
    if (typeof n === "number" && Number.isFinite(n)) return String(n);
  }
  return undefined;
}

/** Map API room objects to the shape the UI expects (numberOfBeds, roomNumber, availableBeds). */
function normalizeRoomItem(item: unknown): RoomItem {
  const r = item as Record<string, unknown>;
  const innerRoom = (r.room && typeof r.room === "object") ? (r.room as Record<string, unknown>) : null;

  const readProp = (key: string): any => {
    return r[key] !== undefined ? r[key] : (innerRoom ? innerRoom[key] : undefined);
  };

  const rawBeds = r.beds ?? (innerRoom ? innerRoom.beds : undefined);
  const bedsArr = Array.isArray(rawBeds) ? (rawBeds as Record<string, unknown>[]) : null;

  const hasExplicitTotal =
    readProp("numberOfBeds") !== undefined && readProp("numberOfBeds") !== null && String(readProp("numberOfBeds")).trim() !== "";
  const hasExplicitCapacity =
    readProp("capacity") !== undefined && readProp("capacity") !== null && String(readProp("capacity")).trim() !== "";
  const hasExplicitSharing =
    readProp("sharing") !== undefined && readProp("sharing") !== null && String(readProp("sharing")).trim() !== "";
  const hasExplicitSharingCount =
    readProp("sharingCount") !== undefined && readProp("sharingCount") !== null && String(readProp("sharingCount")).trim() !== "";

  let pricingMaxSharing = 0;
  const rawPricing = readProp("sharingWisePricing");
  if (Array.isArray(rawPricing)) {
    const counts = rawPricing.map((p: any) => coerceNum(p?.sharingCount)).filter(Boolean);
    if (counts.length > 0) {
      pricingMaxSharing = Math.max(...counts);
    }
  }

  let numberOfBeds =
    coerceNum(readProp("numberOfBeds")) ||
    coerceNum(readProp("capacity")) ||
    coerceNum(readProp("sharing")) ||
    coerceNum(readProp("sharingCount")) ||
    pricingMaxSharing ||
    (bedsArr ? bedsArr.length : 0);

  let occupiedBeds = coerceNum(readProp("occupiedBeds"));
  if (bedsArr && bedsArr.length > 0) {
    const fromBeds = bedsArr.filter((b) => b && b.isOccupied === true).length;
    if (fromBeds > 0 || bedsArr.some((b) => b && Object.prototype.hasOwnProperty.call(b, "isOccupied"))) {
      occupiedBeds = fromBeds;
    }
  }

  const hasExplicitAvailable =
    readProp("availableBeds") !== undefined && readProp("availableBeds") !== null && String(readProp("availableBeds")).trim() !== "";
  let availableBeds: number;
  if (hasExplicitAvailable) {
    const av = coerceNum(readProp("availableBeds"));
    availableBeds = Math.max(0, av);
  } else if (bedsArr && bedsArr.length > 0) {
    availableBeds = bedsArr.filter((b) => b && b.isOccupied !== true).length;
  } else {
    availableBeds = Math.max(0, numberOfBeds - occupiedBeds);
  }

  const isVacantFlag =
    typeof readProp("isVacant") === "boolean"
      ? readProp("isVacant")
      : readProp("status") === "vacant" || String(readProp("status") ?? "").toLowerCase() === "vacant";

  const missingInventory =
    numberOfBeds === 0 &&
    availableBeds === 0 &&
    !hasExplicitAvailable &&
    !hasExplicitTotal &&
    !hasExplicitCapacity &&
    !hasExplicitSharing &&
    !hasExplicitSharingCount &&
    pricingMaxSharing === 0 &&
    (!bedsArr || bedsArr.length === 0);

  if (missingInventory) {
    numberOfBeds = 1;
    occupiedBeds = 0;
    availableBeds = 1;
  }

  const rawRoomId = readProp("id") ?? readProp("roomId");
  const idStr = rawRoomId != null && String(rawRoomId).trim() !== "" ? String(rawRoomId) : "";

  return {
    id: idStr,
    propertyId: String(readProp("propertyId") ?? ""),
    floorId: String(readProp("floorId") ?? ""),
    blockId: readProp("blockId") != null ? String(readProp("blockId")) : undefined,
    name: readProp("name") != null ? String(readProp("name")) : undefined,
    roomNumber: String(readProp("roomNumber") ?? readProp("name") ?? ""),
    numberOfBeds,
    capacity: coerceNum(readProp("capacity")) > 0 ? coerceNum(readProp("capacity")) : undefined,
    sharingWisePricing: rawPricing as RoomItem["sharingWisePricing"],
    occupiedBeds,
    availableBeds,
    isVacant: isVacantFlag,
    status: readProp("status") != null ? String(readProp("status")) : undefined,
    floor: coerceFloorBlockLabel(readProp("floor")),
    block: coerceFloorBlockLabel(readProp("block")),
    createdAt: readProp("createdAt") != null ? String(readProp("createdAt")) : undefined,
    beds: bedsArr || undefined,
  };
}

/** GET /rooms may return an array, `{ data: [] }`, `{ rooms: [] }`, or nested pagination. */
function roomsFromListResponse(raw: unknown): RoomItem[] {
  if (Array.isArray(raw)) return raw.map(normalizeRoomItem);
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.data)) return obj.data.map(normalizeRoomItem);
  if (Array.isArray(obj.rooms)) return obj.rooms.map(normalizeRoomItem);
  if (Array.isArray(obj.items)) return obj.items.map(normalizeRoomItem);

  if (obj.data && typeof obj.data === "object") {
    const inner = obj.data as Record<string, unknown>;
    if (Array.isArray(inner.rooms)) return inner.rooms.map(normalizeRoomItem);
    if (Array.isArray(inner.items)) return inner.items.map(normalizeRoomItem);
    if (Array.isArray(inner.data)) return inner.data.map(normalizeRoomItem);
  }

  return toArray<RoomItem>(raw).map(normalizeRoomItem);
}

export const queryKeys = {
  blocks: (propertyId?: string | null) => ["property", propertyId, "blocks"] as const,
  floors: (propertyId?: string | null, blockId?: string | null) =>
    ["property", propertyId, "blocks", blockId, "floors"] as const,
  rooms: (propertyId?: string | null, blockId?: string | null, floorId?: string | null) =>
    ["property", propertyId, "rooms", { blockId, floorId }] as const,
  roomsList: (propertyId?: string | null, blockId?: string | null, floorId?: string | null) =>
    ["property", propertyId, "rooms-list", { blockId, floorId }] as const,
  tenants: (propertyId?: string | null) => ["property", propertyId, "tenants"] as const,
  tenantDetail: (propertyId?: string | null, tenantId?: string | null) =>
    ["property", propertyId, "tenants", tenantId] as const,
  allRoomsAndCounts: (propertyId?: string | null) =>
    ["property", propertyId, "all-rooms-and-counts"] as const,
  complaints: (propertyId?: string | null, priority?: string) =>
    ["property", propertyId, "complaints", priority ?? "all"] as const,
  amenities: (propertyId?: string | null) => ["property", propertyId, "amenities"] as const,
  restrictions: (propertyId?: string | null) => ["property", propertyId, "restrictions"] as const,
  dining: (propertyId?: string | null) => ["property", propertyId, "dining-schedule"] as const,
  staff: (propertyId?: string | null) => ["property", propertyId, "staff"] as const,
  designations: () => ["designations"] as const,
  myFeatures: () => ["my-features"] as const,
  staffPermissions: () => ["staff-permissions"] as const,
};

export function useBlocks(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.blocks(propertyId),
    queryFn: async () => (propertyId ? toArray<BlockItem>(await getBlocks(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useFloors(propertyId?: string | null, blockId?: string | null) {
  return useQuery({
    queryKey: queryKeys.floors(propertyId, blockId),
    queryFn: async () => (propertyId && blockId ? toArray<FloorItem>(await getFloors(propertyId, blockId)) : []),
    enabled: Boolean(propertyId && blockId),
  });
}

export function useRooms(propertyId?: string | null, blockId?: string | null, floorId?: string | null) {
  return useQuery({
    queryKey: queryKeys.rooms(propertyId, blockId, floorId),
    queryFn: async () => {
      if (!propertyId) return [];
      const raw = await getRooms(propertyId, {
        page: 1,
        limit: 50,
        blockId: blockId || undefined,
        floorId: floorId || undefined,
      });
      return roomsFromListResponse(raw);
    },
    enabled: Boolean(propertyId && blockId && floorId),
  });
}

export type UseRoomsListOptions = {
  /**
   * When `true` (default, e.g. Add Tenant), rooms load only after block + floor are known.
   * When `false` (e.g. Tenants → Rooms & beds), load via fallbacks so the list isn’t empty while blocks/floors load or if only propertyId is set.
   */
  requireBlockAndFloor?: boolean;
};

export function useRoomsList(
  propertyId?: string | null,
  blockId?: string | null,
  floorId?: string | null,
  options?: UseRoomsListOptions,
) {
  const strict = options?.requireBlockAndFloor !== false;

  return useQuery({
    queryKey: [...queryKeys.roomsList(propertyId, blockId, floorId), strict ? "strict" : "loose"] as const,
    queryFn: async () => {
      if (!propertyId) return [];
      const bid = blockId?.trim();
      const fid = floorId?.trim();

      if (bid && fid) {
        let rooms: RoomItem[] = [];
        try {
          const rawAlt = await getRooms(propertyId, {
            page: 1,
            limit: 200,
            blockId: bid,
            floorId: fid,
          });
          rooms = roomsFromListResponse(rawAlt);
        } catch (err) {
          console.error("Failed to fetch rooms via getRooms:", err);
        }
        return rooms;
      }

      if (strict) return [];

      if (bid && !fid) {
        const raw = await getRooms(propertyId, {
          page: 1,
          limit: 400,
          blockId: bid,
        });
        return roomsFromListResponse(raw);
      }

      const rawAll = await getRooms(propertyId, { page: 1, limit: 500 });
      return roomsFromListResponse(rawAll);
    },
    enabled: strict ? Boolean(propertyId && blockId && floorId) : Boolean(propertyId),
  });
}

export function usePropertyTenants(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.tenants(propertyId),
    queryFn: () => getPropertyTenants(propertyId!),
    enabled: Boolean(propertyId),
  });
}

export function usePropertyTenantDetail(propertyId?: string | null, tenantId?: string | null) {
  return useQuery({
    queryKey: queryKeys.tenantDetail(propertyId, tenantId),
    queryFn: async () => {
      if (!propertyId || !tenantId) return null;
      const list = await getPropertyTenants(propertyId);
      const found = list.find((t) => (t.roomTenant?.id ?? t.id) === tenantId || t.id === tenantId);
      if (!found) {
        throw new Error("Tenant not found");
      }
      return found;
    },
    enabled: Boolean(propertyId && tenantId),
  });
}

export function useCreateBlock(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => {
      if (!propertyId) throw new Error("Select a PG first");
      return createBlock(propertyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blocks(propertyId) });
    },
  });
}

export function useCreateFloor(propertyId?: string | null, blockId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; displayOrder?: number }) => {
      if (!propertyId || !blockId) throw new Error("Select PG and block first");
      return createFloor(propertyId, blockId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.floors(propertyId, blockId) });
    },
  });
}

export function useCreateRoom(propertyId?: string | null, blockId?: string | null, floorId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateRoomPayload, "floorId"> & { floorId?: string }) => {
      if (!propertyId) throw new Error("Select a PG first");
      const finalFloorId = payload.floorId ?? floorId;
      if (!finalFloorId) throw new Error("Select a floor first");
      return createRoom(propertyId, {
        floorId: finalFloorId,
        roomNumber: payload.roomNumber,
        numberOfBeds: payload.numberOfBeds,
        sharingWisePricing: payload.sharingWisePricing,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rooms(propertyId, blockId, floorId) });
      qc.invalidateQueries({ queryKey: ["property", propertyId, "rooms-list"] });
    },
  });
}

export function useUpdatePropertyMutation() {
  return useMutation({
    mutationFn: ({ propertyId, payload }: { propertyId: string; payload: UpdatePropertyPayload }) =>
      updateProperty(propertyId, payload),
  });
}

export function useComplaints(propertyId?: string | null, priority?: string) {
  return useQuery({
    queryKey: queryKeys.complaints(propertyId, priority),
    queryFn: async () => {
      if (!propertyId) return [];
      const params = priority && priority !== "all" ? { priority } : undefined;
      return toArray<Complaint>(await getComplaintsByProperty(propertyId, params));
    },
    enabled: Boolean(propertyId),
  });
}

export function useUpdateComplaintStatus(propertyId?: string | null, priority?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, payload }: { complaintId: string; payload: UpdateComplaintStatusPayload }) =>
      updateComplaintStatus(complaintId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.complaints(propertyId, priority) });
    },
  });
}

export function useAmenities(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.amenities(propertyId),
    queryFn: async () => (propertyId ? toArray<PropertyAmenity>(await getPropertyAmenities(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useRestrictions(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.restrictions(propertyId),
    queryFn: async () => (propertyId ? toArray<PropertyRestriction>(await getPropertyRestrictions(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useCreateCustomAmenity(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => {
      if (!propertyId) throw new Error("Select a PG first");
      return createCustomAmenity(propertyId, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.amenities(propertyId) }),
  });
}

export function useLinkAmenities(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amenityIds: string[] }) => {
      if (!propertyId) throw new Error("Select a PG first");
      return linkAmenities(propertyId, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.amenities(propertyId) }),
  });
}

export function useCreateCustomRestriction(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => {
      if (!propertyId) throw new Error("Select a PG first");
      return createCustomRestriction(propertyId, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.restrictions(propertyId) }),
  });
}

export function useLinkRestrictions(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { restrictionIds: string[] }) => {
      if (!propertyId) throw new Error("Select a PG first");
      return linkRestrictions(propertyId, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.restrictions(propertyId) }),
  });
}

export function useDiningSchedule(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.dining(propertyId),
    queryFn: async () => {
      if (!propertyId) return [];
      const raw = await getDiningSchedule(propertyId);
      return Array.isArray(raw) ? raw : raw?.schedule ?? [];
    },
    enabled: Boolean(propertyId),
  });
}

export function useUpdateDiningSchedule(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schedule: DiningDaySchedule[]) => {
      if (!propertyId) throw new Error("Select a PG first");
      return updateDiningSchedule(propertyId, { schedule });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dining(propertyId) }),
  });
}

/* ─── Dashboard / cross-cutting hooks ─────────────────────────────────────── */

export function useAllRoomsAndCounts(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.allRoomsAndCounts(propertyId),
    queryFn: async () => (propertyId ? toArray<RoomAndCount>(await getAllRoomsAndCounts(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useMyFeaturesQuery() {
  return useQuery({
    queryKey: queryKeys.myFeatures(),
    queryFn: getMyFeatures,
  });
}

/* ─── Staff hooks (React Query) ───────────────────────────────────────────── */

export function useStaffList(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.staff(propertyId),
    queryFn: async () => (propertyId ? toArray<StaffWithPermissions>(await getAllStaffWithPermissions(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useDesignationsQuery() {
  return useQuery({
    queryKey: queryKeys.designations(),
    queryFn: async () => toArray<Designation>(await getDesignations()),
  });
}

export function useStaffPermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.staffPermissions(),
    queryFn: async () => toArray<PermissionItem>(await getStaffPermissions()),
  });
}

export function useCreateStaffMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => createStaff(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff(propertyId) });
    },
  });
}

export function useDashboardDetails(propertyId?: string | null) {
  return useQuery({
    queryKey: ["dashboard-details", propertyId],
    queryFn: () => getDashboardDetails(propertyId!),
    enabled: Boolean(propertyId),
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: getDashboardKpis,
  });
}

export function useKycApplications() {
  return useQuery({
    queryKey: ["kyc-applications"],
    queryFn: async () => {
      const raw = await getKycApplications();
      return toArray(raw);
    },
  });
}

export function useApproveKycMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => approveKycApplication(applicationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-applications"] }),
  });
}

export function useRejectKycMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      rejectKycApplication(applicationId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-applications"] }),
  });
}

export function useKycDetail(roomTenantId?: string | null) {
  return useQuery({
    queryKey: ["kyc-detail", roomTenantId],
    queryFn: () => getKycByRoomTenantId(roomTenantId!),
    enabled: Boolean(roomTenantId),
  });
}

export function useRentCollectionDashboard(
  propertyId?: string | null,
  periodMonth?: number,
  periodYear?: number
) {
  return useQuery({
    queryKey: ["rent-collection-dashboard", propertyId, periodMonth, periodYear],
    queryFn: () => getRentCollectionDashboard(propertyId!, periodMonth!, periodYear!),
    enabled: Boolean(propertyId && periodMonth != null && periodYear != null),
  });
}

export function usePostManualRentMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualRentCollectionPayload) => {
      if (!propertyId) throw new Error("Select a PG first");
      return postManualRentCollection(propertyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rent-collection-dashboard"] });
    },
  });
}

export function useAnalyticsPgGrowth() {
  return useQuery({
    queryKey: ["analytics-pg-growth"],
    queryFn: getAnalyticsPgGrowth,
  });
}

export function useAnalyticsRevenue(propertyId?: string | null) {
  return useQuery({
    queryKey: ["analytics-revenue", propertyId],
    queryFn: () => getAnalyticsRevenue(propertyId!),
    enabled: Boolean(propertyId),
  });
}

export function useAnalyticsOccupancy(propertyId?: string | null) {
  return useQuery({
    queryKey: ["analytics-occupancy", propertyId],
    queryFn: () => getAnalyticsOccupancy(propertyId!),
    enabled: Boolean(propertyId),
  });
}

export function useStaffPermissionTiers() {
  return useQuery({
    queryKey: ["staff-permission-tiers"],
    queryFn: async () => {
      const raw = await getStaffPermissionTiers();
      return toArray(raw);
    },
  });
}

export function useCreateStaffPermissionTierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffPermissionTierPayload) => createStaffPermissionTier(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-permission-tiers"] }),
  });
}

export function useLinkPermissionToTierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, permissionId }: { tierId: string; permissionId: string }) =>
      linkPermissionToStaffTier(tierId, permissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-permission-tiers"] }),
  });
}

export function useAssignStaffRoleMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { staffId: string; permissionTierId: string }) => assignStaffRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff(propertyId) });
    },
  });
}

export function useStaffMemberRolesQuery(staffId?: string | null) {
  return useQuery({
    queryKey: ["staff-member-roles", staffId],
    queryFn: () => getStaffMemberRoles(staffId!),
    enabled: Boolean(staffId),
  });
}

export function useStaffPermissionsByIdQuery(staffId?: string | null) {
  return useQuery({
    queryKey: ["staff-permissions-by-staff", staffId],
    queryFn: () => getStaffPermissionsById(staffId!),
    enabled: Boolean(staffId),
  });
}

export function useUpdateStaffPermissionsMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, payload }: { staffId: string; payload: UpdateStaffPermissionsPayload }) =>
      updateStaffPermissions(staffId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff(propertyId) });
      qc.invalidateQueries({ queryKey: ["staff-permissions-by-staff"] });
    },
  });
}

export function useCreateStaffPermissionDefinitionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPermissionDefinitionPayload) => createStaffPermissionDefinition(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staffPermissions() });
    },
  });
}

export function useStaffPermissionsAssignMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, payload }: { staffId: string; payload: StaffPermissionsAssignPayload }) =>
      staffPermissionsAssign(staffId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff(propertyId) });
    },
  });
}

export function useUploadPhotoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["property-owner", "me"] });
    },
  });
}

// ==========================================================
// VERIFICATION CREDITS & TOP-UPS HOOKS
// ==========================================================

export function useCreditBalance() {
  return useQuery({
    queryKey: ['creditBalance'],
    queryFn: () => getCreditBalance(),
    staleTime: 30_000,
  });
}

export function useCreditPacks() {
  return useQuery({
    queryKey: ['creditPacks'],
    queryFn: () => getCreditPacks(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCreditTopupOrderMutation() {
  return useMutation({
    mutationFn: (creditPackId: string) => createCreditTopupOrder(creditPackId),
  });
}

export function useVerifyCreditPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyCreditPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
    },
  });
}

export function useRequestTenantKycMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomTenantId: string) => requestTenantKyc(roomTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
      queryClient.invalidateQueries({ queryKey: ['kycApplications'] });
      queryClient.invalidateQueries({ queryKey: ['propertyTenants'] });
    },
  });
}

// ==========================================================
// PLANS & SUBSCRIPTIONS HOOKS
// ==========================================================

export function usePlansList() {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => getPlans(),
    staleTime: 10 * 60_000,
  });
}

export function useCurrentPlan() {
  return useQuery({
    queryKey: ['currentPlan'],
    queryFn: () => getCurrentPlan(),
    staleTime: 30_000,
  });
}

export function useCreatePlanCheckoutOrderMutation() {
  return useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: string; billingCycle?: 'monthly' | 'annual' }) =>
      createPlanCheckoutOrder(planId, billingCycle),
  });
}

export function useVerifyPlanPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyPlanPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentPlan'] });
      queryClient.invalidateQueries({ queryKey: ['myFeatures'] });
    },
  });
}

// ==========================================================
// RENTAL AGREEMENTS HOOKS
// ==========================================================

export function usePropertyAgreements(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: ['agreements', propertyId],
    queryFn: () => getPropertyAgreements(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useCreateAgreementMutation(propertyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createRentalAgreement>[1]) =>
      createRentalAgreement(propertyId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements', propertyId] });
    },
  });
}

export function useSendAgreementEsignMutation(propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) => sendAgreementForEsign(agreementId),
    onSuccess: () => {
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['agreements', propertyId] });
      }
    },
  });
}

// ==========================================================
// NOTICE PERIOD HOOKS
// ==========================================================

export function useSetTenantNoticeMutation(propertyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomTenantId, body }: { roomTenantId: string; body: Parameters<typeof setTenantNotice>[2] }) =>
      setTenantNotice(propertyId!, roomTenantId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyTenants'] });
    },
  });
}

export function useClearTenantNoticeMutation(propertyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomTenantId: string) => clearTenantNotice(propertyId!, roomTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyTenants'] });
    },
  });
}

// ==========================================================
// ELECTRICITY METER DUES HOOKS
// ==========================================================

export function useElectricityDues(propertyId: string | null | undefined, roomTenantId: string | null | undefined) {
  return useQuery({
    queryKey: ['electricityDues', propertyId, roomTenantId],
    queryFn: () => getElectricityDues(propertyId!, roomTenantId!),
    enabled: Boolean(propertyId && roomTenantId),
    staleTime: 30_000,
  });
}

export function useAddElectricityDuesMutation(propertyId: string | null | undefined, roomTenantId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof addElectricityDues>[2]) =>
      addElectricityDues(propertyId!, roomTenantId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricityDues', propertyId, roomTenantId] });
      queryClient.invalidateQueries({ queryKey: ['rentCollectionDashboard'] });
    },
  });
}

export function useUpdateElectricityDuesMutation(propertyId: string | null | undefined, roomTenantId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ duesId, body }: { duesId: string; body: Parameters<typeof updateElectricityDues>[3] }) =>
      updateElectricityDues(propertyId!, roomTenantId!, duesId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricityDues', propertyId, roomTenantId] });
      queryClient.invalidateQueries({ queryKey: ['rentCollectionDashboard'] });
    },
  });
}

export function useDeleteElectricityDuesMutation(propertyId: string | null | undefined, roomTenantId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (duesId: string) => deleteElectricityDues(propertyId!, roomTenantId!, duesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricityDues', propertyId, roomTenantId] });
      queryClient.invalidateQueries({ queryKey: ['rentCollectionDashboard'] });
    },
  });
}

// ==========================================================
// WIFI MANAGEMENT HOOKS
// ==========================================================

export function useWifiHierarchy(propertyId?: string | null) {
  return useQuery({
    queryKey: ['wifiHierarchy', propertyId],
    queryFn: () => getWifiHierarchy(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });
}

export function useUpdateFloorWifiMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ floorId, payload }: { floorId: string; payload: { wifiSsid: string; wifiPassword?: string; wifiDetails?: any } }) =>
      updateFloorWifi(propertyId!, floorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifiHierarchy', propertyId] });
    },
  });
}

export function useUpdateBlockWifiMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, payload }: { blockId: string; payload: { wifiSsid: string; wifiPassword?: string } }) =>
      updateBlockWifi(propertyId!, blockId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifiHierarchy', propertyId] });
    },
  });
}

export function useUpdatePropertyWifiHierarchyMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { blocks?: any[]; floors?: any[] }) =>
      updatePropertyWifiHierarchy(propertyId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifiHierarchy', propertyId] });
    },
  });
}

// ==========================================================
// GUEST REQUESTS HOOKS
// ==========================================================

export function useGuestRequests(propertyId?: string | null, status = "pending") {
  return useQuery({
    queryKey: ['guestRequests', propertyId, status],
    queryFn: () => getGuestRequests(propertyId!, status),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useUpdateGuestRequestStatusMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: { status: "approved" | "rejected"; remarks?: string } }) =>
      updateGuestRequestStatus(propertyId!, requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestRequests', propertyId] });
    },
  });
}

// ==========================================================
// NIGHT OUT REQUESTS HOOKS
// ==========================================================

export function useNightOutRequests(propertyId?: string | null, status = "pending") {
  return useQuery({
    queryKey: ['nightOutRequests', propertyId, status],
    queryFn: () => getNightOutRequests(propertyId!, status),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useUpdateNightOutRequestStatusMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: { status: "approved" | "rejected"; remarks?: string } }) =>
      updateNightOutRequestStatus(propertyId!, requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nightOutRequests', propertyId] });
    },
  });
}

// ==========================================================
// PROPERTY NOTICES HOOKS
// ==========================================================

export function usePropertyNotices(propertyId?: string | null) {
  return useQuery({
    queryKey: ['propertyNotices', propertyId],
    queryFn: () => getPropertyNotices(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useCreatePropertyNoticeMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createPropertyNotice>[1]) =>
      createPropertyNotice(propertyId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyNotices', propertyId] });
    },
  });
}

export function useDeletePropertyNoticeMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeId: string) => deletePropertyNotice(propertyId!, noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyNotices', propertyId] });
    },
  });
}

// ==========================================================
// ACTIVITY LOGS HOOKS
// ==========================================================

export function useActivityLogs(params?: { limit?: number; offset?: number; module?: string; action?: string }) {
  return useQuery({
    queryKey: ['activityLogs', params],
    queryFn: () => getActivityLogs(params),
    staleTime: 30_000,
  });
}

export function useActivityLogModules() {
  return useQuery({
    queryKey: ['activityLogModules'],
    queryFn: () => getActivityLogModules(),
    staleTime: 300_000,
  });
}

export function useUpdateBlockMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, name, displayOrder }: { blockId: string; name?: string; displayOrder?: number }) =>
      updateBlock(propertyId!, blockId, { name, displayOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useDeleteBlockMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => deleteBlock(propertyId!, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useUpdateFloorMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ floorId, name, displayOrder, blockId }: { floorId: string; name?: string; displayOrder?: number; blockId?: string }) =>
      updateFloor(propertyId!, floorId, { name, displayOrder, blockId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useDeleteFloorMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (floorId: string) => deleteFloor(propertyId!, floorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useDeleteRoomMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => deleteRoom(propertyId!, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useMoveTenantMutation(propertyId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MoveTenantPayload) => moveTenant(propertyId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

