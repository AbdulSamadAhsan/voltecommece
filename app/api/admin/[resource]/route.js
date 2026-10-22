import { z } from "zod";
import { route, origin, body, fail, limit } from "@/lib/http";
import { requireUser } from "@/lib/access";
import {
  Product,
  Category,
  Brand,
  Coupon,
  Order,
  User,
  Audit,
} from "@/lib/models";
import { productSchema, couponSchema, id } from "@/lib/validation";
import { transaction } from "@/lib/db";
import { transition, requestRefund } from "@/lib/orders";
const resources = {
  products: Product,
  categories: Category,
  brands: Brand,
  coupons: Coupon,
  orders: Order,
  customers: User,
};
const taxonomy = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
});
export const GET = route(async (req, ctx) => {
  await requireUser(true);
  const resource = (await ctx.params).resource;
  if (resource === "analytics") {
    const [revenue, orders, customers, lowStock] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            paid: true,
            state: { $nin: ["refunded", "refund_pending"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ "variants.stock": { $lte: 5 } }),
    ]);
    return { revenue: revenue[0]?.total || 0, orders, customers, lowStock };
  }
  const Model = resources[resource];
  if (!Model) fail(404, "Unknown resource");
  const page = Math.max(
    1,
    Number(new URL(req.url).searchParams.get("page")) || 1,
  );
  return {
    items: await Model.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * 50)
      .limit(50)
      .lean(),
    total: await Model.countDocuments(),
  };
});
export const POST = route(async (req, ctx) => {
  origin(req);
  const user = await requireUser(true);
  await limit(`admin:${user.id}`, 60);
  const resource = (await ctx.params).resource;
  const Model = resources[resource];
  if (!Model || ["orders", "customers"].includes(resource))
    fail(405, "Unsupported operation");
  const data = await body(
    req,
    resource === "products"
      ? productSchema
      : resource === "coupons"
        ? couponSchema
        : taxonomy,
  );
  return transaction(async (session) => {
    const doc = (await Model.create([data], { session }))[0];
    await Audit.create(
      [
        {
          actor: user._id,
          action: `${resource}.create`,
          target: String(doc._id),
        },
      ],
      { session },
    );
    return doc;
  });
});
export const PATCH = route(async (req, ctx) => {
  origin(req);
  const user = await requireUser(true);
  const resource = (await ctx.params).resource;
  if (resource === "orders") {
    const data = await body(
      req,
      z.object({
        id,
        state: z.enum(["shipped", "delivered", "cancelled", "refunded"]),
        tracking: z.string().max(120).optional(),
      }),
    );
    return data.state === "refunded"
      ? requestRefund(data.id, user._id)
      : transition(data.id, data.state, user._id, data.tracking);
  }
  if (resource === "customers") {
    const data = await body(req, z.object({ id, disabled: z.boolean() }));
    if (data.id === user.id) fail(400, "Cannot disable your own account");
    return transaction(async (session) => {
      const doc = await User.findOneAndUpdate(
        { _id: data.id, role: "customer" },
        { $set: { disabled: data.disabled } },
        { new: true, session },
      );
      if (!doc) fail(404, "Customer not found");
      await Audit.create(
        [{ actor: user._id, action: "customer.update", target: data.id }],
        { session },
      );
      return doc;
    });
  }
  const Model = resources[resource];
  if (!Model) fail(404, "Unknown resource");
  const schema =
    resource === "products"
      ? productSchema
      : resource === "coupons"
        ? couponSchema
        : taxonomy;
  const data = await body(
    req,
    z.object({ id, data: schema, expectedUpdatedAt: z.iso.datetime() }),
  );
  return transaction(async (session) => {
    const current = await Model.findById(data.id).session(session);
    if (!current) fail(404, "Record not found");
    if (current.updatedAt.toISOString() !== data.expectedUpdatedAt)
      fail(409, "This record changed. Reload it before saving.");
    if (resource === "products") {
      // Preserve reserved SKU identity; inventory edits serialize against checkout writes.
      const oldSkus = current.variants
        .map((v) => v.sku)
        .sort()
        .join();
      const nextSkus = data.data.variants
        .map((v) => v.sku)
        .sort()
        .join();
      if (
        !current.variants.every((v) =>
          data.data.variants.some((n) => n.sku === v.sku),
        )
      )
        fail(
          409,
          "Existing SKU identities cannot change; create a new product",
        );
    }
    Object.assign(current, data.data);
    await current.save({ session });
    await Audit.create(
      [{ actor: user._id, action: `${resource}.update`, target: data.id }],
      { session },
    );
    return current;
  });
});
export const DELETE = route(async (req, ctx) => {
  origin(req);
  const user = await requireUser(true);
  const resource = (await ctx.params).resource;
  const data = await body(req, z.object({ id }));
  if (!["products", "categories", "brands", "coupons"].includes(resource))
    fail(405, "Unsupported operation");
  return transaction(async (session) => {
    const Model = resources[resource];
    if (resource === "products" || resource === "coupons")
      await Model.updateOne(
        { _id: data.id },
        { $set: { active: false } },
        { session },
      );
    else await Model.deleteOne({ _id: data.id }, { session });
    await Audit.create(
      [{ actor: user._id, action: `${resource}.delete`, target: data.id }],
      { session },
    );
    return { ok: true };
  });
});
