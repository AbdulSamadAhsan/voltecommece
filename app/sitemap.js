import { db } from "@/lib/db";
import { Product } from "@/lib/models";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let products = [];
  try {
    await db();
    products = await Product.find({ active: true })
      .select("slug updatedAt")
      .limit(10000)
      .lean();
  } catch {}
  return ["", "/shop", "/help", "/privacy"]
    .map((p) => ({ url: base + p }))
    .concat(
      products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
      })),
    );
}
