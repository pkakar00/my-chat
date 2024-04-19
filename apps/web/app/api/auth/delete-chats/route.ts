import { prisma } from "@repo/prisma-db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  try {
    const searchParams = request.nextUrl.searchParams;
    const senderEmail = session?.user?.email;
    console.log("Sender = " + senderEmail);

    const receiverEmail = searchParams.get("recieverEmail");
    console.log("Rec-email = " + receiverEmail);
    if (!(senderEmail && receiverEmail)) throw new Error("Emails not recieved");
    const senderUser = await prisma.user.findUnique({
      where: { email: senderEmail },
    });
    const receiverUser = await prisma.user.findUnique({
      where: { email: receiverEmail },
    });
    if (!senderUser || !receiverUser) throw new Error("Emails in correct");
    const chats = await prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { senderId: senderUser.id, receiverId: receiverUser.id },
          { senderId: receiverUser.id, receiverId: senderUser.id },
        ],
      },
    });
    return Response.json({ chats });
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}