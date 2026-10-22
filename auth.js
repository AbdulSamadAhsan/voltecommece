import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./lib/db.js";
import { User } from "./lib/models.js";
import { loginSchema } from "./lib/validation.js";
import { limit } from "./lib/http.js";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 86400 },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        await limit(
          `login-ip:${request.headers.get("x-forwarded-for") || "unknown"}`,
          30,
        );
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        await limit(`login:${parsed.data.email}`, 8);
        await db();
        const u = await User.findOne({ email: parsed.data.email }).select(
          "+password",
        );
        const valid = await bcrypt.compare(
          parsed.data.password,
          u?.password ||
            "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5KQXU8AHZ2q1UcD7f3ogb4wR9.yVxeK",
        );
        if (!u || !valid || u.disabled) return null;
        return {
          id: String(u._id),
          name: u.name,
          email: u.email,
          sessionVersion: u.sessionVersion || 0,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion || 0;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.sessionVersion = token.sessionVersion || 0;
      return session;
    },
  },
});
