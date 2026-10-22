import { test, expect } from "@playwright/test";
const origin = "http://localhost:3100";
const address = {
  name: "Test Buyer",
  line1: "123 Test Street",
  city: "Boston",
  postalCode: "02101",
  country: "US",
  phone: "5551234567",
};
async function login(request, email, password) {
  const csrf = await (await request.get("/api/auth/csrf")).json();
  const res = await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email,
      password,
      callbackUrl: origin + "/account",
    },
    headers: { origin },
  });
  expect(res.status()).toBeLessThan(400);
  const account = await request.get("/api/account");
  expect(account.status()).toBe(200);
  return (await account.json()).user;
}
test("catalog, customer auth, COD order, ownership and admin lifecycle", async ({
  request,
  playwright,
}) => {
  const products = await (await request.get("/api/products")).json();
  expect(products.items.length).toBeGreaterThan(0);
  const product = products.items[0],
    sku = product.variants[0].sku;
  expect((await request.get("/")).status()).toBe(200);
  const adminLogin = await request.get("/admin/login");
  expect(adminLogin.status()).toBe(200);
  expect(await adminLogin.text()).not.toContain("New here? Create an account");
  expect((await request.get(`/products/${product.slug}`)).status()).toBe(200);
  const email = `customer-${Date.now()}@example.test`;
  const password = "Secure-test-password-2026";
  expect(
    (
      await request.post("/api/register", {
        data: { name: "Test Buyer", email, password, role: "admin" },
        headers: { origin },
      })
    ).status(),
  ).toBe(200);
  const customer = await login(request, email, password);
  expect(customer.role).toBe("customer");
  expect((await request.get("/api/admin/products")).status()).toBe(403);
  expect(
    (
      await request.post("/api/checkout", {
        data: { items: [{ sku, quantity: 1 }], method: "cod", address },
        headers: {
          origin: "https://evil.example",
          "Idempotency-Key": "e2e-checkout-000001",
        },
      })
    ).status(),
  ).toBe(403);
  const payload = {
    items: [{ sku, quantity: 1 }],
    method: "cod",
    address,
    coupon: "WELCOME10",
  };
  const headers = { origin, "Idempotency-Key": "e2e-checkout-000001" };
  const response = await request.post("/api/checkout", {
    data: payload,
    headers,
  });
  expect(response.status()).toBe(200);
  const order = await response.json();
  const again = await (
    await request.post("/api/checkout", { data: payload, headers })
  ).json();
  expect(again.orderId).toBe(order.orderId);
  const saved = await (
    await request.get(`/api/orders/${order.orderId}`)
  ).json();
  expect(saved.state).toBe("confirmed");
  expect(saved.discount).toBeGreaterThan(0);
  const outsider = await playwright.request.newContext({ baseURL: origin });
  expect((await outsider.get(`/api/orders/${order.orderId}`)).status()).toBe(
    401,
  );
  expect(
    (
      await outsider.post("/api/register", {
        data: {
          name: "Other Buyer",
          email: `other-${Date.now()}@example.test`,
          password,
        },
        headers: { origin },
      })
    ).status(),
  ).toBe(200);
  const second = await playwright.request.newContext({ baseURL: origin });
  const secondEmail = `second-${Date.now()}@example.test`;
  await second.post("/api/register", {
    data: { name: "Second Buyer", email: secondEmail, password },
    headers: { origin },
  });
  await login(second, secondEmail, password);
  expect((await second.get(`/api/orders/${order.orderId}`)).status()).toBe(404);
  expect(
    (
      await request.post("/api/reviews", {
        data: {
          product: product._id,
          rating: 5,
          body: "Excellent test product experience.",
        },
        headers: { origin },
      })
    ).status(),
  ).toBe(403);
  const admin = await playwright.request.newContext({ baseURL: origin });
  await login(admin, "admin@example.test", "Test-only-password-2026");
  expect((await admin.get("/api/admin/analytics")).status()).toBe(200);
  expect(
    (
      await admin.patch("/api/admin/orders", {
        data: {
          id: order.orderId,
          state: "shipped",
          tracking: "TEST-TRACK-001",
        },
        headers: { origin },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.patch("/api/admin/orders", {
        data: { id: order.orderId, state: "delivered" },
        headers: { origin },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/reviews", {
        data: {
          product: product._id,
          rating: 5,
          body: "Excellent test product experience.",
        },
        headers: { origin },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.patch("/api/admin/orders", {
        data: { id: order.orderId, state: "cancelled" },
        headers: { origin },
      })
    ).status(),
  ).toBe(409);
  await outsider.dispose();
  await second.dispose();
  await admin.dispose();
});
test("unauthorized scheduler and invalid webhook fail closed", async ({
  request,
}) => {
  expect((await request.get("/api/cron")).status()).toBe(401);
  expect(
    (
      await request.post("/api/webhooks/stripe", { data: { id: "fake" } })
    ).status(),
  ).toBe(503);
});

test("customer and admin password changes revoke every existing session", async ({
  playwright,
}) => {
  for (const role of ["customer", "admin"]) {
    const first = await playwright.request.newContext({ baseURL: origin });
    const second = await playwright.request.newContext({ baseURL: origin });
    const email =
      role === "admin"
        ? "admin@example.test"
        : `password-${Date.now()}@example.test`;
    const oldPassword =
      role === "admin"
        ? "Test-only-password-2026"
        : "Customer-old-password-2026";
    const newPassword = `Changed-${role}-password-2026`;
    if (role === "customer")
      await first.post("/api/register", {
        data: { name: "Password Buyer", email, password: oldPassword },
        headers: { origin },
      });
    await login(first, email, oldPassword);
    await login(second, email, oldPassword);
    expect(
      (
        await first.post("/api/account/password", {
          data: { currentPassword: "incorrect-password", newPassword },
          headers: { origin },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await first.post("/api/account/password", {
          data: { currentPassword: oldPassword, newPassword },
          headers: { origin },
        })
      ).status(),
    ).toBe(200);
    expect((await first.get("/api/account")).status()).toBe(401);
    expect((await second.get("/api/account")).status()).toBe(401);
    await login(first, email, newPassword);
    expect((await first.get("/api/account")).status()).toBe(200);
    await first.dispose();
    await second.dispose();
  }
});
