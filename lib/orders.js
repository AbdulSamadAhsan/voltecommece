import { createHash } from "node:crypto";
import { transaction, db } from "./db.js";
import {
  Product,
  Order,
  Coupon,
  WebhookEvent,
  Audit,
  Maintenance,
} from "./models.js";
import { fail } from "./http.js";
import { priceOrder, canTransition } from "./pricing.js";
import { stripe } from "./payments.js";
export async function checkout(user, key, input) {
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(key || ""))
    fail(400, "A valid Idempotency-Key is required");
  await db();
  const heartbeat = await Maintenance.findById("orders");
  if (
    input.method === "stripe" &&
    (!heartbeat || Date.now() - heartbeat.lastRun.getTime() > 15 * 60000)
  )
    fail(503, "Checkout is paused while order maintenance is unavailable");
  if (input.method === "stripe") stripe();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  let order;
  try {
    order = await transaction(async (session) => {
      const existing = await Order.findOne({ user: user._id, key }).session(
        session,
      );
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          fail(409, "Checkout key already used for different data");
        return existing;
      }
      const items = [];
      for (const item of input.items) {
        const product = await Product.findOneAndUpdate(
          {
            active: true,
            variants: {
              $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } },
            },
          },
          { $inc: { "variants.$.stock": -item.quantity } },
          { new: true, session },
        );
        if (!product) fail(409, `Insufficient stock for ${item.sku}`);
        const v = product.variants.find((v) => v.sku === item.sku);
        items.push({
          product: product._id,
          sku: v.sku,
          name: product.name,
          variant: v.name,
          quantity: item.quantity,
          price: v.price,
        });
      }
      let coupon = null;
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      if (input.coupon) {
        coupon = await Coupon.findOneAndUpdate(
          {
            code: input.coupon,
            active: true,
            expiresAt: { $gt: new Date() },
            minimum: { $lte: subtotal },
            $expr: { $lt: ["$uses", "$limit"] },
          },
          { $inc: { uses: 1 } },
          { new: true, session },
        );
        if (!coupon) fail(400, "Coupon is invalid, expired, or exhausted");
      }
      const totals = priceOrder(items, coupon, {
        taxBps: process.env.TAX_BPS,
        shipping: process.env.SHIPPING_CENTS,
        free: process.env.FREE_SHIPPING_CENTS,
      });
      return (
        await Order.create(
          [
            {
              user: user._id,
              key,
              fingerprint,
              items,
              address: input.address,
              ...totals,
              coupon: coupon?.code,
              method: input.method,
              state: input.method === "cod" ? "confirmed" : "reserved",
              expiresAt:
                input.method === "stripe"
                  ? new Date(Date.now() + 30 * 60000)
                  : null,
            },
          ],
          { session },
        )
      )[0];
    });
  } catch (e) {
    if (e.code !== 11000) throw e;
    order = await Order.findOne({ user: user._id, key });
    if (!order || order.fingerprint !== fingerprint)
      fail(409, "Checkout conflict");
  }
  if (order.method === "stripe" && order.state === "reserved") {
    const client = stripe();
    let remote;
    if (order.checkoutSession) {
      remote = await client.checkout.sessions.retrieve(order.checkoutSession);
    } else {
      if (order.expiresAt.getTime() < Date.now() + 60000)
        fail(409, "Reservation expired. Start a new checkout.");
      remote = await client.checkout.sessions.create(
        {
          mode: "payment",
          client_reference_id: String(order._id),
          metadata: { orderId: String(order._id) },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: `VOLT order ${order._id}` },
                unit_amount: order.total,
              },
              quantity: 1,
            },
          ],
          success_url: `${process.env.AUTH_URL}/account?payment=received&order=${order._id}`,
          cancel_url: `${process.env.AUTH_URL}/cart`,
          expires_at: Math.floor(order.expiresAt.getTime() / 1000),
        },
        { idempotencyKey: `checkout-${order._id}` },
      );
      await Order.updateOne(
        { _id: order._id, state: "reserved" },
        { $set: { checkoutSession: remote.id } },
      );
    }
    return { orderId: String(order._id), url: remote.url, state: order.state };
  }
  return { orderId: String(order._id), state: order.state };
}
async function release(order, session) {
  for (const item of order.items) {
    const result = await Product.updateOne(
      { "variants.sku": item.sku },
      { $inc: { "variants.$.stock": item.quantity } },
      { session },
    );
    if (result.matchedCount !== 1) fail(409, "Reserved SKU is missing");
  }
  if (order.coupon)
    await Coupon.updateOne(
      { code: order.coupon, uses: { $gt: 0 } },
      { $inc: { uses: -1 } },
      { session },
    );
}
export async function transition(orderId, next, actor, tracking) {
  return transaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) fail(404, "Order not found");
    if (!canTransition(order.state, next))
      fail(409, "Invalid order transition");
    if (next === "cancelled") {
      if (order.paid) fail(409, "Paid orders must be refunded");
      await release(order, session);
    }
    if (next === "delivered" && order.method === "cod") order.paid = true;
    order.state = next;
    if (tracking) order.tracking = tracking;
    await order.save({ session });
    await Audit.create([{ actor, action: `order.${next}`, target: orderId }], {
      session,
    });
    return order;
  });
}
export async function receiveWebhook(event) {
  return transaction(async (session) => {
    if (await WebhookEvent.exists({ eventId: event.id }).session(session))
      return { duplicate: true };
    const data = event.data.object;
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type) &&
      data.payment_status === "paid"
    ) {
      const order = await Order.findById(data.metadata?.orderId).session(
        session,
      );
      if (!order) fail(400, "Unknown order");
      if (
        order.method !== "stripe" ||
        order.total !== data.amount_total ||
        data.currency !== "usd" ||
        data.client_reference_id !== String(order._id) ||
        (order.checkoutSession && order.checkoutSession !== data.id)
      )
        fail(400, "Payment mismatch");
      if (!order.paid) {
        order.paid = true;
        order.paymentIntent = data.payment_intent;
        order.checkoutSession = data.id;
        if (order.state === "reserved" && order.expiresAt > new Date())
          order.state = "confirmed";
        else if (["expired", "cancelled"].includes(order.state)) {
          order.state = "refund_pending";
          order.refundReason = "late_payment";
        } else if (order.state === "reserved") {
          await release(order, session);
          order.state = "refund_pending";
          order.refundReason = "late_payment";
        }
        await order.save({ session });
      }
    }
    await WebhookEvent.create([{ eventId: event.id, type: event.type }], {
      session,
    });
    return { received: true };
  });
}
export async function requestRefund(orderId, actor) {
  await transaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) fail(404, "Order not found");
    if (order.state === "refunded" || order.state === "refund_pending") return;
    if (
      !order.paid ||
      order.method !== "stripe" ||
      !["confirmed", "delivered"].includes(order.state)
    )
      fail(409, "Order is not eligible for online refund");
    order.refundReason = order.state === "confirmed" ? "unshipped" : "returned";
    order.state = "refund_pending";
    await order.save({ session });
    await Audit.create([{ actor, action: "refund.request", target: orderId }], {
      session,
    });
  });
  return processRefund(orderId);
}
async function processRefund(orderId) {
  await db();
  const order = await Order.findById(orderId);
  if (!order || order.state !== "refund_pending") return;
  const refund = await stripe().refunds.create(
    { payment_intent: order.paymentIntent },
    { idempotencyKey: `refund-${order._id}` },
  );
  if (refund.status !== "succeeded") return;
  await transaction(async (session) => {
    const current = await Order.findById(orderId).session(session);
    if (current.state !== "refund_pending") return;
    if (current.refundReason === "unshipped") await release(current, session);
    current.state = "refunded";
    await current.save({ session });
  });
  return { ok: true };
}
export async function maintainOrders() {
  await db();
  const expired = await Order.find({
    state: "reserved",
    expiresAt: { $lte: new Date() },
  })
    .limit(100)
    .select("_id");
  for (const { _id } of expired)
    await transaction(async (session) => {
      const order = await Order.findOne({
        _id,
        state: "reserved",
        expiresAt: { $lte: new Date() },
      }).session(session);
      if (!order) return;
      await release(order, session);
      order.state = "expired";
      await order.save({ session });
    });
  const refunds = await Order.find({ state: "refund_pending" })
    .limit(50)
    .select("_id");
  let errors = 0;
  for (const { _id } of refunds) {
    try {
      await processRefund(_id);
    } catch (e) {
      errors++;
      console.error("Refund retry failed", String(_id), e.message);
    }
  }
  await Maintenance.updateOne(
    { _id: "orders" },
    { $set: { lastRun: new Date() } },
    { upsert: true },
  );
  return { expired: expired.length, refunds: refunds.length, errors };
}
