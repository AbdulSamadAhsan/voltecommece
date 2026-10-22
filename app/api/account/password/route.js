import bcrypt from "bcryptjs";
import { z } from "zod";
import { route, origin, body, limit, fail } from "@/lib/http";
import { requireUser } from "@/lib/access";
import { User, Audit } from "@/lib/models";
import { transaction } from "@/lib/db";
export const POST = route(async (req) => {
  origin(req);
  const user = await requireUser();
  await limit(`password:${user.id}`, 5);
  const data = await body(
    req,
    z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12).max(128),
      })
      .refine((v) => v.currentPassword !== v.newPassword, {
        message: "Choose a different new password",
      }),
  );
  const record = await User.findById(user._id).select("+password");
  if (!(await bcrypt.compare(data.currentPassword, record.password)))
    fail(400, "Current password is incorrect");
  const hash = await bcrypt.hash(data.newPassword, 12);
  await transaction(async (session) => {
    const result = await User.updateOne(
      { _id: user._id, password: record.password },
      { $set: { password: hash }, $inc: { sessionVersion: 1 } },
      { session },
    );
    if (!result.modifiedCount)
      fail(409, "Password changed elsewhere. Sign in and try again.");
    await Audit.create(
      [
        {
          actor: user._id,
          action: "account.password_changed",
          target: user.id,
        },
      ],
      { session },
    );
  });
  return { ok: true };
});
