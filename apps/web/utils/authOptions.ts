import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { Provider } from "next-auth/providers/index";
import { prisma } from "@repo/prisma-db";
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    // Configure one or more authentication providers
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD
          }
        },
        from: process.env.EMAIL_FROM
      }),
    ] as Provider[],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  };