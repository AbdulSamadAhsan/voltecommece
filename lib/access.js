import { auth } from "../auth.js";
import { db } from "./db.js";
import { User } from "./models.js";
import { fail } from "./http.js";
export async function requireUser(admin = false) {
  const session = await auth();
  if (!session?.user?.id) fail(401, "Sign in required");
  await db();
  const user = await User.findById(session.user.id);
  if (
    !user ||
    user.disabled ||
    (user.sessionVersion || 0) !== (session.user.sessionVersion || 0)
  )
    fail(401, "Account unavailable");
  if (admin && user.role !== "admin")
    fail(403, "Administrator access required");
  return user;
}
