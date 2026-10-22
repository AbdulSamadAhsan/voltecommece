import { route, fail } from "@/lib/http";
import { requireUser } from "@/lib/access";
import { Order } from "@/lib/models";
import { id } from "@/lib/validation";
export const GET = route(async (req, ctx) => {
  const user = await requireUser();
  const orderId = id.parse((await ctx.params).id);
  const order = await Order.findOne({
    _id: orderId,
    ...(user.role === "admin" ? {} : { user: user._id }),
  }).lean();
  if (!order) fail(404, "Order not found");
  return order;
});
