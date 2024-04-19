import { prisma } from "@repo/prisma-db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  const email = session?.user?.email;
  try {
    if(!email) throw new Error("Email not found");
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) throw new Error("User not found");
    
    const userContacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
      },
      include: {
        receiver: true,
      },
    });
    return Response.json(userContacts.map((x) => x.receiver));
  } catch (e) {
    const error:{message:string}=e as any;
    return new Response(error.message, { status: 500 });
  }
}