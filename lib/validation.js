import { z } from "zod";
export const id = z.string().regex(/^[a-f0-9]{24}$/i);
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(80),
});
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  line1: z.string().trim().min(4).max(160),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().min(2).max(20),
  country: z.literal("US"),
  phone: z.string().regex(/^[+0-9 ()-]{7,24}$/),
});
export const checkoutSchema = z
  .object({
    items: z
      .array(
        z.object({
          sku: z.string().min(1).max(80),
          quantity: z.number().int().min(1).max(10),
        }),
      )
      .min(1)
      .max(30),
    address: addressSchema,
    coupon: z
      .string()
      .trim()
      .max(40)
      .transform((v) => v.toUpperCase())
      .optional(),
    method: z.enum(["cod", "stripe"]),
  })
  .superRefine((v, c) => {
    if (new Set(v.items.map((i) => i.sku)).size !== v.items.length)
      c.addIssue({ code: "custom", message: "Duplicate SKU" });
  });
export const productSchema = z
  .object({
    name: z.string().min(2).max(160),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(180),
    description: z.string().max(5000),
    category: z.string().max(80),
    brand: z.string().max(80),
    images: z
      .array(
        z.url().refine((v) => {
          try {
            return (
              new URL(v).protocol === "https:" &&
              ["res.cloudinary.com", "images.unsplash.com"].includes(
                new URL(v).hostname,
              )
            );
          } catch {
            return false;
          }
        }),
      )
      .max(8),
    specifications: z.record(z.string().max(80), z.string().max(300)),
    variants: z
      .array(
        z.object({
          sku: z
            .string()
            .regex(/^[A-Z0-9-]+$/)
            .max(80),
          name: z.string().max(80),
          price: z.number().int().min(1).max(10000000),
          stock: z.number().int().min(0).max(100000),
        }),
      )
      .min(1)
      .max(30),
    active: z.boolean(),
    featured: z.boolean(),
  })
  .refine(
    (v) => new Set(v.variants.map((x) => x.sku)).size === v.variants.length,
    { message: "SKUs must be unique" },
  );
export const couponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]{2,40}$/),
  percent: z.number().int().min(1).max(100),
  minimum: z.number().int().min(0),
  limit: z.number().int().min(1),
  expiresAt: z.iso.datetime(),
  active: z.boolean(),
});
