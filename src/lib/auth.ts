import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const getAdminEmails = (): string[] => {
  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const list = envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!list.includes("khanhasnain2310@gmail.com")) {
    list.push("khanhasnain2310@gmail.com");
  }
  return list;
};

export const isUserAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const adminList = getAdminEmails();
  return adminList.includes(clean) || clean.startsWith("admin@");
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "instafame_secret_key_default_384729184719284712",
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account }) {
      if (user?.email) {
        const isAdmin = isUserAdmin(user.email);
        const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
        try {
          await fetch(`${PYTHON_BACKEND_URL}/api/users/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: user.id || user.email,
              email: user.email,
              name: user.name || "",
              avatar_url: user.image || "",
              provider: "google",
              role: isAdmin ? "admin" : "user",
            }),
            signal: AbortSignal.timeout(3000),
          });
        } catch {
          // ignore error to prevent blocking login
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAdmin = isUserAdmin(user.email);
        token.role = token.isAdmin ? "admin" : "user";
      } else if (token.email) {
        token.isAdmin = isUserAdmin(token.email);
        token.role = token.isAdmin ? "admin" : "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          (session.user as any).id = token.sub;
        }
        const userEmail = session.user.email || (token.email as string);
        const isAdmin = Boolean(token.isAdmin || isUserAdmin(userEmail));
        (session.user as any).isAdmin = isAdmin;
        (session.user as any).role = isAdmin ? "admin" : "user";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url === "/login" ? `${baseUrl}/dashboard` : `${baseUrl}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return parsed.pathname === "/login" ? `${baseUrl}/dashboard` : url;
        }
      } catch (_) {}
      return `${baseUrl}/dashboard`;
    },
  },
};
