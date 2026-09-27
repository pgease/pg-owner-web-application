import { useMemo } from "react";
import {
  useAllRoomsAndCounts,
  useComplaints,
  usePropertyTenants,
  useRentCollectionDashboard,
  useKycApplications,
  useCreditBalance,
} from "@/hooks/usePropertyOwnerQueries";
import type { PropertyTenant, RentDashboardTenantRow } from "@/api/propertyOwner";
import { amountFromRow, parseRentTenantRow } from "@/lib/rentDashboard";

export interface DashboardRoom {
  id: string;
  roomNumber: string;
  floorNumber?: number;
  block?: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  isFull: boolean;
}

export interface PendingRentRow {
  key: string;
  roomTenantId: string;
  tenantId: string;
  name: string;
  roomNumber?: string;
  amount?: number;
  raw: RentDashboardTenantRow;
}

function isTenantOnNotice(t: PropertyTenant): boolean {
  // `normalizeSingleTenant` already folds every notice signal into `isOnNotice`;
  // `notice` is always an object there, so it must not be used as a truthy flag.
  return Boolean(t.isOnNotice || t.notice?.isOnNotice || t.noticeGivenAt || t.expectedMoveOutDate);
}

function isTenantKycVerified(t: PropertyTenant): boolean {
  if (t.kycVerified || t.aadhaarVerified || t.isKycVerified) return true;
  const s = String(t.kycStatus ?? "").toLowerCase();
  return s === "verified" || s === "approved" || s === "completed";
}

/**
 * Aggregates every real data source the dashboard needs. No fallbacks to invented values:
 * when a source is unavailable the corresponding field is `undefined` and the UI hides it.
 */
export function useDashboardData(propertyId: string | null) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const roomsQuery = useAllRoomsAndCounts(propertyId);
  const tenantsQuery = usePropertyTenants(propertyId);
  const complaintsQuery = useComplaints(propertyId);
  const rentQuery = useRentCollectionDashboard(propertyId, month, year);
  const kycQuery = useKycApplications();
  const creditsQuery = useCreditBalance();

  const rooms = useMemo<DashboardRoom[]>(() => {
    const raw = roomsQuery.data ?? [];
    return raw.map((r, i) => {
      const total = Number(r.totalBeds ?? 0);
      const occupied = Number(r.occupiedBeds ?? 0);
      const available = Number(r.availableBeds ?? Math.max(total - occupied, 0));
      return {
        id: String(r.roomId ?? `room-${i}`),
        roomNumber: String(r.roomNumber ?? i + 1),
        floorNumber: r.floorNumber,
        block: r.block,
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: available,
        isFull: total > 0 && occupied >= total,
      };
    });
  }, [roomsQuery.data]);

  const beds = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
    const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
    const vacantBeds = rooms.reduce((s, r) => s + r.availableBeds, 0);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return { totalBeds, occupiedBeds, vacantBeds, occupancyPct };
  }, [rooms]);

  const tenants = useMemo(() => {
    const list = (tenantsQuery.data as PropertyTenant[] | undefined) ?? [];
    return {
      total: list.length,
      onNotice: list.filter(isTenantOnNotice).length,
      kycPending: list.filter((t) => !isTenantKycVerified(t)).length,
    };
  }, [tenantsQuery.data]);

  const complaints = useMemo(() => {
    const list = complaintsQuery.data ?? [];
    const norm = (s: string) => String(s ?? "").toLowerCase();
    return {
      open: list.filter((c) => norm(c.status) === "open").length,
      inProgress: list.filter((c) => norm(c.status) === "in_progress").length,
      total: list.length,
    };
  }, [complaintsQuery.data]);

  const rent = useMemo(() => {
    const d = rentQuery.data;
    const unpaid: PendingRentRow[] = [];
    (d?.unpaidTenants ?? []).forEach((row, i) => {
      const p = parseRentTenantRow(row);
      if (!p) return;
      const roomNumber = row.roomNumber ?? row.room_number;
      unpaid.push({
        key: `${p.roomTenantId}|${p.tenantId}|${i}`,
        roomTenantId: p.roomTenantId,
        tenantId: p.tenantId,
        name: String(row.tenantName ?? row.name ?? row.tenant_name ?? "Tenant"),
        roomNumber: roomNumber != null && roomNumber !== "" ? String(roomNumber) : undefined,
        amount: amountFromRow(row),
        raw: row,
      });
    });

    const pendingAmount = unpaid.reduce((s, r) => s + (r.amount ?? 0), 0);
    const hasAnyAmount = unpaid.some((r) => r.amount != null);

    return {
      collectedThisMonth: d?.totalCollectedThisPeriod,
      paidCount: d?.paidCount,
      unpaidCount: d?.unpaidCount ?? (d ? unpaid.length : undefined),
      pendingAmount: hasAnyAmount ? pendingAmount : undefined,
      unpaid,
      month,
      year,
    };
  }, [rentQuery.data, month, year]);

  const kyc = useMemo(() => {
    const rows = (kycQuery.data as Array<Record<string, unknown>> | undefined) ?? [];
    const scoped = propertyId ? rows.filter((r) => !r.propertyId || r.propertyId === propertyId) : rows;
    const pending = scoped.filter((r) => {
      const s = String(r.status ?? "pending").toLowerCase();
      return !["completed", "approved", "verified", "rejected"].includes(s) && !r.processing_done;
    }).length;
    return { pendingApplications: pending };
  }, [kycQuery.data, propertyId]);

  const credits = useMemo(() => {
    const c = creditsQuery.data;
    if (!c) return { remaining: undefined as number | undefined, isLow: false, isBlocked: false };
    const remaining = Number(c.remainingCredits ?? 0);
    return { remaining, isLow: remaining <= 2, isBlocked: Boolean(c.isBlocked) };
  }, [creditsQuery.data]);

  const isLoading = roomsQuery.isLoading || tenantsQuery.isLoading;
  const isError = roomsQuery.isError && tenantsQuery.isError;

  const refetchAll = () => {
    void roomsQuery.refetch();
    void tenantsQuery.refetch();
    void complaintsQuery.refetch();
    void rentQuery.refetch();
    void kycQuery.refetch();
    void creditsQuery.refetch();
  };

  return {
    rooms,
    beds,
    tenants,
    complaints,
    rent,
    kyc,
    credits,
    loading: {
      rooms: roomsQuery.isLoading,
      tenants: tenantsQuery.isLoading,
      complaints: complaintsQuery.isLoading,
      rent: rentQuery.isLoading,
      kyc: kycQuery.isLoading,
    },
    errors: {
      rooms: roomsQuery.isError,
      tenants: tenantsQuery.isError,
      complaints: complaintsQuery.isError,
      rent: rentQuery.isError,
    },
    isLoading,
    isError,
    isFetching: roomsQuery.isFetching || tenantsQuery.isFetching || rentQuery.isFetching,
    refetchAll,
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
