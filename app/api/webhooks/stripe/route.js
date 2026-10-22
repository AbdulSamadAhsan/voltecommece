import { route, fail } from "@/lib/http";
import { stripe } from "@/lib/payments";
import { receiveWebhook } from "@/lib/orders";
export const POST = route(async (req) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) fail(503, "Webhook not configured");
  if (Number(req.headers.get("content-length") || 0) > 1000000)
    fail(413, "Payload too large");
  const raw = await req.text();
  if (raw.length > 1000000) fail(413, "Payload too large");
  let event;
  try {
    event = stripe().webhooks.constructEvent(
      raw,
      req.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    fail(400, "Invalid webhook signature");
  }
  return receiveWebhook(event);
});
