import { describe, it, expect } from "vitest";
import { priceOrder, canTransition } from "../lib/pricing.js";
import { checkoutSchema } from "../lib/validation.js";
describe("pricing and lifecycle", () => {
  it("uses integer cents, discounts before tax and free shipping threshold", () => {
    expect(
      priceOrder([{ price: 10000, quantity: 2 }], { percent: 10 }),
    ).toEqual({
      subtotal: 20000,
      discount: 2000,
      shipping: 0,
      tax: 1440,
      total: 19440,
    });
  });
  it("rejects impossible lifecycle transitions", () => {
    expect(canTransition("reserved", "shipped")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    expect(canTransition("confirmed", "shipped")).toBe(true);
  });
  it("rejects duplicate checkout SKUs and negative quantities", () => {
    const address = {
      name: "Buyer",
      line1: "123 Main St",
      city: "Boston",
      postalCode: "02101",
      country: "US",
      phone: "5551234567",
    };
    expect(
      checkoutSchema.safeParse({
        address,
        method: "cod",
        items: [
          { sku: "A", quantity: 1 },
          { sku: "A", quantity: 1 },
        ],
      }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({
        address,
        method: "cod",
        items: [{ sku: "A", quantity: -1 }],
      }).success,
    ).toBe(false);
  });
});
