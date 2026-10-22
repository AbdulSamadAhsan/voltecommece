import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { Product, Review } from "@/lib/models";
import { ProductDetail, ReviewForm } from "@/components/product-detail";
export const dynamic = "force-dynamic";
async function get(slug) {
  await db();
  return Product.findOne({ slug, active: true }).lean();
}
export async function generateMetadata({ params }) {
  try {
    const product = await get((await params).slug);
    return {
      title: product?.name || "Product",
      description: product?.description?.slice(0, 160),
    };
  } catch {
    return { title: "Product" };
  }
}
export default async function Detail({ params }) {
  const product = await get((await params).slug);
  if (!product) notFound();
  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  const p = JSON.parse(JSON.stringify(product));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand },
    offers: {
      "@type": "Offer",
      price: (p.variants[0].price / 100).toFixed(2),
      priceCurrency: "USD",
      availability: p.variants[0].stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  return (
    <div className="container page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
        }}
      />
      <p className="small">
        <Link href="/shop">Shop</Link> / {p.category} / {p.name}
      </p>
      <div className="two-col">
        <div>
          <div className="detail-image">
            {p.images[0] && (
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                priority
                sizes="(max-width:760px) 90vw,50vw"
              />
            )}
          </div>
          {p.images.length > 1 && (
            <div className="product-grid" style={{ marginTop: 15 }}>
              {p.images.slice(1).map((src) => (
                <div className="detail-image" key={src}>
                  <Image
                    src={src}
                    alt={`${p.name} alternate view`}
                    fill
                    sizes="20vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <span className="eyebrow">
            {p.brand} / {p.category}
          </span>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <ProductDetail product={p} />
          <div className="specs">
            <h2>The details that matter</h2>
            {Object.entries(p.specifications || {}).map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <section style={{ marginTop: 50 }}>
        <h2>From everyday listeners & doers</h2>
        {reviews.length ? (
          reviews.map((r) => (
            <article className="review" key={String(r._id)}>
              <strong>
                {r.rating}/5 · {r.name}
              </strong>
              <p>{r.body}</p>
              <small>
                Verified purchase ·{" "}
                {new Date(r.createdAt).toLocaleDateString("en-US")}
              </small>
            </article>
          ))
        ) : (
          <p className="small">Be the first to share your experience.</p>
        )}
        <ReviewForm product={p._id} />
      </section>
    </div>
  );
}
