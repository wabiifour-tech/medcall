import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcrypt";

// Password hashing utility
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hashedPassword);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        matricNumber: { label: "Matric Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.matricNumber || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            matricNumber: credentials.matricNumber.toUpperCase(),
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // Lock profile after first successful login
        if (!user.profileLocked) {
          await db.user.update({
            where: { id: user.id },
            data: { profileLocked: true },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          matricNumber: user.matricNumber,
          role: user.role,
          profileLocked: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.matricNumber = user.matricNumber;
        token.role = user.role;
        token.profileLocked = user.profileLocked;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.matricNumber = token.matricNumber as string;
        session.user.role = token.role as string;
        session.user.profileLocked = token.profileLocked as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "medcall-secret-key-change-in-production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
