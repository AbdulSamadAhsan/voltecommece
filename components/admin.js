"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/pricing";
import { RecordFields } from "./record-fields";
const templates = {
  products: {
    name: "New product",
    slug: "new-product",
    description: "A thoughtfully selected everyday essential.",
    category: "Audio",
    brand: "VOLT",
    images: [],
    specifications: { Connectivity: "Bluetooth" },
    variants: [{ sku: "NEW-001", name: "Standard", price: 9900, stock: 10 }],
    active: true,
    featured: false,
  },
  categories: { name: "Audio", slug: "audio" },
  brands: { name: "VOLT", slug: "volt" },
  coupons: {
    code: "WELCOME10",
    percent: 10,
    minimum: 5000,
    limit: 100,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    active: true,
  },
};
export function Admin() {
  const [tab, setTab] = useState("analytics"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null),
    [draft, setDraft] = useState(""),
    [image, setImage] = useState(""),
    [page, setPage] = useState(1);
  async function load() {
    setError("");
    setData(null);
    try {
      const r = await fetch(`/api/admin/${tab}?page=${page}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    fetch(`/api/admin/${tab}?page=${page}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    setEditing(null);
    setDraft("");
    return () => {
      active = false;
    };
  }, [tab, page]);
  async function mutate(method, payload) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/${tab}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setEditing(null);
      setDraft("");
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(item) {
    setEditing(item._id);
    const keys = Object.keys(templates[tab]);
    setDraft(
      JSON.stringify(
        Object.fromEntries(keys.map((k) => [k, item[k] ?? templates[tab][k]])),
        null,
        2,
      ),
    );
  }
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setImage(d.url);
      if (draft) {
        const parsed = JSON.parse(draft);
        parsed.images = [...(parsed.images || []), d.url];
        setDraft(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">VOLT CONTROL ROOM</span>
          <h1>A clear view of your store.</h1>
        </div>
        <Link className="btn secondary" href="/account">
          Profile & security
        </Link>
      </div>
      <div role="tablist" aria-label="Admin sections" className="tabs">
        {[
          "analytics",
          "products",
          "categories",
          "brands",
          "orders",
          "customers",
          "coupons",
        ].map((x) => (
          <button
            role="tab"
            aria-selected={x === tab}
            key={x}
            onClick={() => {
              setTab(x);
              setPage(1);
            }}
          >
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading store data…</p>}
      {data && tab === "analytics" && (
        <>
          <div className="stats">
            {[
              ["Revenue", money(data.revenue)],
              ["Orders", data.orders],
              ["Customers", data.customers],
              ["Low-stock products", data.lowStock],
            ].map(([k, v]) => (
              <div className="stat" key={k}>
                <small>{k}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div className="panel">
            <h2>Operations at a glance</h2>
            <p className="small">
              Revenue includes collected payments and delivered COD orders,
              excluding refunds in progress. Low stock means at least one
              variant has five or fewer units available. Manage promotions
              through capped, expiring coupon codes and featured products.
            </p>
          </div>
        </>
      )}
      {templates[tab] && (
        <>
          <div className="section-head">
            <p className="small">
              {data?.total || 0} records. Inventory is the quantity available to
              new orders; existing reservations are held separately.
            </p>
            <button
              className="btn"
              onClick={() => {
                setEditing("new");
                setDraft(JSON.stringify(templates[tab], null, 2));
              }}
            >
              Add {tab.slice(0, -1)}
            </button>
          </div>
          {draft && (
            <form
              className="panel form"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const parsed = JSON.parse(draft);
                  mutate(
                    editing === "new" ? "POST" : "PATCH",
                    editing === "new"
                      ? parsed
                      : {
                          id: editing,
                          data: parsed,
                          expectedUpdatedAt: data.items.find(
                            (x) => x._id === editing,
                          ).updatedAt,
                        },
                  );
                } catch {
                  setError("Enter valid product data.");
                }
              }}
            >
              <h2>
                {editing === "new" ? "Create" : "Edit"} {tab.slice(0, -1)}
              </h2>
              {tab === "products" && (
                <>
                  <label>
                    Upload product image (JPEG, PNG, WebP; max 4 MB)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={upload}
                    />
                  </label>
                  {image && (
                    <p className="small">
                      Image uploaded and added to product.
                    </p>
                  )}
                </>
              )}
              <RecordFields tab={tab} value={draft} onChange={setDraft} />
              <p className="small">
                Prices use cents. Existing SKU identities cannot change. Archive
                products to remove them from the storefront while preserving
                orders.
              </p>
              <div className="tabs">
                <button disabled={busy} className="btn">
                  {busy ? "Saving…" : "Save record"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    setEditing(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
      {data?.items && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  {tab === "orders"
                    ? "Order"
                    : tab === "customers"
                      ? "Customer"
                      : "Name"}
                </th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item._id}>
                  <td>
                    {item.name || item.code || `#${item._id.slice(-8)}`}
                    <br />
                    <small>{item.email || item.slug || ""}</small>
                  </td>
                  <td>
                    {tab === "products" ? (
                      <>
                        {item.variants.map((v) => (
                          <div key={v.sku}>
                            {v.sku} · {money(v.price)} · {v.stock} available
                          </div>
                        ))}
                        {!item.active && (
                          <span className="status">Archived</span>
                        )}
                      </>
                    ) : tab === "orders" ? (
                      <>
                        <span className="status">{item.state}</span>
                        <p>
                          {money(item.total)} · {item.method} ·{" "}
                          {item.paid ? "Paid" : "Unpaid"}
                        </p>
                        <p>
                          {item.address.name} · {item.address.line1},{" "}
                          {item.address.city}
                        </p>
                        {item.items.map((i) => (
                          <div key={i.sku}>
                            {i.quantity} × {i.name}
                          </div>
                        ))}
                      </>
                    ) : tab === "coupons" ? (
                      `${item.percent}% · ${item.uses}/${item.limit} uses · ${item.active ? "Active" : "Archived"}`
                    ) : tab === "customers" ? (
                      `${item.role} · ${item.disabled ? "Disabled" : "Active"}`
                    ) : (
                      item.slug
                    )}
                  </td>
                  <td>
                    <div className="tabs">
                      {templates[tab] && (
                        <>
                          <button disabled={busy} onClick={() => edit(item)}>
                            Edit
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm("Archive or delete this record?")
                              )
                                mutate("DELETE", { id: item._id });
                            }}
                          >
                            {["products", "coupons"].includes(tab)
                              ? "Archive"
                              : "Delete"}
                          </button>
                        </>
                      )}
                      {tab === "customers" && item.role === "customer" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            mutate("PATCH", {
                              id: item._id,
                              disabled: !item.disabled,
                            })
                          }
                        >
                          {item.disabled ? "Enable" : "Disable"}
                        </button>
                      )}
                      {tab === "orders" && (
                        <>
                          {item.state === "confirmed" && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => {
                                  const tracking = prompt(
                                    "Carrier tracking reference",
                                  );
                                  if (tracking)
                                    mutate("PATCH", {
                                      id: item._id,
                                      state: "shipped",
                                      tracking,
                                    });
                                }}
                              >
                                Ship
                              </button>
                              {!item.paid && (
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    mutate("PATCH", {
                                      id: item._id,
                                      state: "cancelled",
                                    })
                                  }
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                          {item.state === "shipped" && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                mutate("PATCH", {
                                  id: item._id,
                                  state: "delivered",
                                })
                              }
                            >
                              Mark delivered
                            </button>
                          )}
                          {item.paid &&
                            item.method === "stripe" &&
                            [
                              "confirmed",
                              "delivered",
                              "refund_pending",
                            ].includes(item.state) && (
                              <button
                                disabled={busy}
                                onClick={() => {
                                  if (confirm("Issue a full refund?"))
                                    mutate("PATCH", {
                                      id: item._id,
                                      state: "refunded",
                                    });
                                }}
                              >
                                Refund
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && <div className="empty">No records yet.</div>}
          <div className="pagination">
            {page > 1 && (
              <button
                className="btn secondary"
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
            )}
            <span>Page {page}</span>
            {page * 50 < data.total && (
              <button
                className="btn secondary"
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
