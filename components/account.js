"use client";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { money } from "@/lib/pricing";
import { ChangePassword } from "./change-password";
import { useStore } from "./store-provider";
export function Account({ user, orders, products }) {
  const [addresses, setAddresses] = useState(user.addresses || []),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { wishlist, wish, notify, setCart } = useStore();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order = orders.find((o) => o._id === params.get("order"));
    if (params.get("payment") === "received" && order?.paid) {
      setCart((old) =>
        old.filter((i) => !order.items.some((x) => x.sku === i.sku)),
      );
    }
  }, []);
  async function save(next) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: next }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setAddresses(next);
      notify("Addresses updated");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function sync() {
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlist }),
    });
    notify(r.ok ? "Wishlist saved to your account" : "Unable to save wishlist");
  }
  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">YOUR VOLT</span>
          <h1>Hello, {user.name.split(" ")[0]}.</h1>
        </div>
        <div>
          <button
            className="btn secondary"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
          {user.role === "admin" && (
            <Link className="btn" href="/admin">
              Admin dashboard
            </Link>
          )}
        </div>
      </div>
      <div className="two-col">
        <section>
          <h2>Your orders</h2>
          {orders.length ? (
            orders.map((order) => (
              <article className="panel" key={order._id}>
                <div className="order-head">
                  <div>
                    <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p className="small">
                      {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                      {money(order.total)}
                    </p>
                  </div>
                  <span className="status">
                    {order.state.replace("_", " ")}
                  </span>
                </div>
                {order.items.map((i) => (
                  <p className="small" key={i.sku}>
                    {i.quantity} × {i.name} — {i.variant}
                  </p>
                ))}
                <p className="small">
                  Payment:{" "}
                  {order.paid
                    ? "Received"
                    : order.method === "cod"
                      ? "Due on delivery"
                      : "Awaiting confirmation"}
                </p>
                {order.tracking && <p>Tracking reference: {order.tracking}</p>}
                <p className="small">
                  Ship to {order.address.line1}, {order.address.city}
                </p>
              </article>
            ))
          ) : (
            <div className="empty">
              Your next great find starts{" "}
              <Link className="text-link" href="/shop">
                here
              </Link>
              .
            </div>
          )}
          <h2 style={{ marginTop: 35 }}>Saved for later</h2>
          <p className="small">
            Local wishlist: {wishlist.length} items. Your account has{" "}
            {user.wishlist?.length || 0} saved items.
          </p>
          <div className="tabs">
            <button onClick={sync}>
              Save this device’s wishlist to account
            </button>
            <button
              onClick={() => {
                for (const id of user.wishlist || [])
                  if (!wishlist.includes(id)) wish(id);
                notify("Account wishlist added to this device");
              }}
            >
              Load account wishlist
            </button>
          </div>
          {products
            .filter(
              (p) =>
                wishlist.includes(p._id) ||
                (user.wishlist || []).includes(p._id),
            )
            .map((p) => (
              <p key={p._id}>
                <Link className="text-link" href={`/products/${p.slug}`}>
                  {p.name}
                </Link>
              </p>
            ))}
        </section>
        <section>
          <div className="panel">
            <h2>Your profile</h2>
            <p>{user.name}</p>
            <p className="small">{user.email}</p>
          </div>
          <ChangePassword admin={user.role === "admin"} />
          <h2>Address book</h2>
          {addresses.map((a, i) => (
            <div className="panel" key={i}>
              <strong>{a.name}</strong>
              <p className="small">
                {a.line1}
                <br />
                {a.city}, {a.postalCode}
                <br />
                {a.phone}
              </p>
              <button
                disabled={busy}
                className="text-link"
                style={{ border: 0, background: "none" }}
                onClick={() => save(addresses.filter((_, j) => i !== j))}
              >
                Remove
              </button>
            </div>
          ))}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <form
            className="panel form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              await save([
                ...addresses,
                Object.fromEntries(new FormData(form)),
              ]);
            }}
          >
            <h3>Add an address</h3>
            {[
              ["name", "Full name"],
              ["line1", "Street address"],
              ["city", "City"],
              ["postalCode", "ZIP code"],
              ["phone", "Phone"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  name={key}
                  required
                  maxLength={key === "line1" ? 160 : 80}
                />
              </label>
            ))}
            <input type="hidden" name="country" value="US" />
            <button disabled={busy || addresses.length >= 10} className="btn">
              Save address
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
