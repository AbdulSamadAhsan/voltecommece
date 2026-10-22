import { ZodError } from "zod";
import { db } from "./db.js";
import { Rate } from "./models.js";
import { createHash } from "node:crypto";
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export async function limit(key, max = 60) {
  await db();
  const bucket = Math.floor(Date.now() / 60000);
  const hash = createHash("sha256").update(key).digest("hex");
  const r = await Rate.findOneAndUpdate(
    { _id: `${hash}:${bucket}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 2) * 60000) },
    },
    { upsert: true, new: true },
  );
  if (r.count > max) fail(429, "Too many requests. Try again shortly.");
}
export function origin(req) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const expected = new URL(process.env.AUTH_URL || "http://localhost:3000")
    .origin;
  if (req.headers.get("origin") !== expected)
    fail(403, "Invalid request origin");
}
export async function body(req, schema) {
  if (Number(req.headers.get("content-length") || 0) > 64000)
    fail(413, "Request too large");
  const raw = await req.text();
  if (raw.length > 64000) fail(413, "Request too large");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    fail(400, "Invalid JSON");
  }
  return schema.parse(data);
}
export const route =
  (fn) =>
  async (...args) => {
    try {
      return Response.json(await fn(...args), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (e) {
      if (e instanceof ZodError)
        return Response.json(
          { error: "Invalid input", fields: e.flatten() },
          { status: 400 },
        );
      if (e.code === 11000)
        return Response.json(
          { error: "Record already exists" },
          { status: 409 },
        );
      if (!e.status) console.error(e);
      return Response.json(
        { error: e.status ? e.message : "Service unavailable. Please retry." },
        { status: e.status || 503 },
      );
    }
  };
