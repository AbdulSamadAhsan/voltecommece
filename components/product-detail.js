"use client";
import { useState } from "react";
import { useStore } from "./store-provider";
import { money } from "@/lib/pricing";
export function ProductDetail({ product }) {
  const [sku, setSku] = useState(product.variants[0].sku);
  const { add, wish, wishlist } = useStore();
  const v = product.variants.find((x) => x.sku === sku);
  return (
    <>
      <div className="price">{money(v.price)}</div>
      <label htmlFor="variant">Choose your edition</label>
      <select id="variant" value={sku} onChange={(e) => setSku(e.target.value)}>
        {product.variants.map((x) => (
          <option value={x.sku} key={x.sku}>
            {x.name} — {money(x.price)}
            {x.stock < 1 ? " (sold out)" : ""}
          </option>
        ))}
      </select>
      <p className="small">
        {v.stock > 0
          ? `${v.stock} available · Ready for your everyday`
          : "Currently unavailable"}
      </p>
      <button
        className="btn"
        disabled={v.stock < 1}
        onClick={() =>
          add({
            product: product._id,
            sku: v.sku,
            name: product.name,
            variant: v.name,
            price: v.price,
            image: product.images[0],
          })
        }
      >
        Add to bag
      </button>
      <button
        className="btn secondary"
        style={{ marginTop: 10 }}
        onClick={() => wish(product._id)}
      >
        {wishlist.includes(product._id)
          ? "Saved to wishlist"
          : "Save for later"}
      </button>
    </>
  );
}
export function ReviewForm({ product }) {
  const { notify } = useStore();
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          rating: Number(data.get("rating")),
          body: data.get("body"),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      notify("Review submitted. Refresh to see it.");
      form.reset();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form className="form panel" onSubmit={submit}>
      <h3>Tell us how it fits your everyday</h3>
      <p className="small">
        Reviews are available to customers with a delivered purchase.
      </p>
      <label>
        Rating
        <select name="rating">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
      </label>
      <label>
        Your review
        <textarea name="body" required minLength={10} maxLength={2000} />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="btn">Submit review</button>
    </form>
  );
}
