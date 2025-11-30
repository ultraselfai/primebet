import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      phone?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    phone?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: { 
    strategy: "jwt",
    // Sessão mais longa para evitar re-autenticações frequentes
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    // Atualizar sessão a cada 24 horas (não a cada request)
    updateAge: 24 * 60 * 60, // 24 horas
  },
  // JWT mais eficiente
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        // Query otimizada - só busca campos necessários
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            phone: true,
            status: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Credenciais inválidas");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Credenciais inválidas");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Conta bloqueada. Entre em contato com o suporte.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    // JWT callback otimizado - só atualiza quando necessário
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.phone = user.phone;
      }
      // Atualizar dados do usuário se solicitado
      if (trigger === "update") {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, phone: true, name: true },
        });
        if (freshUser) {
          token.role = freshUser.role;
          token.phone = freshUser.phone;
          token.name = freshUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.phone = token.phone as string | null | undefined;
      }
      return session;
    },
  },
});
