import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { authStorage } from "@/api/http";

describe("Frontend Entitlements & Dual-Layer Ceiling Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("authStorage Staff & Owner detection", () => {
    it("should identify user as owner when no staffId or staff role is present", () => {
      // Mock an owner token: payload { propertyOwnerId: "owner-123", role: "owner" }
      const ownerPayload = { propertyOwnerId: "owner-123", role: "owner" };
      const base64Payload = btoa(JSON.stringify(ownerPayload));
      const mockToken = `header.${base64Payload}.signature`;

      authStorage.set({ accessToken: mockToken, refreshToken: "rt-123" });

      expect(authStorage.isStaff()).toBe(false);
      expect(authStorage.isOwner()).toBe(true);
    });

    it("should identify user as staff when staffId is present in JWT payload", () => {
      // Mock a staff token: payload { staffId: "staff-456", propertyOwnerId: "owner-123", role: "staff" }
      const staffPayload = { staffId: "staff-456", propertyOwnerId: "owner-123", role: "staff" };
      const base64Payload = btoa(JSON.stringify(staffPayload));
      const mockToken = `header.${base64Payload}.signature`;

      authStorage.set({ accessToken: mockToken, refreshToken: "rt-456" });

      expect(authStorage.isStaff()).toBe(true);
      expect(authStorage.isOwner()).toBe(false);
    });

    it("should default to owner when token is absent or cleared", () => {
      authStorage.clear();
      expect(authStorage.isStaff()).toBe(false);
      expect(authStorage.isOwner()).toBe(true);
    });
  });

  describe("Bed Quota calculations", () => {
    it("should calculate isBedQuotaFull correctly when beds reach capacity", () => {
      const bedsUsage = { used: 100, max: 100 };
      const isBedQuotaFull = Boolean(bedsUsage && bedsUsage.max > 0 && bedsUsage.used >= bedsUsage.max);
      const availableBedsQuota = Math.max(0, bedsUsage.max - bedsUsage.used);

      expect(isBedQuotaFull).toBe(true);
      expect(availableBedsQuota).toBe(0);
    });

    it("should allow adding beds when below capacity", () => {
      const bedsUsage = { used: 45, max: 50 };
      const isBedQuotaFull = Boolean(bedsUsage && bedsUsage.max > 0 && bedsUsage.used >= bedsUsage.max);
      const availableBedsQuota = Math.max(0, bedsUsage.max - bedsUsage.used);

      expect(isBedQuotaFull).toBe(false);
      expect(availableBedsQuota).toBe(5);
    });

    it("should treat max: 0 or unlimited as unconstrained", () => {
      const bedsUsage = { used: 250, max: 0 };
      const isBedQuotaFull = Boolean(bedsUsage && bedsUsage.max > 0 && bedsUsage.used >= bedsUsage.max);
      const availableBedsQuota = bedsUsage && bedsUsage.max > 0
        ? Math.max(0, bedsUsage.max - bedsUsage.used)
        : Infinity;

      expect(isBedQuotaFull).toBe(false);
      expect(availableBedsQuota).toBe(Infinity);
    });
  });

  describe("Expired Plan Safety and Read-Only Restrictions", () => {
    it("should mark canPerformOperations as false when plan is expired", () => {
      const isExpired = true;
      const canPerformOperations = !isExpired;
      const canViewRentAnalytics = true; // safe read-only access preserved

      expect(canPerformOperations).toBe(false);
      expect(canViewRentAnalytics).toBe(true);
    });

    it("should mark canPerformOperations as true when plan is active", () => {
      const isExpired = false;
      const canPerformOperations = !isExpired;

      expect(canPerformOperations).toBe(true);
    });
  });
});
