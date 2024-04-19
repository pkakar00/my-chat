import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import useragent from "useragent";
import { WebSocketServer } from "ws";
import { createClient } from "redis";
import { RedisSubscriptionManager } from "./RedisClient.js";
import { prisma } from "@repo/prisma-db";
export type ChatMsg = {
  content: string;
  timestamp: Date;
  senderId: string;
  receiverId: string;
};
const client = createClient({url:process.env.REDIS_URL});
console.log(process.env.REDIS_URL);

client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(cors());
app.use(bodyParser.json());

app.get("/heath-check", (req, res) => {
  res.sendStatus(200);
});
app.get("/register-device", (req, res) => {
  console.log("ip address");
  console.log(req.socket.remoteAddress);
  
  
  const userAgentString = req.headers["user-agent"];

  // Parse the user agent string using the useragent package
  const userAgent = useragent.parse(userAgentString);
  console.log("useragent header");
  console.log(userAgentString);
  

  // Extract device information
  const deviceInfo = {
    browser: userAgent.toAgent(),
    os: userAgent.os.toString(),
    device: userAgent.device.toString(),
  };
  // console.log(deviceInfo);
  // console.log("\n\nRemaining information\n\n\n");
  // console.log(userAgent.device);

  res.sendStatus(200);
});

wss.on("connection", async (ws) => {
  console.log("Connected");
  let userId: string | null = null;
  let deviceId: string | null = null;
  ws.on("message", async (data: string) => {
    const parsedData: {
      type: string;
      deviceId: string;
      userId: string;
      message: string | null;
      receiverId: string | null;
      payload: any;
      receiverEmailId: string | null;
    } = JSON.parse(data);
    userId = parsedData.userId;
    deviceId = parsedData.deviceId;
    console.log(parsedData);

    switch (parsedData.type.toLowerCase()) {
      case "subscribe-userid":
        console.log("Subscribe inside");
        const dbUser = await prisma.user.findUnique({ where: { id: userId! } });
        if (dbUser) {
          RedisSubscriptionManager.getInstance().subscribe(
            dbUser.id,
            deviceId,
            ws
          );
        } else console.log("Subscription failed");
        break;
      case "publish-message":
        const data: ChatMsg = {
          content: parsedData.message!,
          timestamp: new Date(),
          senderId: userId,
          receiverId: parsedData.receiverId!,
        };
        await RedisSubscriptionManager.getInstance().addChatMessage(
          userId,
          data
        );
        await prisma.chatMessage.create({
          data,
        });
        break;
      case "send-request":
        const receiverEmailId = parsedData.receiverEmailId!;
        const receiver = await prisma.user.findUnique({
          where: { email: receiverEmailId },
        });

        //db call to send request
        await prisma.request.create({
          data: { receiverId: receiver!.id, senderId: userId },
        });
        await RedisSubscriptionManager.getInstance().sendRequest(
          userId,
          receiver!.id
        );
        break;
      case "accept-request":
        const receiverEmailId2 = parsedData.receiverEmailId!;
        const receiver2 = await prisma.user.findUnique({
          where: { email: receiverEmailId2 },
        });
        const receiverUserId2 = receiver2!.id;
        //db call to check request
        await prisma.request.delete({
          where: {
            receiverId_senderId: {
              receiverId: userId,
              senderId: receiverUserId2,
            },
          },
        });
        await prisma.contact.create({
          data: { userId: userId, recieverId: receiverUserId2 },
        });
        await prisma.contact.create({
          data: { userId: receiverUserId2, recieverId: userId },
        });
        await RedisSubscriptionManager.getInstance().acceptRequest(
          userId,
          receiverUserId2
        );
        break;
      case "remove-contact":
        console.log("remove contact inside");

        const receiverEmailId3 = parsedData.receiverEmailId!;
        const receiver3 = await prisma.user.findUnique({
          where: { email: receiverEmailId3 },
        });
        const receiverUserId3 = receiver3!.id;
        //db call to check request
        await prisma.contact.delete({
          where: {
            recieverId_userId: {
              userId,
              recieverId: receiverUserId3,
            },
          },
        });
        await prisma.contact.delete({
          where: {
            recieverId_userId: {
              userId: receiverUserId3,
              recieverId: userId,
            },
          },
        });
        RedisSubscriptionManager.getInstance().removeContact(
          userId,
          receiverUserId3
        );
        RedisSubscriptionManager.getInstance().removeContact(
          receiverUserId3,
          userId
        );
    }
  });
  ws.on("close", () => {
    console.log("Disconnect called");
    RedisSubscriptionManager.getInstance().unsubscribe(deviceId!, userId!);
  });
});

server.listen(3001, () => {
  console.log("Listening at 3001");
});

export async function getSentRequests(senderId: string) {
  return await prisma.request.findMany({
    where: { senderId },
    include: { sender: true },
  });
}
export async function getReceivedRequests(receiverId: string) {
  return await prisma.request.findMany({
    where: { receiverId },
    include: { receiver: true },
  });
}
