import Cart from "@/components/cart";
export const metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Cart
      online={process.env.PAYMENT_PROVIDER === "stripe"}
      pricing={{
        taxBps: process.env.TAX_BPS,
        shipping: process.env.SHIPPING_CENTS,
        free: process.env.FREE_SHIPPING_CENTS,
      }}
    />
  );
}
