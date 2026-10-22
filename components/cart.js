"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/components/store-provider";
import { money, priceOrder } from "@/lib/pricing";
export default function Cart({ online = false, pricing }) {
  const { cart, setCart, ready } = useStore();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState([]),
    [attempt, setAttempt] = useState(null),
    [address, setAddress] = useState(null);
  useEffect(() => {
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setSaved(d.user.addresses || []);
      })
      .catch(() => {});
  }, []);
  const totals = priceOrder(cart, null, pricing);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      items: cart.map(({ sku, quantity }) => ({ sku, quantity })),
      method: form.get("method"),
      coupon: form.get("coupon") || undefined,
      address: Object.fromEntries(
        ["name", "line1", "city", "postalCode", "country", "phone"].map((k) => [
          k,
          form.get(k),
        ]),
      ),
    };
    const serialized = JSON.stringify(payload);
    let current = attempt;
    if (!current || current.serialized !== serialized) {
      current = { serialized, key: crypto.randomUUID() };
      setAttempt(current);
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": current.key,
        },
        body: serialized,
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setCart([]);
      window.location.assign(`/account?order=${data.orderId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <div className="container page" role="status">
        Loading your bag…
      </div>
    );
  return (
    <div className="container page">
      <span className="eyebrow">GOOD CHOICES, ALL IN ONE PLACE</span>
      <h1>Your bag.</h1>
      {cart.length ? (
        <div className="two-col">
          <section>
            {cart.map((item) => (
              <article className="cart-item" key={item.sku}>
                <div className="thumb">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="85px" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3>{item.name}</h3>
                  <p>{item.variant}</p>
                  <strong>{money(item.price)}</strong>
                </div>
                <label>
                  <span className="small">Quantity</span>
                  <br />
                  <select
                    aria-label={`Quantity for ${item.name}`}
                    value={item.quantity}
                    onChange={(e) => {
                      setAttempt(null);
                      setCart(
                        cart.map((x) =>
                          x.sku === item.sku
                            ? { ...x, quantity: Number(e.target.value) }
                            : x,
                        ),
                      );
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="remove"
                  onClick={() => {
                    setAttempt(null);
                    setCart(cart.filter((x) => x.sku !== item.sku));
                  }}
                >
                  Remove
                </button>
              </article>
            ))}
            <div className="panel" style={{ marginTop: 30 }}>
              <h2>Estimated total</h2>
              {[
                ["Items", totals.subtotal],
                ["Shipping", totals.shipping],
                ["Estimated tax", totals.tax],
                ["Total", totals.total],
              ].map(([label, value]) => (
                <div
                  className={`summary-line ${label === "Total" ? "total" : ""}`}
                  key={label}
                >
                  <span>{label}</span>
                  <span>{money(value)}</span>
                </div>
              ))}
              <p className="small">
                Prices, discounts, shipping and tax are recalculated securely at
                checkout. Final discounts are applied when you place your order.
              </p>
            </div>
          </section>
          <form className="form panel" onSubmit={submit}>
            <h2>Make it yours.</h2>
            <p className="small">
              <Link href="/login" className="text-link">
                Sign in
              </Link>{" "}
              before placing an order. Shipping currently available within the
              United States.
            </p>
            {saved.length > 0 && (
              <label>
                Saved address
                <select
                  onChange={(e) =>
                    setAddress(saved[Number(e.target.value)] || null)
                  }
                  defaultValue=""
                >
                  <option value="">Enter a new address</option>
                  {saved.map((a, i) => (
                    <option key={i} value={i}>
                      {a.line1}, {a.city}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="form" key={address?.line1 || "new"}>
              {[
                ["name", "Full name"],
                ["line1", "Street address"],
                ["city", "City"],
                ["postalCode", "ZIP code"],
                ["phone", "Phone number"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    name={key}
                    defaultValue={address?.[key]}
                    required
                    maxLength={key === "line1" ? 160 : 80}
                    autoComplete={
                      {
                        name: "name",
                        line1: "address-line1",
                        city: "address-level2",
                        postalCode: "postal-code",
                        phone: "tel",
                      }[key]
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              Country
              <select name="country">
                <option value="US">United States</option>
              </select>
            </label>
            <label>
              Coupon code
              <input
                name="coupon"
                maxLength={40}
                placeholder="Have a little something extra?"
              />
            </label>
            <label>
              Payment
              <select name="method">
                <option value="cod">Cash on delivery</option>
                <option value="stripe">Card — secure online checkout</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="btn lime" disabled={busy}>
              {busy ? "Securing your order…" : "Place order securely ↗"}
            </button>
            <p className="small">
              Your order total is securely confirmed before your order is
              placed.
            </p>
          </form>
        </div>
      ) : (
        <div className="empty">
          <h2>A little room for something good.</h2>
          <p>Your bag is empty.</p>
          <Link className="btn" href="/shop">
            Find your next essential
          </Link>
        </div>
      )}
    </div>
  );
}
