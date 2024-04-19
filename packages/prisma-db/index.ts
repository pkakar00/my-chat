import { PrismaClient, User, Contact, ChatMessage, Request } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export { prisma };
export type { User, Contact, ChatMessage, Request };