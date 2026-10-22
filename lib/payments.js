import Stripe from "stripe";
import { fail } from "./http.js";
export function stripe() {
  if (
    process.env.PAYMENT_PROVIDER !== "stripe" ||
    !process.env.STRIPE_SECRET_KEY
  )
    fail(503, "Online payments are not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}
