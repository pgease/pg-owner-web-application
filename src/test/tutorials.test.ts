import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTutorials, getTutorialCategories, type TutorialItem } from "../api/propertyOwner";

describe("Tutorials & Video Guides API", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: RequestInfo | URL, options?: RequestInit) => {
      const urlStr = String(url);
      const method = options?.method || "GET";

      if (urlStr.includes("/tutorials/categories") && method === "GET") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ["Payments", "Tenants", "Billing", "Pro Feature", "Verification", "Operations"],
        };
      }

      if (urlStr.includes("/tutorials") && method === "GET") {
        const mockTutorials: TutorialItem[] = [
          {
            id: "e7b0bc56-5b4d-4530-b328-98e6ff0ae4b2",
            title: "Zero-Fee Direct UPI Intent Setup & Manual Payment Verify",
            description: "Learn how to accept rent via Direct UPI intent without gateway commission, and approve/reject tenant receipts.",
            category: "Payments",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            duration: "5:12",
            displayOrder: 1,
            badge: "Core Feature",
          },
          {
            id: "f8c1cd67-6c5e-5641-c439-09f7aa1bf5c3",
            title: "Adding, Allocating & Importing Tenants (Excel)",
            description: "Step-by-step guide to adding guests, assigning beds/rooms, and importing large tenant lists from Excel.",
            category: "Tenants",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            duration: "4:30",
            displayOrder: 2,
            badge: "Must Watch",
          },
        ];

        if (urlStr.includes("category=Payments")) {
          return {
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            json: async () => [mockTutorials[0]],
          };
        }

        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => mockTutorials,
        };
      }

      return {
        ok: false,
        status: 404,
        headers: { get: () => "application/json" },
        json: async () => ({ message: "Not found" }),
      };
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should fetch all public tutorials with required schema fields", async () => {
    const list = await getTutorials();
    expect(list).toBeDefined();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(2);

    const first = list[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("description");
    expect(first).toHaveProperty("category");
    expect(first).toHaveProperty("videoUrl");
    expect(first).toHaveProperty("thumbnailUrl");
    expect(first).toHaveProperty("duration");
    expect(first).toHaveProperty("displayOrder");
    expect(first.category).toBe("Payments");
    expect(first.title).toContain("Zero-Fee Direct UPI Intent");
  });

  it("should filter tutorials by category when specified", async () => {
    const paymentsOnly = await getTutorials("Payments");
    expect(paymentsOnly.length).toBe(1);
    expect(paymentsOnly[0].category).toBe("Payments");
  });

  it("should fetch tutorial categories", async () => {
    const categories = await getTutorialCategories();
    expect(categories).toContain("Payments");
    expect(categories).toContain("Tenants");
    expect(categories).toContain("Billing");
  });
});
