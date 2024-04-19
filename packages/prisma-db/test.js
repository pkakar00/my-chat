// import { PrismaClient, User, Contact } from "@prisma/client";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function abc() {
  // await prisma.contact.delete({
  //   where: {
  //     recieverId_userId: {
  //       userId: "clt1f76fr0003olz2i5tu5zdj",
  //       recieverId: "clt1f76fr0003olz2i5tu5zdj",
  //     },
  //   },
  // });
  // await prisma.contact.delete({
  //   where: {
  //     recieverId_userId: {
  //       userId: "clt1f6x5w0000olz2rv0571px",
  //       recieverId: "clt1f76fr0003olz2i5tu5zdj",
  //     },
  //   },
  // });
  // await prisma.contact.delete({
  //   where: {
  //     recieverId_userId: {
  //       recieverId: "clt1f6x5w0000olz2rv0571px",
  //       userId: "clt1f76fr0003olz2i5tu5zdj",
  //     },
  //   },
  // });
  // await prisma.contact.create({
  //     data: { userId: "clt1f6x5w0000olz2rv0571px", recieverId: "clt1hxv7g00007u21ktkule5d" },
  //   });
  // await prisma.user.delete({where:{email:"pulkitkakkar@hotmail.com"}})
}
abc();