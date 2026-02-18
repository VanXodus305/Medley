import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "./db";
import User from "@/models/User";

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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        await connectDB();

        // Check if user exists
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // User doesn't exist, will be redirected to register
          return true;
        }

        // User exists, sign in normally
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      if (account) {
        token.provider = account.provider;
      }

      try {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.userType = dbUser.userType;
          token.id = dbUser._id.toString();
        } else {
          // Mark that user needs registration
          token.needsRegistration = true;
        }
      } catch (error) {
        console.error("JWT callback error:", error);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as string | undefined;
        session.user.needsRegistration = token.needsRegistration as
          | boolean
          | undefined;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // If url is login or base, check if user is new
      if (url === baseUrl || url.includes("/api/auth/callback")) {
        return `${baseUrl}/register`;
      }

      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  secret: process.env.AUTH_SECRET,
});
