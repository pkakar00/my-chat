"use server";
import { prisma } from "@repo/prisma-db";

export async function createUserInDb(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ status: boolean; error: string }> {
  try {
    const checkUser = await prisma.user.findUnique({ where: { email } });
    if (checkUser) throw new Error("Email already used");
    await prisma.user.create({
      data: {
        name: firstName + " " + lastName,
        email,
      },
    });
    return { status: true, error: "" };
  } catch (e) {
    const error: { message: string } = e as any;
    return { status: false, error: error.message as string };
  }
}
export async function checkUserExists(email: string) {
  const checkUser = await prisma.user.findUnique({ where: { email } });
  return checkUser ? true : false;
}