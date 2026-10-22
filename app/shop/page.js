import Link from "next/link";
import { catalog, facets } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
export const metadata = { title: "Shop electronics" };
export const dynamic = "force-dynamic";
export default async function Shop({ searchParams }) {
  const params = await searchParams;
  let data,
    error,
    options = { categories: [], brands: [] };
  try {
    [data, options] = await Promise.all([catalog(params), facets()]);
  } catch {
    error = "Catalog unavailable. Please retry shortly.";
  }
  function page(n) {
    return "/shop?" + new URLSearchParams({ ...params, page: String(n) });
  }
  return (
    <div className="container page">
      <span className="eyebrow">FIND YOUR NEXT EVERYDAY ESSENTIAL</span>
      <h1>{params.category || "The collection."}</h1>
      <form action="/shop" className="filters">
        <label>
          Search
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Headphones, laptops, and more"
            maxLength={100}
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={params.category || ""}>
            <option value="">All categories</option>
            {options.categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select name="brand" defaultValue={params.brand || ""}>
            <option value="">All brands</option>
            {options.brands.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Min $
          <input type="number" name="min" min="0" defaultValue={params.min} />
        </label>
        <label>
          Max $
          <input type="number" name="max" min="0" defaultValue={params.max} />
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={params.sort || "newest"}>
            <option value="newest">Newest first</option>
            <option value="price">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <button className="btn">Apply</button>
        <Link className="text-link" href="/shop">
          Reset
        </Link>
      </form>
      {error ? (
        <p role="alert" className="empty">
          {error}
        </p>
      ) : (
        <>
          <p className="small">{data.total} thoughtfully selected products</p>
          {data.items.length ? (
            <div className="product-grid">
              {data.items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty">No products found. Try another search.</div>
          )}
          <nav className="pagination" aria-label="Product pages">
            {data.page > 1 && (
              <Link className="btn secondary" href={page(data.page - 1)}>
                Previous
              </Link>
            )}
            <span>
              Page {data.page} of {Math.max(1, data.pages)}
            </span>
            {data.page < data.pages && (
              <Link className="btn secondary" href={page(data.page + 1)}>
                Next
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
