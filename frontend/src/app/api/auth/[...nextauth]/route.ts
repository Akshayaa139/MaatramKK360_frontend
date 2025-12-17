import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const url = `${base.replace(/\/+$/, '')}/api/auth/login`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              token: user.token,
            };
          }
          
          return null;
        } catch (error) {
          try {
            const fallback = `http://127.0.0.1:5000/api/auth/login`;
            const res2 = await fetch(fallback, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            });
            const user2 = await res2.json();
            if (res2.ok && user2) {
              return {
                id: user2._id,
                name: user2.name,
                email: user2.email,
                role: user2.role,
                token: user2.token,
              };
            }
            return null;
          } catch (e2) {
            console.error("Authentication error:", error, e2);
            return null;
          }
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        (token as any).accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session as any).accessToken = (token as any).accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
});

export { handler as GET, handler as POST };
