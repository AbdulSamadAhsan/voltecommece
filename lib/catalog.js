import { db } from "./db.js";
import { Product, Category, Brand } from "./models.js";
export async function catalog(params = {}) {
  await db();
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const filter = { active: true };
  if (params.q) filter.$text = { $search: String(params.q).slice(0, 100) };
  if (params.category) filter.category = String(params.category).slice(0, 80);
  if (params.brand) filter.brand = String(params.brand).slice(0, 80);
  const range = {};
  if (params.min) range.$gte = Math.max(0, Number(params.min) * 100);
  if (params.max) range.$lte = Math.max(0, Number(params.max) * 100);
  if (Object.keys(range).length) filter["variants.price"] = range;
  const sorts = {
    featured: { featured: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    price: { "variants.price": 1 },
    "price-desc": { "variants.price": -1 },
    name: { name: 1 },
  };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sorts[params.sort] || sorts.newest)
      .skip((page - 1) * 12)
      .limit(12)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    items: JSON.parse(JSON.stringify(items)),
    total,
    page,
    pages: Math.ceil(total / 12),
  };
}

export async function facets() {
  await db();
  const [categories, brands] = await Promise.all([
    Category.find().sort({ name: 1 }).select("name").lean(),
    Brand.find().sort({ name: 1 }).select("name").lean(),
  ]);
  return {
    categories: categories.map((x) => x.name),
    brands: brands.map((x) => x.name),
  };
}
