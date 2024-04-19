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
    const checkRequest = await prisma.request.findUnique({
      where: {
        receiverId_senderId: { senderId: sender!.id, receiverId: receiver!.id },
      },
    });
    if (checkRequest) return Response.json({ requestSent: true });
    else return Response.json({ requestSent: false });
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}