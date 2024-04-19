import { prisma, Request, User } from "@repo/prisma-db";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("User not authenticated");
    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
    });
    if (!user) throw new Error("User does not exist");
    const requestsAsSender = await prisma.request.findMany({
      where: {
        senderId: user.id,
      },
      include: { receiver: true },
    });
    const requestsAsRec = await prisma.request.findMany({
      where: {
        receiverId: user.id,
      },
      include: { sender: true },
    });
    return Response.json({
      senderReq: requestsAsSender,
      receiverReq: requestsAsRec,
    });
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}
export type ReqsAsSender = (Request & { receiver: User })[];
export type ReqsAsReceiver = (Request & { sender: User })[];
export type RequestReturnType = {
  senderReq: ReqsAsSender;
  receiverReq: ReqsAsReceiver;
};
