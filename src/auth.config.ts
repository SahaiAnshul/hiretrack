import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // We populate this in auth.ts where Node APIs are allowed
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name) {
          token.name = session.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error - role is injected from jwt
        session.user.role = token.role;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;