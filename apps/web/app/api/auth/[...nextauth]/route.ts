import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { Provider } from "next-auth/providers/index";
import { prisma } from "@repo/prisma-db";
import { PrismaAdapter } from "@auth/prisma-adapter";


export const authOptions = {
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
    // CredentialsProvider({
    //   name: "Email",
    //   credentials: {
    //     email: { label: "email", type: "text", placeholder: "abc@gmail.com" },
    //   },
    //   async authorize(credentials, req) {
    //     const user = await prisma.user.findUnique({
    //       where: { email: credentials?.email },
    //     });
    //     if (!user) return null;
    //     else return user;
    //   },
    // }),
  ] as Provider[],
  // callbacks: {
  //   async signIn({ user, account, profile, email, credentials }) {
  //     console.log("email= "+email);
  //     console.log("profile= "+profile);
  //     console.log("credentials= "+credentials);
  //     console.log("account= "+account);
  //     console.log("user= "+user);
      
  //     const dbUser = await prisma.user.findUnique({
  //       where: { email: profile?.email },
  //     });
  //     if (!dbUser){
  //       await prisma.user.create({data:{email, deviceInfo:[]}});
  //     }
  //     return true;
  //   },
  // },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { encryption: true },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };