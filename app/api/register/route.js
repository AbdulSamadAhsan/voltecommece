import bcrypt from "bcryptjs";
import { route, origin, body, limit } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { User } from "@/lib/models";
export const POST = route(async (req) => {
  origin(req);
  await limit(`register:${req.headers.get("x-forwarded-for") || "unknown"}`, 5);
  const data = await body(req, registerSchema);
  await User.create({
    ...data,
    password: await bcrypt.hash(data.password, 12),
  });
  return { ok: true };
});
