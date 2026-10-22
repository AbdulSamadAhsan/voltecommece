"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, ArrowUpRight } from "lucide-react";
import { useStore } from "./store-provider";
import { money } from "@/lib/pricing";
export function ProductCard({ product }) {
  const { add, wishlist, wish } = useStore();
  const variant = product.variants[0];
  return (
    <article className="product-card">
      <div className="product-image">
        {product.featured && <span className="tag">THE GOOD STUFF</span>}
        <button
          className="heart"
          onClick={() => wish(product._id)}
          aria-label={`${wishlist.includes(product._id) ? "Remove from" : "Add to"} wishlist`}
          aria-pressed={wishlist.includes(product._id)}
        >
          <Heart
            size={18}
            fill={wishlist.includes(product._id) ? "currentColor" : "none"}
          />
        </button>
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width:640px) 80vw,(max-width:1000px) 45vw,25vw"
            />
          ) : (
            <div className="image-placeholder">VOLT</div>
          )}
        </Link>
        <Link className="quick-view" href={`/products/${product.slug}`}>
          Explore product <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="product-meta">
        <span>
          {product.brand} / {product.category}
        </span>
        <h3>
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="product-bottom">
          <strong>{money(variant.price)}</strong>
          <button
            className="add-button"
            disabled={variant.stock < 1}
            aria-label={`Add ${product.name} to bag`}
            onClick={() =>
              add({
                product: product._id,
                sku: variant.sku,
                name: product.name,
                variant: variant.name,
                price: variant.price,
                image: product.images[0],
              })
            }
          >
            {variant.stock < 1 ? "Sold out" : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}
