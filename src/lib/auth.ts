import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      return true;
    },

    async jwt({ token, user, account, trigger }) {
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

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
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
