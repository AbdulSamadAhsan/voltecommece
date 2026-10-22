import { z } from "zod";
import { route, origin, body } from "@/lib/http";
import { requireUser } from "@/lib/access";
import { User, Order } from "@/lib/models";
import { addressSchema, id } from "@/lib/validation";
export const GET = route(async () => {
  const u = await requireUser();
  return {
    user: u,
    orders: await Order.find({ user: u._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  };
});
export const PATCH = route(async (req) => {
  origin(req);
  const u = await requireUser();
  const data = await body(
    req,
    z.object({
      addresses: z.array(addressSchema).max(10).optional(),
      wishlist: z.array(id).max(200).optional(),
    }),
  );
  await User.updateOne({ _id: u._id }, { $set: data });
  return { ok: true };
});
