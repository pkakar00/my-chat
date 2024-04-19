import { prisma } from "@repo/prisma-db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  try {
    const searchParams = request.nextUrl.searchParams;
    const senderEmail = session?.user?.email;
    const checkEmail = searchParams.get("email");
    if (!(senderEmail && checkEmail)) throw new Error("Emails not recieved");
    const sender = await prisma.user.findUnique({
      where: { email: senderEmail },
    });
    const receiver = await prisma.user.findUnique({
      where: { email: checkEmail },
    });
    const checkContact1 = await prisma.contact.findUnique({
      where: {
        recieverId_userId: {
          userId: sender!.id,
          recieverId: receiver!.id,
        },
      },
    });
    const checkContact2 = await prisma.contact.findUnique({
      where: {
        recieverId_userId: {
          recieverId: sender!.id,
          userId: receiver!.id,
        },
      },
    });
    if (checkContact1 && checkContact2)
      return Response.json({ contactExists: true });
    else return Response.json({ contactExists: false });
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}
