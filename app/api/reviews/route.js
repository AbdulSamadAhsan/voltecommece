import { z } from "zod";
import { route, origin, body, fail, limit } from "@/lib/http";
import { requireUser } from "@/lib/access";
import { Review, Order } from "@/lib/models";
import { id } from "@/lib/validation";
export const POST = route(async (req) => {
  origin(req);
  const u = await requireUser();
  await limit(`review:${u.id}`, 10);
  const data = await body(
    req,
    z.object({
      product: id,
      rating: z.number().int().min(1).max(5),
      body: z.string().trim().min(10).max(2000),
    }),
  );
  if (
    !(await Order.exists({
      user: u._id,
      "items.product": data.product,
      state: "delivered",
    }))
  )
    fail(403, "Reviews require a delivered purchase");
  return Review.create({ ...data, user: u._id, name: u.name });
});
