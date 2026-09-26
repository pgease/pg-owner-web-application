import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import {
  getSettlementBankAccount,
  updateSettlementBankAccount,
  lookupIfsc,
  getTenantPaymentLink,
} from "../api/propertyOwner";

describe("Settlement Bank Account & Tenant Payment Link APIs", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: RequestInfo | URL, options?: RequestInit) => {
      const urlStr = String(url);
      const method = options?.method || "GET";

      if (urlStr.includes("/property-owners/bank-account/lookup-ifsc/")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            valid: true,
            ifsc: "HDFC0000001",
            bank: "HDFC Bank",
            branch: "Nariman Point",
            city: "Mumbai",
            state: "Maharashtra",
          }),
        };
      }

      if (urlStr.includes("/property-owners/bank-account") && method === "GET") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            success: true,
            bankAccount: {
              accountHolderName: "John Doe",
              accountNumber: "123456789012",
              ifscCode: "HDFC0000001",
              bankName: "HDFC Bank",
              branch: "Nariman Point",
              upiId: "johndoe@hdfcbank",
              accountType: "current",
              isVerified: true,
              updatedAt: "2026-09-22T10:00:00.000Z",
            },
          }),
        };
      }

      if (urlStr.includes("/property-owners/bank-account") && method === "PUT") {
        const body = JSON.parse(String(options?.body || "{}"));
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            success: true,
            message: "Settlement bank account updated successfully",
            bankAccount: {
              ...body,
              isVerified: true,
              updatedAt: "2026-09-22T12:00:00.000Z",
            },
          }),
        };
      }

      if (urlStr.includes("/payment-link") && method === "GET") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            success: true,
            data: {
              paymentLink: "https://pg-ease-tenant.vercel.app/rent-collection/col-123",
              directPayUrl: "https://www.pgease.com/pay/rt-456",
              rentCollectionId: "col-123",
              roomTenantId: "rt-456",
              tenantId: "t-789",
              tenant: {
                id: "t-789",
                name: "Aman Sharma",
                phone: "9876543210",
                email: "aman@example.com",
              },
              room: {
                id: "r-1",
                roomNumber: "101",
              },
              property: {
                id: "prop-1",
                name: "Sunrise PG",
              },
              period: {
                month: 9,
                year: 2026,
                label: "September 2026",
              },
              status: "pending",
              breakdown: {
                monthlyRent: 8000,
                amountPaid: 0,
                securityDeposit: 5000,
                isSecurityDepositPaid: true,
                miscellaneousFees: 500,
                electricityAmount: 350,
                totalOutstanding: 8850,
              },
              whatsAppMessage: "Hi Aman Sharma, your rent for September 2026 at Sunrise PG is ready.",
            },
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ success: true }),
      };
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("Settlement Bank Account API", () => {
    it("should fetch registered settlement bank account", async () => {
      const res = await getSettlementBankAccount();
      expect(res.success).toBe(true);
      expect(res.bankAccount?.accountHolderName).toBe("John Doe");
      expect(res.bankAccount?.ifscCode).toBe("HDFC0000001");

      const mockFetch = globalThis.fetch as unknown as Mock;
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/property-owners/bank-account");
      expect(options.method).toBe("GET");
    });

    it("should update settlement bank account with payload", async () => {
      const payload = {
        accountHolderName: "John Doe",
        accountNumber: "50100234567890",
        ifscCode: "HDFC0000001",
        bankName: "HDFC Bank",
        branch: "Nariman Point",
        accountType: "current" as const,
        upiId: "john@hdfc",
      };

      const res = await updateSettlementBankAccount(payload);
      expect(res.success).toBe(true);
      expect(res.bankAccount.accountNumber).toBe("50100234567890");

      const mockFetch = globalThis.fetch as unknown as Mock;
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/property-owners/bank-account");
      expect(options.method).toBe("PUT");
      const sentBody = JSON.parse(options.body);
      expect(sentBody.accountNumber).toBe("50100234567890");
      expect(sentBody.ifscCode).toBe("HDFC0000001");
    });

    it("should perform real-time IFSC branch lookup with uppercase code", async () => {
      const res = await lookupIfsc("hdfc0000001");
      expect(res.valid).toBe(true);
      expect(res.bank).toBe("HDFC Bank");
      expect(res.branch).toBe("Nariman Point");

      const mockFetch = globalThis.fetch as unknown as Mock;
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/property-owners/bank-account/lookup-ifsc/HDFC0000001");
    });
  });

  describe("Tenant Payment Link API", () => {
    it("should fetch direct payment link and itemized dues breakdown", async () => {
      const res = await getTenantPaymentLink("prop-1", "rt-456");
      expect(res.success).toBe(true);
      expect(res.data.paymentLink).toContain("/rent-collection/col-123");
      expect(res.data.breakdown.totalOutstanding).toBe(8850);
      expect(res.data.breakdown.monthlyRent).toBe(8000);
      expect(res.data.tenant.name).toBe("Aman Sharma");
      expect(res.data.room.roomNumber).toBe("101");

      const mockFetch = globalThis.fetch as unknown as Mock;
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/property-owners\/properties\/prop-1\/(tenants|room-tenants)\/rt-456\/payment-link/);
      expect(options.method).toBe("GET");
    });
  });

  describe("UPI QR Code & Rent Collection Contract", () => {
    it("should construct valid NPCI UPI payment URI scheme", () => {
      const upiId = "shivam@oksbi";
      const name = "Shivam 6 pg";
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;

      expect(upiUri).toBe("upi://pay?pa=shivam%40oksbi&pn=Shivam%206%20pg&cu=INR");
      expect(upiUri).toMatch(/^upi:\/\/pay\?pa=[^&]+&pn=[^&]+&cu=INR$/);
    });

    it("should handle public rent collection data safely even if summary is missing", () => {
      // Simulating the vercel response before summary was added
      const legacyResponse = {
        rentCollectionId: "4cbedfe4-da03-403c-9627-123e9956bf70",
        totalPayable: 110,
        status: "partial",
        room: { roomNumber: "G004" },
      };

      const balanceDue = (legacyResponse as any).summary?.balanceDue ?? (legacyResponse as any).totalPayable ?? 0;
      const isFullyPaid = legacyResponse.status === "paid" || balanceDue === 0;
      const roomNumber = (legacyResponse as any).tenant?.roomNumber || legacyResponse.room?.roomNumber || "—";

      expect(balanceDue).toBe(110);
      expect(isFullyPaid).toBe(false);
      expect(roomNumber).toBe("G004");
    });
  });
});
