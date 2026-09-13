import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestOtp, requestTenantOtp } from "../api/propertyOwner";

describe("Request OTP Channel Support", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      return {
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
        },
        json: async () => ({
          message: "OTP sent successfully",
          expiresIn: 600,
        }),
      };
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("Property Owner Request OTP", () => {
    it("should send channel: 'whatsapp' when channel is set to 'whatsapp'", async () => {
      const res = await requestOtp("9123456789", "whatsapp");

      expect(res.message).toBe("OTP sent successfully");
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/property-owners/otp/request");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
        channel: "whatsapp",
      });
    });

    it("should send channel: 'sms' when channel is set to 'sms'", async () => {
      await requestOtp("9123456789", "sms");

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/property-owners/otp/request");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
        channel: "sms",
      });
    });

    it("should omit channel when channel is not specified (default SMS fallback)", async () => {
      await requestOtp("9123456789");

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/property-owners/otp/request");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
      });
      expect(body.channel).toBeUndefined();
    });

    it("should support object payload with channel", async () => {
      await requestOtp({ mobileNumber: "9876543210", channel: "whatsapp" });

      const [, options] = (globalThis.fetch as any).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9876543210",
        channel: "whatsapp",
      });
    });
  });

  describe("Tenant Request OTP", () => {
    it("should send channel: 'whatsapp' to /tenants/otp/request", async () => {
      const res = await requestTenantOtp("9123456789", "whatsapp");

      expect(res.message).toBe("OTP sent successfully");
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/tenants/otp/request");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
        channel: "whatsapp",
      });
    });

    it("should send channel: 'sms' to /tenants/otp/request", async () => {
      await requestTenantOtp("9123456789", "sms");

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/tenants/otp/request");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
        channel: "sms",
      });
    });

    it("should omit channel when not specified for tenant request OTP", async () => {
      await requestTenantOtp("9123456789");

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain("/tenants/otp/request");

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        mobileNumber: "9123456789",
      });
      expect(body.channel).toBeUndefined();
    });
  });
});
