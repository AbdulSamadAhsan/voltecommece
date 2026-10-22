import { timingSafeEqual } from "node:crypto";
import { route, fail } from "@/lib/http";
import { maintainOrders } from "@/lib/orders";
export const GET = route(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) fail(503, "Scheduler not configured");
  const received = Buffer.from(req.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    fail(401, "Unauthorized");
  return maintainOrders();
});
