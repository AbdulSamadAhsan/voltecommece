import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Product, Order, Coupon, User, WebhookEvent } from "../lib/models.js";
import {
  checkout,
  maintainOrders,
  receiveWebhook,
  transition,
} from "../lib/orders.js";
import { db } from "../lib/db.js";
let repl, user;
const address = {
  name: "Test Buyer",
  line1: "123 Main Street",
  city: "Boston",
  postalCode: "02101",
  country: "US",
  phone: "5551234567",
};
const input = {
  items: [{ sku: "TEST-1", quantity: 1 }],
  address,
  method: "cod",
};
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = repl.getUri();
  await db();
  await Promise.all([
    Product.init(),
    Order.init(),
    Coupon.init(),
    User.init(),
    WebhookEvent.init(),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await repl?.stop();
});
beforeEach(async () => {
  await Promise.all([
    Product.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({}),
    WebhookEvent.deleteMany({}),
  ]);
  user = await User.create({
    name: "Buyer",
    email: "buyer@example.com",
    password: "hashed",
  });
  await Product.create({
    name: "Headphones",
    slug: "headphones",
    variants: [{ sku: "TEST-1", name: "Black", price: 10000, stock: 1 }],
  });
  await maintainOrders();
});
it("concurrent checkouts never oversell", async () => {
  const results = await Promise.allSettled([
    checkout(user, "checkout-key-00001", input),
    checkout(user, "checkout-key-00002", input),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await Product.findOne()).variants[0].stock).toBe(0);
  expect(await Order.countDocuments()).toBe(1);
});
it("replays an idempotency key without double decrement", async () => {
  const a = await checkout(user, "checkout-key-00001", input);
  const b = await checkout(user, "checkout-key-00001", input);
  expect(a.orderId).toBe(b.orderId);
  expect((await Product.findOne()).variants[0].stock).toBe(0);
  await expect(
    checkout(user, "checkout-key-00001", {
      ...input,
      address: { ...address, city: "Austin" },
    }),
  ).rejects.toThrow("different data");
});
it("rolls stock back when coupon fails", async () => {
  await expect(
    checkout(user, "checkout-key-00001", { ...input, coupon: "BAD" }),
  ).rejects.toThrow("Coupon");
  expect((await Product.findOne()).variants[0].stock).toBe(1);
});
it("expires reservations exactly once and keeps COD stock reserved", async () => {
  const result = await checkout(user, "checkout-key-00001", input);
  await maintainOrders();
  expect((await Product.findOne()).variants[0].stock).toBe(0);
  await Order.updateOne(
    { _id: result.orderId },
    { $set: { state: "reserved", expiresAt: new Date(Date.now() - 1000) } },
  );
  await Promise.all([maintainOrders(), maintainOrders()]);
  expect((await Product.findOne()).variants[0].stock).toBe(1);
  expect((await Order.findById(result.orderId)).state).toBe("expired");
});
it("deduplicates verified payment events and validates amount", async () => {
  const result = await checkout(user, "checkout-key-00001", input);
  const order = await Order.findById(result.orderId);
  order.method = "stripe";
  order.state = "reserved";
  order.expiresAt = new Date(Date.now() + 60000);
  order.checkoutSession = "cs_test";
  await order.save();
  const event = {
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test",
        metadata: { orderId: result.orderId },
        client_reference_id: result.orderId,
        payment_status: "paid",
        payment_intent: "pi_test",
        amount_total: order.total,
        currency: "usd",
      },
    },
  };
  await receiveWebhook(event);
  await receiveWebhook(event);
  expect(await WebhookEvent.countDocuments()).toBe(1);
  expect((await Order.findById(result.orderId)).state).toBe("confirmed");
  await expect(
    receiveWebhook({
      ...event,
      id: "evt_2",
      data: { object: { ...event.data.object, amount_total: 1 } },
    }),
  ).rejects.toThrow("mismatch");
  expect(await WebhookEvent.countDocuments()).toBe(1);
});
it("cancellation restores inventory once", async () => {
  const result = await checkout(user, "checkout-key-00001", input);
  await transition(result.orderId, "cancelled", user._id);
  await expect(
    transition(result.orderId, "cancelled", user._id),
  ).rejects.toThrow("transition");
  expect((await Product.findOne()).variants[0].stock).toBe(1);
});
