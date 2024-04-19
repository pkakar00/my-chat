import { prisma, User } from "@repo/prisma-db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    if (!email) throw new Error("Email not recieved");

    const user = await prisma.user.findUnique({
      where: { email: session!.user!.email! },
    });
    const contacts = await prisma.contact.findMany({
      where: { userId: user?.id },
    });
    console.log("contacts");
    console.log(contacts);

    const users = await prisma.user.findMany({
      where: { email: { startsWith: email } },
    });
    const usersAlreadyAdded: User[] = [];
    const usersNotAdded: User[] = [];
    users.forEach((value) => {
      if (value.email === session?.user?.email) usersAlreadyAdded.push(value);
      else {
        let contactExists = false;
        contacts.forEach((x) => {
          if (x.recieverId === value.id) contactExists = true;
        });
        if (contactExists) usersAlreadyAdded.push(value);
        else usersNotAdded.push(value);
      }
    });
    const response: Recommendations = {
      usersAlreadyAdded,
      usersNotAdded,
    };
    return Response.json(response);
  } catch (e) {
    const error: { message: string } = e as any;
    return new Response(error.message, { status: 500 });
  }
}
export type Recommendations = {
  usersAlreadyAdded: User[];
  usersNotAdded: User[];
};
