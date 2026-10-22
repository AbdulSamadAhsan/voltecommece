import { route, origin, body, limit } from "@/lib/http";
import { checkoutSchema } from "@/lib/validation";
import { requireUser } from "@/lib/access";
import { checkout } from "@/lib/orders";
export const POST = route(async (req) => {
  origin(req);
  const user = await requireUser();
  await limit(`checkout:${user.id}`, 10);
  return checkout(
    user,
    req.headers.get("idempotency-key"),
    await body(req, checkoutSchema),
  );
});
