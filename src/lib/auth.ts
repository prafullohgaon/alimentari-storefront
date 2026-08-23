import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { customerLogin, getCustomerProfile } from "@/lib/shopify";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Shopify Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        const { token, error } = await customerLogin(email, password);

        if (error || !token) {
          throw new Error(error || "Invalid credentials");
        }

        const profile = await getCustomerProfile(token);

        return {
          id: profile?.id || token,
          email: profile?.email || email,
          name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : email.split("@")[0],
          accessToken: token,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "apple") {
        if (user?.email) {
          const nameParts = (user.name || "Cliente Alimentari").trim().split(" ");
          const firstName = nameParts[0] || "Cliente";
          const lastName = nameParts.slice(1).join(" ") || "Alimentari";

          const { createSocialCustomer } = await import("@/lib/shopify");
          const socialRes = await createSocialCustomer(firstName, lastName, user.email);

          if (socialRes.accessToken) {
            user.accessToken = socialRes.accessToken;
          }
          if (socialRes.customerId) {
            user.id = socialRes.customerId;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/accedi",
    error: "/accedi",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days matching Shopify token
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
