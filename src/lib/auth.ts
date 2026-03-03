import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, auth, signIn, signOut } = (NextAuth as any)({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  callbacks: {
    async signIn({ user }: { user: Record<string, unknown> }) {
      if (!user.email) return false;
      return true;
    },

    async jwt({
      token,
      user,
      account,
    }: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
      account?: Record<string, unknown>;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.image = user.image;
        token.name = user.name;
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Record<string, unknown>;
      token: Record<string, unknown>;
    }) {
      if (session && session.user) {
        (session.user as Record<string, unknown>).id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allow redirect to relative urls
      if (url.startsWith("/")) {
        return url;
      }
      // Allow redirect to same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
});
