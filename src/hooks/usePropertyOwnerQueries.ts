import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  createCustomAmenity,
  createCustomRestriction,
  createFloor,
  createRoom,
  createStaff,
  type CreateRoomPayload,
  type CreateStaffPayload,
  type CreateStaffPermissionDefinitionPayload,
  type DiningDaySchedule,
  type ManualRentCollectionPayload,
  type RoomItem,
  type StaffPermissionTierPayload,
  type UpdateComplaintStatusPayload,
  type UpdatePropertyPayload,
  type UpdateStaffPermissionsPayload,
  type StaffPermissionsAssignPayload,
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
  const bedsArr = Array.isArray(r.beds) ? (r.beds as Record<string, unknown>[]) : null;

  const hasExplicitTotal =
    r.numberOfBeds !== undefined && r.numberOfBeds !== null && String(r.numberOfBeds).trim() !== "";
  const hasExplicitCapacity =
    r.capacity !== undefined && r.capacity !== null && String(r.capacity).trim() !== "";

  let numberOfBeds =
    coerceNum(r.numberOfBeds) ||
    coerceNum(r.capacity) ||
    (bedsArr ? bedsArr.length : 0);

  let occupiedBeds = coerceNum(r.occupiedBeds);
  if (bedsArr && bedsArr.length > 0) {
    const fromBeds = bedsArr.filter((b) => b && b.isOccupied === true).length;
    if (fromBeds > 0 || bedsArr.some((b) => b && Object.prototype.hasOwnProperty.call(b, "isOccupied"))) {
      occupiedBeds = fromBeds;
    }
  }

  const hasExplicitAvailable =
    r.availableBeds !== undefined && r.availableBeds !== null && String(r.availableBeds).trim() !== "";
  let availableBeds: number;
  if (hasExplicitAvailable) {
    const av = coerceNum(r.availableBeds);
    availableBeds = Math.max(0, av);
  } else if (bedsArr && bedsArr.length > 0) {
    availableBeds = bedsArr.filter((b) => b && b.isOccupied !== true).length;
  } else {
    availableBeds = Math.max(0, numberOfBeds - occupiedBeds);
  }

  const isVacantFlag =
    typeof r.isVacant === "boolean"
      ? r.isVacant
      : r.status === "vacant" || String(r.status ?? "").toLowerCase() === "vacant";

  const missingInventory =
    numberOfBeds === 0 &&
    availableBeds === 0 &&
    !hasExplicitAvailable &&
    !hasExplicitTotal &&
    !hasExplicitCapacity &&
    (!bedsArr || bedsArr.length === 0);

  if (missingInventory) {
    numberOfBeds = 1;
    occupiedBeds = 0;
    availableBeds = 1;
  }

  const rawRoomId = r.id ?? (r as Record<string, unknown>).roomId;
  const idStr = rawRoomId != null && String(rawRoomId).trim() !== "" ? String(rawRoomId) : "";

  return {
    id: idStr,
    propertyId: String(r.propertyId ?? ""),
    floorId: String(r.floorId ?? ""),
    blockId: r.blockId != null ? String(r.blockId) : undefined,
    name: r.name != null ? String(r.name) : undefined,
    roomNumber: String(r.roomNumber ?? r.name ?? ""),
    numberOfBeds,
    capacity: coerceNum(r.capacity) > 0 ? coerceNum(r.capacity) : undefined,
    sharingWisePricing: r.sharingWisePricing as RoomItem["sharingWisePricing"],
    occupiedBeds,
    availableBeds,
    isVacant: isVacantFlag,
    status: r.status != null ? String(r.status) : undefined,
    floor: coerceFloorBlockLabel(r.floor),
    block: coerceFloorBlockLabel(r.block),
    createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
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
    queryFn: async () => (propertyId ? toArray(await getBlocks(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useFloors(propertyId?: string | null, blockId?: string | null) {
  return useQuery({
    queryKey: queryKeys.floors(propertyId, blockId),
    queryFn: async () => (propertyId && blockId ? toArray(await getFloors(propertyId, blockId)) : []),
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
        const raw = await getRoomsList(propertyId, { blockId: bid, floorId: fid });
        let rooms = roomsFromListResponse(raw);
        if (rooms.length === 0) {
          const rawAlt = await getRooms(propertyId, {
            page: 1,
            limit: 200,
            blockId: bid,
            floorId: fid,
          });
          rooms = roomsFromListResponse(rawAlt);
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
    mutationFn: (payload: { name: string }) => {
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
      return toArray(await getComplaintsByProperty(propertyId, params));
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
    queryFn: async () => (propertyId ? toArray(await getPropertyAmenities(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useRestrictions(propertyId?: string | null) {
  return useQuery({
    queryKey: queryKeys.restrictions(propertyId),
    queryFn: async () => (propertyId ? toArray(await getPropertyRestrictions(propertyId)) : []),
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
    queryFn: async () => (propertyId ? toArray(await getAllRoomsAndCounts(propertyId)) : []),
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
    queryFn: async () => (propertyId ? toArray(await getAllStaffWithPermissions(propertyId)) : []),
    enabled: Boolean(propertyId),
  });
}

export function useDesignationsQuery() {
  return useQuery({
    queryKey: queryKeys.designations(),
    queryFn: async () => toArray(await getDesignations()),
  });
}

export function useStaffPermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.staffPermissions(),
    queryFn: async () => toArray(await getStaffPermissions()),
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
