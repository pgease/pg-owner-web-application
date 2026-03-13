import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBlock,
  createCustomAmenity,
  createCustomRestriction,
  createFloor,
  createRoom,
  createStaff,
  getAllRoomsAndCounts,
  getAllStaffWithPermissions,
  getBlocks,
  getComplaintsByProperty,
  getDesignations,
  getDiningSchedule,
  getFloors,
  getMyFeatures,
  getPropertyAmenities,
  getPropertyRestrictions,
  getRooms,
  getRoomsList,
  getStaffPermissions,
  linkAmenities,
  linkRestrictions,
  updateComplaintStatus,
  updateDiningSchedule,
  updateStaffPermissions,
  type CreateRoomPayload,
  type CreateStaffPayload,
  type DiningDaySchedule,
  type UpdateComplaintStatusPayload,
  type UpdateStaffPermissionsPayload,
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

export const queryKeys = {
  blocks: (propertyId?: string | null) => ["property", propertyId, "blocks"] as const,
  floors: (propertyId?: string | null, blockId?: string | null) =>
    ["property", propertyId, "blocks", blockId, "floors"] as const,
  rooms: (propertyId?: string | null, blockId?: string | null, floorId?: string | null) =>
    ["property", propertyId, "rooms", { blockId, floorId }] as const,
  roomsList: (propertyId?: string | null, blockId?: string | null, floorId?: string | null) =>
    ["property", propertyId, "rooms-list", { blockId, floorId }] as const,
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
      const raw = await getRooms(propertyId, { page: 1, limit: 50, blockId: blockId || undefined, floorId: floorId || undefined });
      return Array.isArray(raw) ? raw : raw?.data ?? [];
    },
    enabled: Boolean(propertyId),
  });
}

export function useRoomsList(propertyId?: string | null, blockId?: string | null, floorId?: string | null) {
  return useQuery({
    queryKey: queryKeys.roomsList(propertyId, blockId, floorId),
    queryFn: async () => {
      if (!propertyId) return [];
      const raw = await getRoomsList(propertyId, { blockId: blockId || undefined, floorId: floorId || undefined });
      return Array.isArray(raw) ? raw : raw?.data ?? [];
    },
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
      const finalFloorId = payload.floorId || floorId;
      if (!finalFloorId) throw new Error("Select a floor first");
      return createRoom(propertyId, { ...payload, floorId: finalFloorId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rooms(propertyId, blockId, floorId) });
      qc.invalidateQueries({ queryKey: queryKeys.roomsList(propertyId, blockId, floorId) });
    },
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

export function useUpdateStaffPermissionsMutation(propertyId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, payload }: { staffId: string; payload: UpdateStaffPermissionsPayload }) =>
      updateStaffPermissions(staffId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff(propertyId) });
    },
  });
}
