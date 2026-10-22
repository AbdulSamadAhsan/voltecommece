import mongoose from "mongoose";
const { Schema } = mongoose;
const opts = { timestamps: true };
const model = (n, s) =>
  mongoose.models[n] || mongoose.model(n, s, `volt_${n.toLowerCase()}s`);
const address = new Schema(
  {
    name: String,
    line1: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  { _id: false },
);
const user = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    disabled: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    addresses: [address],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  opts,
);
const variant = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, min: 0, required: true },
  stock: { type: Number, min: 0, required: true },
});
const product = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    category: { type: String, index: true },
    brand: { type: String, index: true },
    images: [String],
    specifications: { type: Map, of: String },
    variants: { type: [variant], required: true },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  opts,
);
product.index({ "variants.sku": 1 }, { unique: true });
product.index({ name: "text", description: "text", brand: "text" });
product.index({ active: 1, createdAt: -1 });
const order = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, index: true },
    key: { type: String, required: true },
    fingerprint: String,
    items: [
      {
        product: Schema.Types.ObjectId,
        sku: String,
        name: String,
        variant: String,
        quantity: Number,
        price: Number,
      },
    ],
    address,
    subtotal: Number,
    discount: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    currency: { type: String, default: "usd" },
    coupon: String,
    method: { type: String, enum: ["cod", "stripe"] },
    state: {
      type: String,
      enum: [
        "reserved",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "expired",
        "refund_pending",
        "refunded",
      ],
      default: "reserved",
    },
    paid: { type: Boolean, default: false },
    expiresAt: Date,
    checkoutSession: String,
    paymentIntent: String,
    tracking: String,
    refundReason: String,
  },
  opts,
);
order.index({ user: 1, key: 1 }, { unique: true });
order.index({ state: 1, expiresAt: 1 });
const coupon = new Schema(
  {
    code: { type: String, unique: true, required: true },
    percent: { type: Number, min: 1, max: 100 },
    minimum: { type: Number, default: 0 },
    limit: { type: Number, min: 1, required: true },
    uses: { type: Number, default: 0, min: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  opts,
);
const taxonomy = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  opts,
);
const review = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    product: { type: Schema.Types.ObjectId, required: true },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    body: String,
  },
  opts,
);
review.index({ user: 1, product: 1 }, { unique: true });
const event = new Schema(
  { eventId: { type: String, unique: true }, type: String },
  opts,
);
const rate = new Schema({ _id: String, count: Number, expiresAt: Date });
rate.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const User = model("User", user),
  Product = model("Product", product),
  Order = model("Order", order),
  Coupon = model("Coupon", coupon),
  Category = model("Category", taxonomy.clone()),
  Brand = model("Brand", taxonomy.clone()),
  Review = model("Review", review),
  WebhookEvent = model("WebhookEvent", event),
  Rate = model("Rate", rate),
  Audit = model(
    "Audit",
    new Schema(
      { actor: Schema.Types.ObjectId, action: String, target: String },
      opts,
    ),
  );

export const Maintenance = model(
  "Maintenance",
  new Schema({ _id: String, lastRun: Date }),
);
