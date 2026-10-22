import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";
import { Order, Product } from "@/lib/models";
import { Account } from "@/components/account";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e.status === 401) redirect("/login");
    throw e;
  }
  const [orders, products] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).lean(),
    Product.find({ active: true }).select("name slug").limit(500).lean(),
  ]);
  return (
    <div className="container page">
      <Account
        user={JSON.parse(JSON.stringify(user))}
        orders={JSON.parse(JSON.stringify(orders))}
        products={JSON.parse(JSON.stringify(products))}
      />
    </div>
  );
}
