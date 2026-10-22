"use client";
export function RecordFields({ tab, value, onChange }) {
  let data;
  try {
    data = JSON.parse(value);
  } catch {
    return <p>Unable to read this record.</p>;
  }
  const change = (key, v) =>
    onChange(JSON.stringify({ ...data, [key]: v }, null, 2));
  const field = (key, label, type = "text") => (
    <label key={key}>
      {label}
      <input
        type={type}
        required
        value={data[key] ?? ""}
        onChange={(e) =>
          change(
            key,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
        min={type === "number" ? 0 : undefined}
      />
    </label>
  );
  return (
    <div className="form">
      {tab === "products" ? (
        <>
          {field("name", "Product name")}
          {field("slug", "URL name (lowercase words separated by hyphens)")}
          <label>
            Description
            <textarea
              required
              value={data.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>
          <div className="form-row">
            {field("category", "Category")}
            {field("brand", "Brand")}
          </div>
          <label>
            <span>
              <input
                type="checkbox"
                checked={data.active}
                onChange={(e) => change("active", e.target.checked)}
              />{" "}
              Available in store
            </span>
          </label>
          <label>
            <span>
              <input
                type="checkbox"
                checked={data.featured}
                onChange={(e) => change("featured", e.target.checked)}
              />{" "}
              Feature this product
            </span>
          </label>
          <h3>Images</h3>
          {data.images.map((url, i) => (
            <label key={i}>
              Image {i + 1}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={url}
                  onChange={(e) =>
                    change(
                      "images",
                      data.images.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    change(
                      "images",
                      data.images.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </label>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() => change("images", [...data.images, ""])}
          >
            Add image URL
          </button>
          <h3>Editions & inventory</h3>
          {data.variants.map((v, i) => (
            <div className="panel form" key={i}>
              {[
                ["sku", "SKU"],
                ["name", "Edition name"],
                ["price", "Price in cents"],
                ["stock", "Available units"],
              ].map(([k, label]) => (
                <label key={k}>
                  {label}
                  <input
                    value={v[k]}
                    type={["price", "stock"].includes(k) ? "number" : "text"}
                    min="0"
                    required
                    onChange={(e) =>
                      change(
                        "variants",
                        data.variants.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                [k]: ["price", "stock"].includes(k)
                                  ? Number(e.target.value)
                                  : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              change("variants", [
                ...data.variants,
                { sku: "", name: "", price: 100, stock: 0 },
              ])
            }
          >
            Add edition
          </button>
          <h3>Specifications</h3>
          {Object.entries(data.specifications).map(([k, v]) => (
            <label key={k}>
              {k}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={v}
                  onChange={(e) =>
                    change("specifications", {
                      ...data.specifications,
                      [k]: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    change(
                      "specifications",
                      Object.fromEntries(
                        Object.entries(data.specifications).filter(
                          ([key]) => key !== k,
                        ),
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </label>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              const key = prompt("Specification name");
              if (key && key.length <= 80)
                change("specifications", { ...data.specifications, [key]: "" });
            }}
          >
            Add specification
          </button>
        </>
      ) : tab === "coupons" ? (
        <>
          {field("code", "Coupon code (uppercase)")}
          {field("percent", "Discount percent", "number")}
          {field("minimum", "Minimum order in cents", "number")}
          {field("limit", "Maximum uses", "number")}
          <label>
            Expiry
            <input
              type="datetime-local"
              required
              value={data.expiresAt.slice(0, 16)}
              onChange={(e) => {
                if (e.target.value)
                  change("expiresAt", new Date(e.target.value).toISOString());
              }}
            />
          </label>
          <label>
            <span>
              <input
                type="checkbox"
                checked={data.active}
                onChange={(e) => change("active", e.target.checked)}
              />{" "}
              Active promotion
            </span>
          </label>
        </>
      ) : (
        <>
          {field("name", "Name")}
          {field("slug", "URL name (lowercase words separated by hyphens)")}
        </>
      )}
    </div>
  );
}
