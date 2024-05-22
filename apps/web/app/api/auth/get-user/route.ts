import { prisma } from "@repo/prisma-db";
import { log } from "console";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) throw new Error("Email not found");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");
    log(user);
    return Response.json(user);
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}