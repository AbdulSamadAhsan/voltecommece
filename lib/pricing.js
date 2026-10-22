export function priceOrder(items, coupon, config = {}) {
  const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
  const discount = coupon ? Math.floor((subtotal * coupon.percent) / 100) : 0;
  const shipping =
    subtotal - discount >= Number(config.free ?? 15000)
      ? 0
      : Number(config.shipping ?? 999);
  const tax = Math.round(
    ((subtotal - discount) * Number(config.taxBps ?? 800)) / 10000,
  );
  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: subtotal - discount + shipping + tax,
  };
}
export const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n / 100,
  );
export const canTransition = (from, to) =>
  (
    ({
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      reserved: ["cancelled"],
    })[from] || []
  ).includes(to);
