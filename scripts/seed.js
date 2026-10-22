import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { db } from "../lib/db.js";
import {
  Product,
  User,
  Category,
  Brand,
  Coupon,
  Order,
  Review,
  WebhookEvent,
  Rate,
} from "../lib/models.js";
await db();
await Promise.all(
  [
    Product,
    User,
    Category,
    Brand,
    Coupon,
    Order,
    Review,
    WebhookEvent,
    Rate,
  ].map((m) => m.init()),
);
const products = [
  [
    "Sony WH-1000XM5",
    "sony-wh-1000xm5",
    "Sony",
    "Audio",
    34999,
    25,
    "photo-1546435770-a3e426bf472b",
    "Distraction off. Your world on. Industry-leading noise cancellation, rich wireless audio, and all-day comfort.",
    {
      "Battery life": "Up to 30 hours",
      Connectivity: "Bluetooth 5.2",
      Weight: "250 g",
    },
  ],
  [
    "MacBook Air 13-inch",
    "macbook-air-13",
    "Apple",
    "Computing",
    109900,
    12,
    "photo-1517336714731-489689fd1ca8",
    "A beautifully portable workspace. A bright display, effortless performance, and the freedom to work anywhere.",
    {
      Memory: "16 GB",
      Storage: "256 GB SSD",
      Display: "13.6-inch Liquid Retina",
    },
  ],
  [
    "SoundLink Flex",
    "bose-soundlink-flex",
    "BOSE",
    "Audio",
    14900,
    30,
    "photo-1608043152269-423dbba4e7e1",
    "Big sound. Anywhere you go. A portable speaker with clear, balanced audio and a rugged waterproof design.",
    {
      "Battery life": "Up to 12 hours",
      Rating: "IP67",
      Connectivity: "Bluetooth",
    },
  ],
  [
    "MX Master 3S",
    "logitech-mx-master-3s",
    "logitech",
    "Accessories",
    9999,
    35,
    "photo-1527814050087-3793815479db",
    "Make every move count. Precise scrolling and quiet clicks in a shape built for long creative sessions.",
    {
      Sensor: "8,000 DPI",
      Connectivity: "Bluetooth / USB receiver",
      Charging: "USB-C",
    },
  ],
  [
    "Galaxy S24",
    "samsung-galaxy-s24",
    "SAMSUNG",
    "Mobile",
    79900,
    15,
    "photo-1511707171634-5f897ff02aa9",
    "Stay connected to what matters. A sharp display, capable camera system, and a compact everyday profile.",
    { Storage: "128 GB", Display: "6.2-inch AMOLED", Camera: "50 MP" },
  ],
  [
    "Everyday USB-C Hub",
    "anker-usb-c-hub",
    "anker",
    "Accessories",
    5999,
    40,
    "photo-1625842268584-8f3296236761",
    "One small hub. A world of possibilities. Connect your display, storage, and power with a single cable.",
    { Ports: "7-in-1", Power: "100 W pass-through", Video: "4K HDMI" },
  ],
  [
    "Everyday Smart Watch",
    "everyday-smart-watch",
    "VOLT",
    "Wearables",
    12900,
    20,
    "photo-1523275335684-37898b6baf30",
    "Keep your day in rhythm with helpful notifications, activity tracking, and a clean, readable display.",
    { Display: "AMOLED", Rating: "5 ATM", "Battery life": "Up to 7 days" },
  ],
  [
    "Studio Wireless Earbuds",
    "studio-wireless-earbuds",
    "VOLT",
    "Audio",
    7900,
    50,
    "photo-1606220945770-b5b6c2c55bf1",
    "Your soundtrack, without the wires. Comfortable wireless earbuds for commutes, calls, and quiet moments.",
    {
      Connectivity: "Bluetooth 5.3",
      "Battery life": "Up to 24 hours with case",
      Charging: "USB-C",
    },
  ],
];
for (const [
  name,
  slug,
  brand,
  category,
  price,
  stock,
  photo,
  description,
  specifications,
] of products) {
  await Category.updateOne(
    { slug: category.toLowerCase() },
    { $setOnInsert: { name: category } },
    { upsert: true },
  );
  await Brand.updateOne(
    { slug: brand.toLowerCase() },
    { $setOnInsert: { name: brand } },
    { upsert: true },
  );
  await Product.updateOne(
    { slug },
    {
      $setOnInsert: {
        name,
        slug,
        brand,
        category,
        description,
        specifications,
        images: [
          `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1000&q=80`,
        ],
        featured: ["sony-wh-1000xm5", "logitech-mx-master-3s"].includes(slug),
        variants: [{ sku: slug.toUpperCase(), name: "Standard", price, stock }],
      },
    },
    { upsert: true },
  );
}
await Coupon.updateOne(
  { code: "WELCOME10" },
  {
    $setOnInsert: {
      percent: 10,
      minimum: 5000,
      limit: 100,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      active: true,
    },
  },
  { upsert: true },
);
if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
  if (process.env.SEED_ADMIN_PASSWORD.length < 16)
    throw Error("Admin password must be at least 16 characters");
  await User.updateOne(
    { email: process.env.SEED_ADMIN_EMAIL.toLowerCase() },
    {
      $setOnInsert: {
        name: "Store administrator",
        password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12),
        role: "admin",
      },
    },
    { upsert: true },
  );
}
console.log("Seed complete. Existing products and accounts were preserved.");
await mongoose.disconnect();
